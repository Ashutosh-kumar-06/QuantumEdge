import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface MultiplayerVideoCallProps {
  socket: Socket;
  roomId: string;
  username: string;
  canMic?: boolean;
  canCam?: boolean;
}

interface PeerConnectionMap {
  [socketId: string]: RTCPeerConnection;
}

export default function MultiplayerVideoCall({ socket, roomId, username, canMic = true, canCam = true }: MultiplayerVideoCallProps) {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: MediaStream }>({});
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<PeerConnectionMap>({});

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    socket.on('user_joined_video', async ({ socketId }) => {
      if (!videoEnabled) return;
      const pc = createPeerConnection(socketId);
      peersRef.current[socketId] = pc;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('video_offer', { roomId, offer, senderId: socket.id, targetId: socketId });
      } catch (e) {
        console.error("Error creating offer:", e);
      }
    });

    socket.on('video_offer', async ({ offer, socketId: incomingSocketId }) => {
      if (!videoEnabled) return;
      const pc = peersRef.current[incomingSocketId] || createPeerConnection(incomingSocketId);
      peersRef.current[incomingSocketId] = pc;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('video_answer', { roomId, answer, senderId: socket.id, targetId: incomingSocketId });
      } catch (e) {
        console.error("Error handling offer:", e);
      }
    });

    socket.on('video_answer', async ({ answer, socketId: incomingSocketId }) => {
      const pc = peersRef.current[incomingSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error("Error handling answer:", e);
        }
      }
    });

    socket.on('new_ice_candidate', async ({ candidate, socketId: incomingSocketId }) => {
      const pc = peersRef.current[incomingSocketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
      }
    });

    socket.on('user_left_video', ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[socketId];
        return newStreams;
      });
    });

    return () => {
      socket.off('user_joined_video');
      socket.off('video_offer');
      socket.off('video_answer');
      socket.off('new_ice_candidate');
      socket.off('user_left_video');
    };
  }, [socket, roomId, videoEnabled]);

  const createPeerConnection = (targetId: string) => {
    const pc = new RTCPeerConnection(iceServers);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('new_ice_candidate', { roomId, candidate: event.candidate, senderId: socket.id, targetId });
      }
    };
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetId]: event.streams[0]
      }));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[targetId];
          return newStreams;
        });
        delete peersRef.current[targetId];
      }
    };
    
    // Add current stream tracks (either camera or screen)
    const streamToShare = isScreenSharing ? screenStreamRef.current : localStreamRef.current;
    if (streamToShare) {
      streamToShare.getTracks().forEach(track => {
        pc.addTrack(track, streamToShare);
      });
    }

    return pc;
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setVideoEnabled(true);
      setCameraEnabled(true);
      setAudioEnabled(true);
      socket.emit('join_video_room', { roomId, username });
    } catch (err) {
      console.error("Failed to start video", err);
      alert("Could not access camera/microphone.");
    }
  };

  const leaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setVideoEnabled(false);
    setIsScreenSharing(false);
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    setRemoteStreams({});
    socket.emit('leave_video_room', { roomId, username });
  };

  const toggleMic = () => {
    if (!canMic) return;
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (!canCam) return;
    if (localStreamRef.current && !isScreenSharing) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        // Replace video track for all peers
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        // When user stops sharing via browser UI
        videoTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error("Failed to share screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    
    // Revert to camera track
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) sender.replaceTrack(videoTrack);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (videoEnabled) leaveMeeting();
    };
  }, [videoEnabled]);

  // UI state for fullscreen video grid
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0f', borderRadius: isFullscreen ? '0' : '12px', overflow: 'hidden', border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      {!isFullscreen && (
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64ffda', boxShadow: '0 0 10px #64ffda' }}></div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Team Session</span>
          </div>
          <div>
            {!videoEnabled && (
              <button onClick={startVideo} style={{ background: 'rgba(100, 255, 218, 0.1)', color: 'var(--primary)', border: '1px solid rgba(100, 255, 218, 0.3)', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                Join Meeting
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid of Videos */}
      {videoEnabled ? (
        <>
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', background: '#050505', alignContent: 'center', justifyContent: 'center' }}>
            
            {/* Local Video */}
            <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              {isScreenSharing ? (
                <VideoPlayer stream={screenStreamRef.current!} isLocal={false} />
              ) : (
                <VideoPlayer stream={localStreamRef.current!} isLocal={true} />
              )}
              
              <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.7)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {!audioEnabled && <span style={{ color: '#ff6b6b' }}>🔇</span>}
                You {isScreenSharing && "(Sharing Screen)"}
              </div>
            </div>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <div key={id} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                <VideoPlayer stream={stream} isLocal={false} />
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.7)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', color: '#fff' }}>
                  Peer {id.substring(0, 4)}
                </div>
              </div>
            ))}
          </div>

          {/* Zoom-like Toolbar */}
          <div style={{ padding: '1rem', background: '#181820', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
            
            {/* Mute Mic */}
            <button onClick={toggleMic} disabled={!canMic} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: audioEnabled ? '#fff' : '#ff6b6b', cursor: canMic ? 'pointer' : 'not-allowed', opacity: canMic ? 1 : 0.5, transition: 'transform 0.1s' }} onMouseDown={e => { if(canMic) e.currentTarget.style.transform = 'scale(0.9)'; }} onMouseUp={e => { if(canMic) e.currentTarget.style.transform = 'scale(1)'; }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: audioEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(255, 107, 107, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                {audioEnabled ? '🎤' : '🔇'}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{audioEnabled ? 'Mute' : 'Unmute'}</span>
            </button>

            {/* Stop Camera */}
            <button onClick={toggleCamera} disabled={!canCam || isScreenSharing} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: cameraEnabled ? '#fff' : '#ff6b6b', cursor: (!canCam || isScreenSharing) ? 'not-allowed' : 'pointer', opacity: (!canCam || isScreenSharing) ? 0.5 : 1, transition: 'transform 0.1s' }} onMouseDown={e => { if(canCam && !isScreenSharing) e.currentTarget.style.transform = 'scale(0.9)'; }} onMouseUp={e => { if(canCam && !isScreenSharing) e.currentTarget.style.transform = 'scale(1)'; }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: cameraEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(255, 107, 107, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                {cameraEnabled ? '📷' : '🚫'}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{cameraEnabled ? 'Stop Video' : 'Start Video'}</span>
            </button>

            {/* Screen Share */}
            <button onClick={toggleScreenShare} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: isScreenSharing ? 'var(--success)' : '#fff', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isScreenSharing ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                🖥️
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
            </button>
            
            {/* Fullscreen */}
            <button onClick={toggleFullscreen} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                ⛶
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Fullscreen</span>
            </button>

            {/* Leave Meeting */}
            <button onClick={leaveMeeting} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 'auto', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ width: '60px', height: '40px', borderRadius: '8px', background: '#ff4757', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)' }}>
                Leave
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>End Call</span>
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', background: '#111' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</div>
            <p>Video disabled. Click Join Meeting.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component to safely bind MediaStream to video element via ref
function VideoPlayer({ stream, isLocal }: { stream: MediaStream, isLocal: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  
  return (
    <video 
      ref={ref} 
      autoPlay 
      playsInline 
      muted={isLocal}
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover', 
        transform: isLocal ? 'scaleX(-1)' : 'none',
        background: '#000'
      }} 
    />
  );
}
