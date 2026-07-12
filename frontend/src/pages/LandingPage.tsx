import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Quantum Simulator",
      desc: "Run real-time Qiskit & QuEST circuits in your browser.",
      icon: "⚛️",
      color: "rgba(100, 255, 218, 0.8)"
    },
    {
      title: "Collaborative Lab",
      desc: "Pair program and build quantum circuits together in real-time.",
      icon: "🤝",
      color: "rgba(187, 134, 252, 0.8)"
    },
    {
      title: "AI Quantum Tutor",
      desc: "Get instant code reviews and hints from an interactive AI.",
      icon: "✨",
      color: "rgba(3, 218, 198, 0.8)"
    },
    {
      title: "Global Leaderboard",
      desc: "Rank up globally by completing interactive learning modules.",
      icon: "🏆",
      color: "rgba(255, 184, 108, 0.8)"
    }
  ];

  return (
    <div className="landing-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Background Video (Local) */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'translate(-50%, -50%)',
          zIndex: -2,
          filter: 'brightness(0.3) contrast(1.2)'
        }}
      >
        <source src="/background.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
        zIndex: -1
      }}></div>

      {/* Hero Content */}
      <div style={{ textAlign: 'center', zIndex: 1, padding: '2rem', maxWidth: '1000px', width: '100%' }}>
        <h1 style={{ 
          fontSize: '4rem', 
          fontWeight: 900, 
          margin: '0 0 1rem 0',
          background: 'linear-gradient(to right, #64ffda, #bb86fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0px 10px 30px rgba(100, 255, 218, 0.3)'
        }}>
          QuantumEdge
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#e2e8f0', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
          The ultimate interactive platform to learn, build, and master Quantum Computing. Experience real-time collaboration and AI-driven tutorials.
        </p>
        
        <button 
          onClick={() => navigate('/course_modules')}
          style={{
            background: 'var(--primary)',
            color: '#0f172a',
            border: 'none',
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(100, 255, 218, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            marginBottom: '4rem'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Enter the Quantum Realm
        </button>

        {/* 3D Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          perspective: '1000px'
        }}>
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="feature-card-3d"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${feature.color}`,
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)`,
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s',
                transformStyle: 'preserve-3d',
                cursor: 'pointer'
              }}
              onMouseMove={(e) => {
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                card.style.boxShadow = `0 20px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.05), ${rotateY * -1}px ${rotateX}px 20px ${feature.color.replace('0.8', '0.2')}`;
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                card.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02)`;
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem', transform: 'translateZ(30px)' }}>
                {feature.icon}
              </div>
              <h3 style={{ margin: '0 0 1rem 0', color: feature.color, transform: 'translateZ(20px)' }}>{feature.title}</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', transform: 'translateZ(10px)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
