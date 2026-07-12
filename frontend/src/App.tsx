// ============================================================================
// App.tsx — Root Application Component
// ============================================================================

import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Dashboard from './pages/Dashboard';
import Tutorial from './pages/Tutorial';
import Lab from './pages/Lab';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ChatPage from './pages/ChatPage';
import VideoPage from './pages/VideoPage';

import { ProgressProvider } from './context/ProgressContext';

import './App.css';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<{email: string, provider: string} | null>(null);

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem('quantumEdgeUser');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    
    // Check initially
    checkUser();

    // Listen for custom login/logout events from other components
    window.addEventListener('userStateChanged', checkUser);
    return () => window.removeEventListener('userStateChanged', checkUser);
  }, [location.pathname]); // Re-check on navigation as well

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('quantumEdgeUser');
    setUser(null);
    window.dispatchEvent(new Event('userStateChanged'));
    navigate('/');
  };

  return (
    <ProgressProvider>
      <div className="app-container">
        <header className="glass-header global-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>QuantumEdge <span className="badge">PRO</span></h1>
          <nav>
            <ul>
              <li className={location.pathname.startsWith('/lab') ? 'active' : ''}>
                <Link to="/lab/sandbox">Lab</Link>
              </li>
              <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                <Link to="/dashboard">Modules</Link>
              </li>
              <li className={location.pathname === '/leaderboard' ? 'active' : ''}>
                <Link to="/leaderboard">Leaderboard</Link>
              </li>
              {user ? (
                <li>
                  <a href="#" onClick={handleSignOut} style={{ color: 'var(--text-muted)' }}>Sign Out</a>
                </li>
              ) : (
                <li className={location.pathname === '/auth' ? 'active' : ''}>
                  <Link to="/auth">Sign In</Link>
                </li>
              )}
            </ul>
          </nav>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tutorial/:id" element={<Tutorial />} />
            <Route path="/lab/:id" element={<Lab />} />
            <Route path="/chat/:roomId" element={<ChatPage />} />
            <Route path="/video/:roomId" element={<VideoPage />} />
          </Routes>
        </main>
      </div>
    </ProgressProvider>
  );
}

export default App;
