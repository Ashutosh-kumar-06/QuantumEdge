import { useState } from 'react';
import '../../simulator.css';

export default function DensityMatrixSimulator() {
  const [noise, setNoise] = useState(0);

  return (
    <div className="mini-simulator bloch-simulator">
      <div className="bloch-meta">
        <h4>Density Matrix (Mixed State)</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Observe how noise drives a pure |+⟩ state into a completely mixed state.</p>
        <input 
          type="range" min="0" max="1" step="0.01" 
          value={noise} 
          onChange={e => setNoise(parseFloat(e.target.value))} 
          style={{ width: '80%', margin: '20px 0' }}
        />
        <p>Noise level: {Math.round(noise * 100)}%</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', width: '200px', margin: '20px auto' }}>
          <div style={{ background: `rgba(69, 243, 255, ${0.5 - noise * 0.25})`, padding: '20px' }}>0.5</div>
          <div style={{ background: `rgba(69, 243, 255, ${0.5 - noise * 0.5})`, padding: '20px' }}>{(0.5 - noise * 0.5).toFixed(2)}</div>
          <div style={{ background: `rgba(69, 243, 255, ${0.5 - noise * 0.5})`, padding: '20px' }}>{(0.5 - noise * 0.5).toFixed(2)}</div>
          <div style={{ background: `rgba(69, 243, 255, ${0.5 - noise * 0.25})`, padding: '20px' }}>0.5</div>
        </div>
      </div>
    </div>
  );
}