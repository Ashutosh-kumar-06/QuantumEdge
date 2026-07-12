// ============================================================================
// App.tsx — Root Application Component
// ============================================================================

import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';

const CourseModules = lazy(() => import('./pages/CourseModules'));
const Tutorial = lazy(() => import('./pages/Tutorial'));
const Lab = lazy(() => import('./pages/Lab'));
const Auth = lazy(() => import('./pages/Auth'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const VideoPage = lazy(() => import('./pages/VideoPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));

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
              <li className={location.pathname === '/course_modules' ? 'active' : ''}>
                <Link to="/course_modules">Modules</Link>
              </li>
              <li className={location.pathname.startsWith('/chat') ? 'active' : ''}>
                <Link to="/chat">Group Chat</Link>
              </li>
              <li className={location.pathname.startsWith('/video') ? 'active' : ''}>
                <Link to="/video">Group Meet</Link>
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
          <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', marginTop: '20vh', color: 'var(--primary)'}}><h2>Loading...</h2></div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/lab/sandbox" replace />} />
              <Route path="/course_modules" element={<CourseModules />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/tutorial/:id" element={<Tutorial />} />
              <Route path="/lab/:id" element={<Lab />} />
              <Route path="/chat" element={<LobbyPage type="chat" />} />
              <Route path="/video" element={<LobbyPage type="video" />} />
              <Route path="/chat/:roomId" element={<ChatPage />} />
              <Route path="/video/:roomId" element={<VideoPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </ProgressProvider>
  );
}

export default App;
