import { useState } from 'react';
import '../../simulator.css';

export default function ProbabilitySimulator() {
  const [amplitude, setAmplitude] = useState(0.707);
  const prob = (amplitude * amplitude).toFixed(2);
  
  return (
    <div className="mini-simulator bloch-simulator">
      <div className="bloch-meta">
        <h4>Probability vs Amplitude</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Adjust the quantum amplitude (α) to see its probability (|α|²).</p>
        <input 
          type="range" min="-1" max="1" step="0.01" 
          value={amplitude} 
          onChange={e => setAmplitude(parseFloat(e.target.value))} 
          style={{ width: '80%', margin: '20px 0' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '1.2rem' }}>
          <div>Amplitude (α): <strong>{amplitude.toFixed(3)}</strong></div>
          <div>Probability: <strong>{prob}</strong> ({Math.round(parseFloat(prob) * 100)}%)</div>
        </div>
        <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', height: '30px', borderRadius: '15px', overflow: 'hidden' }}>
          <div style={{ width: `${parseFloat(prob) * 100}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}