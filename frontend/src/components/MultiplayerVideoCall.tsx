import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface MultiplayerVideoCallProps {
  socket: Socket;
  roomId: string;
  username: string;
}

interface PeerConnectionMap {
  [socketId: string]: RTCPeerConnection;
}

export default function MultiplayerVideoCall({ socket, roomId, username }: MultiplayerVideoCallProps) {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: MediaStream }>({});
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<PeerConnectionMap>({});

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    // When someone joins, initiate WebRTC offer if we are broadcasting
    socket.on('user_joined_video', async ({ socketId }) => {
      if (!videoEnabled) return; // Only initiate if we have video enabled
      
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

    // Handle receiving an offer
    socket.on('video_offer', async ({ offer, socketId: incomingSocketId }) => {
      // The incoming socketId is the one who sent the offer
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

    // Handle receiving an answer
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

    // Handle ICE candidates
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

    // Handle user leaving
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setVideoEnabled(true);
      
      // Notify room we joined video so they send us offers
      socket.emit('join_video_room', { roomId, username });
    } catch (err) {
      console.error("Failed to start video", err);
      alert("Could not access camera/microphone.");
    }
  };

  const stopVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setVideoEnabled(false);
    
    // Close all connections
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    setRemoteStreams({});
    socket.emit('leave_video_room', { roomId, username });
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (videoEnabled) stopVideo();
    };
  }, [videoEnabled]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(10, 10, 15, 0.8)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64ffda', boxShadow: '0 0 10px #64ffda' }}></div>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Video Mesh Room</span>
        </div>
        <div>
          {videoEnabled ? (
            <button onClick={stopVideo} style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.5)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}>📷 Stop Video</button>
          ) : (
            <button onClick={startVideo} style={{ background: 'rgba(100, 255, 218, 0.1)', color: 'var(--primary)', border: '1px solid rgba(100, 255, 218, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}>📷 Start Video</button>
          )}
        </div>
      </div>

      {/* Grid of Videos */}
      {videoEnabled ? (
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#050505', alignContent: 'start' }}>
          
          {/* Local Video */}
          <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#fff' }}>You</div>
          </div>

          {/* Remote Videos */}
          {Object.entries(remoteStreams).map(([id, stream]) => (
            <div key={id} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
              <VideoPlayer stream={stream} />
              <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#fff' }}>Peer {id.substring(0, 4)}</div>
            </div>
          ))}
          
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          Click "Start Video" to join the mesh network.
        </div>
      )}
    </div>
  );
}

// Helper component to bind MediaStream to video element via ref
function VideoPlayer({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}
