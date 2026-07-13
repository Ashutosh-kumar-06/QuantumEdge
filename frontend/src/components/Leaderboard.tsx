import { useEffect, useState } from 'react';

interface LeaderboardUser {
  username: string;
  xp?: number;
  score?: number;
  avatar: string;
  metrics?: any;
}

const CHALLENGES = [
  { id: 'global', title: 'Global XP Ranking' },
  { id: 'quantum-fundamentals', title: '1-Qubit Superposition' },
  { id: 'programming-foundations', title: 'Python Fibonacci' },
  { id: 'intro-to-qiskit', title: 'Circuit Size Optimization' },
  { id: 'quantum-gates', title: 'Bell State Preparation' },
  { id: 'circuit-visualization', title: 'GHZ State Size' },
  { id: 'parameterized-circuits', title: 'Parameter Binding' },
  { id: 'grovers-algorithm', title: 'Grover Search Optimization' },
  { id: 'shors-algorithm', title: 'QFT Optimization' },
  { id: 'vqe', title: 'VQE Runtime Optimization' },
  { id: 'capstone', title: 'Hardware Efficient Ansatz' }
];

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    setLoading(true);
    const url = activeTab === 'global' 
      ? `${import.meta.env.VITE_API_URL}/api/leaderboard`
      : `${import.meta.env.VITE_API_URL}/api/leaderboard/${activeTab}`;
      
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch leaderboard", err);
        setLoading(false);
      });
  }, [activeTab]);

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: '#64ffda', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🏆</span> {activeTab === 'global' ? 'Global Leaderboard' : 'Challenge Leaderboard'}
        </h3>
        <select 
          value={activeTab} 
          onChange={e => setActiveTab(e.target.value)}
          style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.9rem' }}
        >
          {CHALLENGES.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#aaa' }}>Loading Leaderboard...</div>
      ) : (
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#64ffda', fontWeight: 'bold' }}>
                    {activeTab === 'global' ? `${user.xp} XP` : `Score: ${user.score}`}
                  </div>
                  {activeTab !== 'global' && user.metrics && (
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.2rem' }}>
                      {user.metrics.gateCount !== undefined && `Gates: ${user.metrics.gateCount} | `}
                      {user.metrics.depth !== undefined && `Depth: ${user.metrics.depth} | `}
                      {user.metrics.runtimeMs !== undefined && `${Math.floor(user.metrics.runtimeMs)}ms`}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
