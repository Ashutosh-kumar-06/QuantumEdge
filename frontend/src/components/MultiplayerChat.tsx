import React, { useState, useEffect } from 'react';
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

    return () => {
      socket.off('chat_message');
      socket.off('user_joined');
      socket.off('user_left');
    };
  }, [socket, roomId]);



  const joinRoom = () => {
    socket.emit('join_room', { roomId, username });
    setInRoom(true);
    setMessages([{ user: 'System', text: `Joined room: ${roomId}`, time: new Date() }]);
  };

  const leaveRoom = () => {
    socket.emit('leave_room', { roomId, username });
    setInRoom(false);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('chat_message', { roomId, username, message: input });
    setInput('');
  };



  if (!inRoom) {
    return (
      <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Multiplayer Lab</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Collaborate with others in real-time. Join a room to share code and chat.</p>
        <input 
          value={roomId} 
          onChange={e => setRoomId(e.target.value)} 
          placeholder="Enter Room Code (e.g. sandbox)"
          style={{ width: '100%', padding: '0.8rem 1rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
        />
        <button onClick={joinRoom} style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(45deg, var(--primary), #00d2ff)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(100, 255, 218, 0.3)' }}>
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(10, 10, 15, 0.8)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64ffda', boxShadow: '0 0 10px #64ffda' }}></div>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.5px' }}>Room: <span style={{ color: 'var(--primary)' }}>{roomId}</span></span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={leaveRoom} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>Leave</button>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
        {messages.map((msg, i) => {
          const isSystem = msg.user === 'System';
          const isMe = msg.user === username;
          
          if (isSystem) {
            return (
              <div key={i} style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', margin: '0.5rem 0' }}>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.8rem', borderRadius: '12px' }}>{msg.text}</span>
              </div>
            );
          }

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem', marginLeft: isMe ? '0' : '0.5rem', marginRight: isMe ? '0.5rem' : '0' }}>{msg.user}</span>
              <div style={{ 
                background: isMe ? 'linear-gradient(135deg, rgba(100,255,218,0.2), rgba(0,210,255,0.2))' : 'rgba(255,255,255,0.05)',
                color: isMe ? 'var(--primary)' : '#fff',
                border: isMe ? '1px solid rgba(100,255,218,0.3)' : '1px solid rgba(255,255,255,0.1)',
                padding: '0.6rem 1rem', 
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                maxWidth: '85%',
                lineHeight: '1.4',
                fontSize: '0.95rem'
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }}
          onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
          onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
        />
        <button type="submit" disabled={!input.trim()} style={{ marginLeft: '0.5rem', padding: '0 1.2rem', background: input.trim() ? 'var(--primary)' : '#444', color: '#000', border: 'none', borderRadius: '24px', cursor: input.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  );
}
