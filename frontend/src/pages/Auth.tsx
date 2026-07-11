import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '../firebase';

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name || username || email });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      localStorage.setItem('quantumEdgeUser', JSON.stringify({ email: auth.currentUser?.email, uid: auth.currentUser?.uid, provider: 'email' }));
      window.dispatchEvent(new Event('userStateChanged'));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOAuth = async (provider: string) => {
    setError('');
    try {
      if (provider === 'google') {
        await signInWithPopup(auth, googleProvider);
        localStorage.setItem('quantumEdgeUser', JSON.stringify({ email: auth.currentUser?.email, uid: auth.currentUser?.uid, provider }));
        window.dispatchEvent(new Event('userStateChanged'));
        navigate('/');
      } else {
        setError('GitHub login not configured yet.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {mode === 'login' ? 'Sign In to QuantumEdge' : 'Create an Account'}
        </h2>
        
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Signing in allows you to save your progress across devices!
        </p>

        {error && (
          <div style={{ background: '#ff555522', border: '1px solid #ff5555', color: '#ff5555', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
              />
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
              />
            </>
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
          />
          <button className="start-btn" type="submit" style={{ width: '100%', marginTop: '0.5rem', borderRadius: '24px' }}>
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
          <span style={{ padding: '0 10px', background: 'var(--bg-color, #0f172a)' }}>OR</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={() => handleOAuth('google')} style={{ padding: '0.8rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)', background: '#fff', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
            Continue with Google
          </button>
          <button onClick={() => handleOAuth('github')} style={{ padding: '0.8rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)', background: '#24292e', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            Continue with GitHub
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}
