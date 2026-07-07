import { useState, useEffect } from 'react';
import '../../simulator.css';

export default function VQESimulator() {
  const [energy, setEnergy] = useState(-0.5);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    let int: any;
    if (optimizing) {
      int = setInterval(() => {
        setEnergy(e => {
          if (e <= -1.13) { clearInterval(int); setOptimizing(false); return -1.137; }
          return e - 0.05;
        });
      }, 100);
    }
    return () => clearInterval(int);
  }, [optimizing]);

  return (
    <div className="mini-simulator bloch-simulator">
      <div className="bloch-meta">
        <h4>VQE Optimization Loop</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Expectation Value (Energy): <strong>{energy.toFixed(3)} Hartree</strong></p>
        <div style={{ position: 'relative', width: '80%', height: '100px', margin: '20px auto', borderLeft: '2px solid #fff', borderBottom: '2px solid #fff' }}>
          <div style={{ 
            position: 'absolute', 
            left: `${(-0.5 - energy) * 150}px`, 
            bottom: `${(-1.137 - energy) * -100 + 10}px`,
            width: '15px', height: '15px', background: 'var(--primary-color)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary-color)', transition: 'all 0.1s'
          }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button className="gate-btn" onClick={() => setOptimizing(true)} disabled={optimizing || energy <= -1.13}>Run Optimizer</button>
          <button className="gate-btn reset-btn" onClick={() => setEnergy(-0.5)} disabled={optimizing}>Reset</button>
        </div>
      </div>
    </div>
  );
}