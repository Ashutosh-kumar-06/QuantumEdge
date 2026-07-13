import { useEffect, useState, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
const SharedEditor = lazy(() => import('../components/SharedEditor'));
const SharedWhiteboard = lazy(() => import('../components/SharedWhiteboard'));
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

  const [files, setFiles] = useState<{ [path: string]: string }>({ 'main.py': '// Write your code here!\n' });
  const [activeFile, setActiveFile] = useState('main.py');
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
      navigate('/');
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
        body: JSON.stringify({ files, mainFile: activeFile, language, noiseModel })
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
        <button onClick={() => navigate('/')} style={{ background: '#444', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Leave Room</button>
      </div>

      <HostControls roomState={roomState} currentUser={user.email} onUpdatePermission={handleUpdatePermission} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {isEditorMinimized && (
          <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', margin: '0 0.5rem' }}>
            <button onClick={() => setIsEditorMinimized(false)} className="smooth-transition" style={{ background: 'transparent', color: 'var(--primary-color)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>[+] Expand Editor</button>
          </div>
        )}

        {!isEditorMinimized && (
          <div className="glass-panel smooth-transition" style={{ flex: isPanelMinimized ? 1 : 1, display: 'flex', flexDirection: 'column', margin: '0 0.5rem', overflow: 'hidden' }}>
            {/* Execution Bar */}
            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setViewMode('code')} className="smooth-transition" style={{ background: viewMode === 'code' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'code' ? '#000' : '#fff', border: 'none', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>Code</button>
                  <button onClick={() => setViewMode('whiteboard')} className="smooth-transition" style={{ background: viewMode === 'whiteboard' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'whiteboard' ? '#000' : '#fff', border: 'none', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}>Whiteboard</button>
                </div>
                
                {viewMode === 'code' && (
                  <>
                    <select value={language} onChange={e => setLanguage(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '8px', outline: 'none' }}>
                      <option value="python" style={{ background: '#000' }}>Qiskit (Python)</option>
                      <option value="cpp" style={{ background: '#000' }}>QuEST (C++)</option>
                    </select>
                    <select value={noiseModel} onChange={e => setNoiseModel(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '8px', outline: 'none' }}>
                      <option value="ideal" style={{ background: '#000' }}>Ideal (No Noise)</option>
                      <option value="depolarizing" style={{ background: '#000' }}>Depolarizing Noise</option>
                      <option value="thermal" style={{ background: '#000' }}>Thermal Relaxation</option>
                    </select>
                    <button onClick={runSimulation} disabled={running || !canEdit} className="run-btn" style={{ cursor: (running || !canEdit) ? 'not-allowed' : 'pointer', opacity: (running || !canEdit) ? 0.7 : 1 }}>
                      {running ? 'Running...' : 'Run Simulation'}
                    </button>
                  </>
                )}
              </div>
              <button onClick={() => setIsEditorMinimized(true)} style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>[-]</button>
            </div>
            
            <div style={{ flex: 1, position: 'relative' }}>
              <Suspense fallback={<div style={{ padding: 20, color: '#38bdf8' }}>Loading Workspace...</div>}>
                {viewMode === 'code' ? (
                  <SharedEditor socket={socket} roomId={socketRoomId!} readOnly={!canEdit} username={user.email} onFilesChange={setFiles} onActiveFileChange={setActiveFile} />
                ) : (
                  <SharedWhiteboard socket={socket} roomId={socketRoomId!} readOnly={!canEdit} username={user.email} />
                )}
              </Suspense>
            </div>

            {/* Terminal Pane */}
            <div className="terminal" style={{ height: '30%', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)', padding: '1rem', overflowY: 'auto', borderRadius: '0 0 16px 16px' }}>
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
          <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', margin: '0 0.5rem' }}>
            <button onClick={() => setIsPanelMinimized(false)} className="smooth-transition" style={{ background: 'transparent', color: 'var(--primary-color)', border: 'none', cursor: 'pointer', fontWeight: 'bold', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>[+] Video Call</button>
          </div>
        )}

        {!isPanelMinimized && (
          <div className="smooth-transition" style={{ width: isEditorMinimized ? '100%' : '500px', display: 'flex', flexDirection: 'column' }}>
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '0 0.5rem 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.4)', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
