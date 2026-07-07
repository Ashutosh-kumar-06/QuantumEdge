import { useState } from 'react';
import '../../simulator.css';

export default function GroverSimulator() {
  const [iterations, setIterations] = useState(0);
  
  // Simulated amplitudes for 4 states. State |11> is the target.
  let a00 = 0.5, a01 = 0.5, a10 = 0.5, a11 = 0.5;
  
  for (let i = 0; i < iterations; i++) {
    // Oracle flips sign of target
    a11 = -a11;
    // Diffusion (inversion about mean)
    let mean = (a00 + a01 + a10 + a11) / 4;
    a00 = 2 * mean - a00;
    a01 = 2 * mean - a01;
    a10 = 2 * mean - a10;
    a11 = 2 * mean - a11;
  }

  const p00 = a00*a00, p01 = a01*a01, p10 = a10*a10, p11 = a11*a11;

  return (
    <div className="mini-simulator bloch-simulator">
      <div className="bloch-meta">
        <h4>Grover's Amplitude Amplification</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Target State: |11⟩. Apply the Grover iterator to amplify its probability.</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0', height: '150px', alignItems: 'flex-end' }}>
          {[
            { label: '|00⟩', p: p00 },
            { label: '|01⟩', p: p01 },
            { label: '|10⟩', p: p10 },
            { label: '|11⟩', p: p11, color: 'var(--success-color)' }
          ].map((s, i) => (
            <div key={i} style={{ width: '20%', textAlign: 'center' }}>
              <div style={{ height: `${s.p * 100}px`, background: s.color || 'var(--primary-color)', transition: 'height 0.3s' }}></div>
              <p style={{ marginTop: '10px' }}>{s.label}<br/>{Math.round(s.p * 100)}%</p>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button className="gate-btn" onClick={() => setIterations(Math.min(3, iterations + 1))}>Apply Iterator</button>
          <button className="gate-btn reset-btn" onClick={() => setIterations(0)}>Reset</button>
        </div>
      </div>
    </div>
  );
}