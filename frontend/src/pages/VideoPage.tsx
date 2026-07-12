import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import SharedEditor from '../components/SharedEditor';
import SharedWhiteboard from '../components/SharedWhiteboard';
import MultiplayerVideoCall from '../components/MultiplayerVideoCall';
import HostControls from '../components/HostControls';

const socket: Socket = io(import.meta.env.VITE_API_URL || '', {
  path: '/socket.io',
  transports: ['websocket']
});

export default function VideoPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const socketRoomId = `video_${roomId}`;
  const navigate = useNavigate();
  const [user, setUser] = useState<{email: string} | null>(null);
  const [roomState, setRoomState] = useState<any>(null);

  const [isEditorMinimized, setIsEditorMinimized] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'whiteboard'>('code');

  useEffect(() => {
    const savedUser = localStorage.getItem('quantumEdgeUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        socket.emit('join_meeting', { roomId: socketRoomId, username: parsed.email });
      } catch (e) {}
    }
  }, [socketRoomId]);

  const [code, setCode] = useState('// Welcome to the Shared Code Editor\n');
  const [language, setLanguage] = useState<'python' | 'cpp'>('python');
  const [noiseModel, setNoiseModel] = useState<'ideal' | 'depolarizing' | 'thermal'>('ideal');
  const [output, setOutput] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    socket.on('terminal_output', ({ output: remoteOutput }) => {
      setOutput(remoteOutput);
    });
    
    socket.on('room_state', (state) => {
      setRoomState(state);
    });
    
    socket.on('room_ended', () => {
      alert("The host has ended the meeting.");
      navigate('/lab/sandbox');
    });

    return () => {
      socket.off('terminal_output');
      socket.off('room_state');
      socket.off('room_ended');
    };
  }, [navigate]);

  const runSimulation = async () => {
    setRunning(true);
    setOutput({ status: 'Executing on cluster...' });
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, noiseModel })
      });
      const data = await res.json();
      setOutput(data);
      socket.emit('terminal_output', { roomId: socketRoomId, output: data });
    } catch (e: any) {
      const err = { error: e.message };
      setOutput(err);
      socket.emit('terminal_output', { roomId: socketRoomId, output: err });
    }
    setRunning(false);
  };

  if (!user) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Sign In Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You must be signed in to join a Video Meeting.</p>
          <button className="run-btn" onClick={() => navigate('/auth')} style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Go to Sign In</button>
        </div>
      </div>
    );
  }

  const isOwner = roomState?.owner === user.email;
  const myPermissions = roomState?.participants?.[user.email] || { canEdit: false, canMic: false, canCam: false };
  const canEdit = isOwner || myPermissions.canEdit;
  const canMic = isOwner || myPermissions.canMic;
  const canCam = isOwner || myPermissions.canCam;

  const handleUpdatePermission = (targetUsername: string, permissions: any) => {
    socket.emit('update_permissions', { roomId: socketRoomId, targetUsername, permissions });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', width: '100%', overflow: 'hidden' }}>
      <div className="lab-header" style={{ padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Video Meeting Room: <span style={{ color: 'var(--primary)' }}>{roomId}</span></h2>
        <button onClick={() => navigate('/lab/sandbox')} style={{ background: '#444', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Leave Room</button>
      </div>

      <HostControls roomState={roomState} currentUser={user.email} onUpdatePermission={handleUpdatePermission} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {isEditorMinimized && (
          <div style={{ padding: '0.5rem', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', background: 'var(--panel-bg)' }}>
            <button onClick={() => setIsEditorMinimized(false)} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>[+] Expand Editor</button>
          </div>
        )}

        {!isEditorMinimized && (
          <div style={{ flex: isPanelMinimized ? 1 : 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
            {/* Execution Bar */}
            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#222', borderRadius: '4px', overflow: 'hidden' }}>
                  <button onClick={() => setViewMode('code')} style={{ background: viewMode === 'code' ? 'var(--primary)' : 'transparent', color: viewMode === 'code' ? '#000' : '#fff', border: 'none', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>Code</button>
                  <button onClick={() => setViewMode('whiteboard')} style={{ background: viewMode === 'whiteboard' ? 'var(--primary)' : 'transparent', color: viewMode === 'whiteboard' ? '#000' : '#fff', border: 'none', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>Whiteboard</button>
                </div>
                
                {viewMode === 'code' && (
                  <>
                    <select value={language} onChange={e => setLanguage(e.target.value as any)} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.4rem', borderRadius: '4px' }}>
                      <option value="python">Qiskit (Python)</option>
                      <option value="cpp">QuEST (C++)</option>
                    </select>
                    <select value={noiseModel} onChange={e => setNoiseModel(e.target.value as any)} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.4rem', borderRadius: '4px' }}>
                      <option value="ideal">Ideal (No Noise)</option>
                      <option value="depolarizing">Depolarizing Noise</option>
                      <option value="thermal">Thermal Relaxation</option>
                    </select>
                    <button onClick={runSimulation} disabled={running || !canEdit} style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.4rem 1.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: (running || !canEdit) ? 'not-allowed' : 'pointer', opacity: (running || !canEdit) ? 0.7 : 1 }}>
                      {running ? 'Running...' : 'Run Simulation'}
                    </button>
                  </>
                )}
              </div>
              <button onClick={() => setIsEditorMinimized(true)} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>[-]</button>
            </div>
            
            <div style={{ flex: 1, position: 'relative' }}>
              {viewMode === 'code' ? (
                <SharedEditor socket={socket} roomId={socketRoomId!} readOnly={!canEdit} code={code} setCode={setCode} username={user.email} />
              ) : (
                <SharedWhiteboard socket={socket} roomId={socketRoomId!} readOnly={!canEdit} username={user.email} />
              )}
            </div>

            {/* Terminal Pane */}
            <div style={{ height: '30%', borderTop: '1px solid var(--border-color)', background: '#0d0d0d', padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {output ? (
                <>
                  {output.output && output.output.trim() !== '' && (
                    <div style={{ color: '#ccc', marginBottom: '0.5rem' }}>{output.output}</div>
                  )}
                  {output.error && (
                    <div style={{ color: '#ff5555' }}>{output.error}</div>
                  )}
                  {output.status && !output.error && (!output.output || output.output.trim() === '') && (
                    <div style={{ color: '#888' }}>{output.status}</div>
                  )}
                </>
              ) : (
                <div style={{ color: '#666' }}>Terminal Output...</div>
              )}
            </div>
          </div>
        )}

        {isPanelMinimized && (
          <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', background: 'var(--panel-bg)' }}>
            <button onClick={() => setIsPanelMinimized(false)} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>[+] Video Call</button>
          </div>
        )}

        {!isPanelMinimized && (
          <div style={{ width: isEditorMinimized ? '100%' : '500px', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Video Call</h3>
              <button onClick={() => setIsPanelMinimized(true)} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>[-]</button>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <MultiplayerVideoCall 
                socket={socket} 
                username={user.email}
                roomId={socketRoomId!}
                canMic={canMic}
                canCam={canCam}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
