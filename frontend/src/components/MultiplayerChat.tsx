import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface MultiplayerChatProps {
  socket: Socket;
  username: string;
  defaultRoom: string;
  roomId: string;
  setRoomId: (id: string) => void;
}

export default function MultiplayerChat({ socket, username, roomId, setRoomId }: MultiplayerChatProps) {
  const [inRoom, setInRoom] = useState(false);
  const [messages, setMessages] = useState<{user: string, text: string, time: Date}[]>([]);
  const [input, setInput] = useState('');
  
  // Video
  const [videoEnabled, setVideoEnabled] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    socket.on('chat_message', (data) => {
      setMessages(prev => [...prev, { user: data.username, text: data.message, time: new Date(data.timestamp) }]);
    });

    socket.on('user_joined', (data) => {
      setMessages(prev => [...prev, { user: 'System', text: `${data.username} joined the room.`, time: new Date() }]);
    });

    socket.on('user_left', (data) => {
      setMessages(prev => [...prev, { user: 'System', text: `${data.username} left the room.`, time: new Date() }]);
    });

    // Basic WebRTC Signaling (1-on-1 simplified)
    socket.on('video_offer', async (data) => {
      if (!peerConnectionRef.current) initWebRTC();
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnectionRef.current?.createAnswer();
      await peerConnectionRef.current?.setLocalDescription(answer);
      socket.emit('video_answer', { roomId, answer, senderId: socket.id });
    });

    socket.on('video_answer', async (data) => {
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('new_ice_candidate', async (data) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) { console.error('Error adding ice candidate', e); }
    });

    return () => {
      socket.off('chat_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('video_offer');
      socket.off('video_answer');
      socket.off('new_ice_candidate');
    };
  }, [socket, roomId]);

  const initWebRTC = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('new_ice_candidate', { roomId, candidate: event.candidate, senderId: socket.id });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const joinRoom = () => {
    socket.emit('join_room', { roomId, username });
    setInRoom(true);
    setMessages([{ user: 'System', text: `Joined room: ${roomId}`, time: new Date() }]);
  };

  const leaveRoom = () => {
    socket.emit('leave_room', { roomId, username });
    setInRoom(false);
    stopVideo();
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('chat_message', { roomId, username, message: input });
    setInput('');
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setVideoEnabled(true);
      
      const pc = initWebRTC();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('video_offer', { roomId, offer, senderId: socket.id });
    } catch (err) {
      console.error("Failed to start video", err);
      alert("Could not access camera/microphone.");
    }
  };

  const stopVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setVideoEnabled(false);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  if (!inRoom) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>Multiplayer Session</h4>
        <input 
          value={roomId} 
          onChange={e => setRoomId(e.target.value)} 
          placeholder="Room Code (or use default)"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
        />
        <button onClick={joinRoom} style={{ width: '100%', padding: '0.5rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Room: {roomId}</span>
        <div>
          {videoEnabled ? (
            <button onClick={stopVideo} style={{ background: '#ff6b6b', color: '#fff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '0.5rem' }}>Stop Video</button>
          ) : (
            <button onClick={startVideo} style={{ background: '#64ffda', color: '#000', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '0.5rem' }}>Start Video</button>
          )}
          <button onClick={leaveRoom} style={{ background: '#444', color: '#fff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Leave</button>
        </div>
      </div>

      {videoEnabled && (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', background: '#000', borderBottom: '1px solid #333' }}>
          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '50%', borderRadius: '4px', background: '#222' }} />
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '50%', borderRadius: '4px', background: '#222' }} />
        </div>
      )}

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ fontSize: '0.9rem' }}>
            <span style={{ color: msg.user === 'System' ? '#888' : (msg.user === username ? '#64ffda' : '#ffb86c'), fontWeight: 'bold' }}>
              {msg.user}: 
            </span>
            <span style={{ marginLeft: '0.5rem', color: msg.user === 'System' ? '#888' : '#fff' }}>{msg.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.5rem', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px 0 0 4px', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
    </div>
  );
}
