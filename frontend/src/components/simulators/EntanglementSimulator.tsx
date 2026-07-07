import { useState } from 'react';
import '../../simulator.css';

export default function EntanglementSimulator() {
  const [measured, setMeasured] = useState(false);
  const [result, setResult] = useState(0);

  const measure = () => {
    setMeasured(true);
    setResult(Math.random() > 0.5 ? 1 : 0);
  };

  const reset = () => {
    setMeasured(false);
  };

  return (
    <div className="mini-simulator circuit-simulator">
      <div className="bloch-meta">
        <h4>Bell State Entanglement</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Two qubits are in a Bell State: (|00⟩ + |11⟩) / √2</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', margin: '30px 0' }}>
          <div style={{ padding: '20px', border: '2px solid var(--primary-color)', borderRadius: '10px' }}>
            <h3>Alice's Qubit</h3>
            <div style={{ fontSize: '2rem', marginTop: '10px' }}>
              {measured ? `|${result}⟩` : '|?⟩'}
            </div>
          </div>
          <div style={{ padding: '20px', border: '2px solid var(--primary-color)', borderRadius: '10px' }}>
            <h3>Bob's Qubit</h3>
            <div style={{ fontSize: '2rem', marginTop: '10px' }}>
              {measured ? `|${result}⟩` : '|?⟩'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button className="gate-btn" onClick={measure} disabled={measured}>Measure Alice</button>
          <button className="gate-btn reset-btn" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
}