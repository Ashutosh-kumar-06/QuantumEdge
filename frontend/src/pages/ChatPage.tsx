import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import SharedEditor from '../components/SharedEditor';
import MultiplayerChat from '../components/MultiplayerChat';
import HostControls from '../components/HostControls';

const socket: Socket = io(import.meta.env.VITE_API_URL || '', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<{email: string} | null>(null);
  const [roomState, setRoomState] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('quantumEdgeUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        socket.emit('join_meeting', { roomId, username: parsed.email });
      } catch (e) {}
    }
  }, [roomId]);

  useEffect(() => {
    socket.on('room_state', (state) => {
      setRoomState(state);
    });
    
    socket.on('room_ended', () => {
      alert("The host has ended the meeting.");
      navigate('/lab/sandbox');
    });

    return () => {
      socket.off('room_state');
      socket.off('room_ended');
    };
  }, [navigate]);

  if (!user) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Sign In Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You must be signed in to join a Chat Meeting.</p>
          <button className="run-btn" onClick={() => navigate('/auth')} style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Go to Sign In</button>
        </div>
      </div>
    );
  }

  const isOwner = roomState?.owner === user.email;
  const myPermissions = roomState?.participants?.[user.email] || { canEdit: false, canMic: false, canCam: false };
  const canEdit = isOwner || myPermissions.canEdit;

  const handleUpdatePermission = (targetUsername: string, permissions: any) => {
    socket.emit('update_permissions', { roomId, targetUsername, permissions });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', width: '100%', overflow: 'hidden' }}>
      <div className="lab-header" style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Chat Meeting Room: <span style={{ color: 'var(--primary)' }}>{roomId}</span></h2>
        <button onClick={() => navigate('/lab/sandbox')} style={{ background: '#444', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Leave Room</button>
      </div>

      <HostControls roomState={roomState} currentUser={user.email} onUpdatePermission={handleUpdatePermission} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', position: 'relative' }}>
          <SharedEditor socket={socket} roomId={roomId!} readOnly={!canEdit} />
        </div>
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
          <MultiplayerChat 
            socket={socket} 
            username={user.email}
            defaultRoom={roomId!} 
            roomId={roomId!}
            setRoomId={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
