import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LobbyPageProps {
  type: 'chat' | 'video';
}

export default function LobbyPage({ type }: LobbyPageProps) {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomId.trim()) return;
    if (type === 'chat') {
      navigate(`/chat/${roomId.trim()}`);
    } else {
      navigate(`/video/${roomId.trim()}`);
    }
  };

  const handleCreate = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (type === 'chat') {
      navigate(`/chat/${newRoomId}`);
    } else {
      navigate(`/video/${newRoomId}`);
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
          {type === 'chat' ? '💬 Group Chat' : '📹 Group Meet'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Create a new room or join an existing one to collaborate with others.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={handleCreate} className="run-btn" style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
            Create New Room
          </button>
          
          <div style={{ margin: '1rem 0', color: '#666', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
            <span style={{ padding: '0 1rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Enter Room ID" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              style={{ flex: 1, background: '#222', color: '#fff', border: '1px solid #444', padding: '0.8rem', borderRadius: '4px' }}
            />
            <button onClick={handleJoin} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '0.8rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
