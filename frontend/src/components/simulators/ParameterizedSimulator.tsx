import { useState } from 'react';
import '../../simulator.css';

export default function ParameterizedSimulator() {
  const [theta, setTheta] = useState(0);

  const prob1 = Math.pow(Math.sin(theta / 2), 2);
  const prob0 = 1 - prob1;

  return (
    <div className="mini-simulator circuit-simulator">
      <div className="bloch-meta">
        <h4>Parameterized Rx(θ) Gate</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Adjust the continuous parameter θ to rotate the qubit.</p>
        <input 
          type="range" min="0" max={Math.PI * 2} step="0.05" 
          value={theta} 
          onChange={e => setTheta(parseFloat(e.target.value))} 
          style={{ width: '80%', margin: '20px 0' }}
        />
        <p>θ = {theta.toFixed(2)} radians</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0' }}>
          <div>
            <h4>P(|0⟩)</h4>
            <div style={{ height: '100px', width: '50px', background: 'rgba(255,255,255,0.1)', position: 'relative', margin: 'auto' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${prob0 * 100}%`, background: 'var(--primary-color)' }}></div>
            </div>
            <p>{Math.round(prob0 * 100)}%</p>
          </div>
          <div>
            <h4>P(|1⟩)</h4>
            <div style={{ height: '100px', width: '50px', background: 'rgba(255,255,255,0.1)', position: 'relative', margin: 'auto' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${prob1 * 100}%`, background: 'var(--danger)' }}></div>
            </div>
            <p>{Math.round(prob1 * 100)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}