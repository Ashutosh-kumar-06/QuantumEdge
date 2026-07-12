

interface RoomState {
  owner: string;
  participants: {
    [username: string]: {
      canEdit: boolean;
      canMic: boolean;
      canCam: boolean;
    }
  }
}

interface HostControlsProps {
  roomState: RoomState | null;
  currentUser: string;
  onUpdatePermission: (targetUsername: string, permissions: any) => void;
}

export default function HostControls({ roomState, currentUser, onUpdatePermission }: HostControlsProps) {
  if (!roomState || roomState.owner !== currentUser) {
    return null; // Only render for the owner
  }

  const participantsList = Object.keys(roomState.participants);

  return (
    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-color)' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary)' }}>👑 Host Controls</h3>
      
      {participantsList.length === 0 ? (
        <div style={{ color: '#888', fontSize: '0.9rem' }}>Waiting for participants to join...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {participantsList.map(username => {
            const perms = roomState.participants[username];
            return (
              <div key={username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>{username}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={perms.canEdit} onChange={(e) => onUpdatePermission(username, { canEdit: e.target.checked })} />
                    Allow Edit Code
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={perms.canMic} onChange={(e) => onUpdatePermission(username, { canMic: e.target.checked })} />
                    Allow Mic
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={perms.canCam} onChange={(e) => onUpdatePermission(username, { canCam: e.target.checked })} />
                    Allow Camera
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
