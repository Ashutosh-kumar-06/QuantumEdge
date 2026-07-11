import React, { useEffect, useState } from 'react';

interface LeaderboardUser {
  username: string;
  xp: number;
  avatar: string;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch leaderboard", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: '#aaa' }}>Loading Leaderboard...</div>;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#64ffda', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🏆</span> Global Leaderboard
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {users.length === 0 ? (
          <p style={{ color: '#aaa', margin: 0 }}>No rankings yet. Be the first!</p>
        ) : (
          users.map((user, index) => (
            <div key={user.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', background: index === 0 ? 'rgba(100,255,218,0.1)' : 'rgba(0,0,0,0.2)', borderRadius: '8px', border: index === 0 ? '1px solid rgba(100,255,218,0.3)' : '1px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: index < 3 ? '#64ffda' : '#888', fontWeight: 'bold', width: '20px' }}>#{index + 1}</span>
                <span style={{ fontSize: '1.2rem' }}>{user.avatar}</span>
                <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>{user.username}</span>
              </div>
              <div style={{ color: '#64ffda', fontWeight: 'bold' }}>{user.xp} XP</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
