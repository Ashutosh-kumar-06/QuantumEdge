// ============================================================================
// App.tsx — Root Application Component
// ============================================================================

import { Routes, Route, Link, useLocation } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Tutorial from './pages/Tutorial';
import Lab from './pages/Lab';
import Auth from './pages/Auth';

import { ProgressProvider } from './context/ProgressContext';

import './App.css';

function App() {
  const location = useLocation();

  return (
    <ProgressProvider>
      <div className="app-container">
        <header className="glass-header global-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>QuantumEdge <span className="badge">PRO</span></h1>
          <nav>
            <ul>
              <li className={location.pathname === '/' ? 'active' : ''}>
                <Link to="/">Dashboard</Link>
              </li>
              <li className={location.pathname === '/auth' ? 'active' : ''}>
                <Link to="/auth">Sign In</Link>
              </li>
            </ul>
          </nav>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tutorial/:id" element={<Tutorial />} />
            <Route path="/lab/:id" element={<Lab />} />
          </Routes>
        </main>
      </div>
    </ProgressProvider>
  );
}

export default App;
