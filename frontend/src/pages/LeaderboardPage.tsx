import { useEffect, useState } from 'react';
import Leaderboard from '../components/Leaderboard';
import { useNavigate } from 'react-router-dom';

export default function LeaderboardPage() {
  const [user, setUser] = useState<{email: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('quantumEdgeUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  if (!user) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Sign In Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            You must be signed in to view the Global Leaderboard and your ranking.
          </p>
          <button className="run-btn" onClick={() => navigate('/auth')} style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <Leaderboard />
    </div>
  );
}
