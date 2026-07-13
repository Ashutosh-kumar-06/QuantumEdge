import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';

// Extend window object for recaptcha
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
declare var grecaptcha: any;

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [mode, setMode] = useState<'login' | 'signup' | 'phone' | 'otp'>('login');
  const [error, setError] = useState('');

  // Cleanup recaptcha if component unmounts
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!auth) {
      setError('Firebase configuration is missing! Make sure your keys in frontend/.env start with VITE_ (e.g., VITE_FIREBASE_API_KEY).');
      return;
    }

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name || username || email });
        
        // Trigger Welcome Email via Resend backend endpoint
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/email/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: name || username })
        }).catch(err => console.error("Welcome email failed", err));

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

    if (!auth) {
      setError('Firebase configuration is missing! Make sure your keys in frontend/.env start with VITE_ (e.g., VITE_FIREBASE_API_KEY).');
      return;
    }

    try {
      if (provider === 'google') {
        await signInWithPopup(auth, googleProvider);
        localStorage.setItem('quantumEdgeUser', JSON.stringify({ email: auth.currentUser?.email, uid: auth.currentUser?.uid, provider }));
        window.dispatchEvent(new Event('userStateChanged'));
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!auth) {
      setError('Firebase configuration is missing!');
      return;
    }
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Phone number must be in E.164 format (e.g. +1234567890)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setMode('otp');
    } catch (err: any) {
      setError(err.message);
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
          grecaptcha.reset(widgetId);
        });
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await confirmationResult.confirm(otp);
      localStorage.setItem('quantumEdgeUser', JSON.stringify({ email: auth.currentUser?.phoneNumber || 'Phone User', uid: auth.currentUser?.uid, provider: 'phone' }));
      window.dispatchEvent(new Event('userStateChanged'));
      navigate('/');
    } catch (err: any) {
      setError('Invalid OTP code. Please try again.');
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {mode === 'login' && 'Sign In'}
          {mode === 'signup' && 'Create an Account'}
          {mode === 'phone' && 'Phone Verification'}
          {mode === 'otp' && 'Enter Verification Code'}
        </h2>
        
        {mode !== 'otp' && mode !== 'phone' && (
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Signing in allows you to save your progress!
          </p>
        )}

        {error && (
          <div style={{ background: '#ff555522', border: '1px solid #ff5555', color: '#ff5555', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        {(mode === 'login' || mode === 'signup') && (
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
            <button className="start-btn" type="submit" style={{ width: '100%', marginTop: '0.5rem', borderRadius: '24px', padding: '0.8rem' }}>
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* Phone Form */}
        {mode === 'phone' && (
          <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter your phone number including country code (e.g. +1234567890)</p>
            <input 
              type="tel" 
              placeholder="+1 234 567 8900" 
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              required
              style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1.1rem', letterSpacing: '1px' }}
            />
            <button className="start-btn" type="submit" style={{ width: '100%', marginTop: '0.5rem', borderRadius: '24px', padding: '0.8rem' }}>
              Send Verification Code
            </button>
            <button type="button" onClick={() => setMode('login')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.5rem' }}>
              Back to Email Login
            </button>
          </form>
        )}

        {/* OTP Form */}
        {mode === 'otp' && (
          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter the 6-digit code sent to {phoneNumber}</p>
            <input 
              type="text" 
              placeholder="123456" 
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '1.5rem', letterSpacing: '4px', textAlign: 'center' }}
            />
            <button className="start-btn" type="submit" style={{ width: '100%', marginTop: '0.5rem', borderRadius: '24px', padding: '0.8rem' }}>
              Verify Code
            </button>
            <button type="button" onClick={() => setMode('phone')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.5rem' }}>
              Change Phone Number
            </button>
          </form>
        )}

        {/* OAuth Buttons (Only show in login/signup mode) */}
        {(mode === 'login' || mode === 'signup') && (
          <>
            <div style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
              <span style={{ padding: '0 10px', background: 'var(--panel-bg)' }}>OR</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={() => handleOAuth('google')} style={{ padding: '0.8rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)', background: '#fff', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                Continue with Google
              </button>
              <button onClick={() => setMode('phone')} style={{ padding: '0.8rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--primary)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                Continue with Phone
              </button>
            </div>
            
            <div style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
              <span style={{ padding: '0 10px', background: 'var(--panel-bg)' }}>OR</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={() => navigate('/')} style={{ padding: '0.8rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                Try without signing in (Guest)
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
          </>
        )}

        {/* Invisible Recaptcha Container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
