import { useState } from 'react';
import '../../simulator.css';

export default function HardwareSimulator() {
  const [noisy, setNoisy] = useState(false);

  return (
    <div className="mini-simulator circuit-simulator">
      <div className="bloch-meta">
        <h4>Ideal vs Hardware Simulation</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Toggle to see the effect of thermal relaxation and depolarizing noise on a GHZ state.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', gap: '20px' }}>
          <div style={{ width: '40px' }}>
            <div style={{ height: noisy ? '85px' : '100px', background: 'var(--primary-color)', transition: 'height 0.3s', marginTop: noisy ? '15px' : '0' }}></div>
            <p>000</p>
          </div>
          <div style={{ width: '40px' }}>
            <div style={{ height: noisy ? '10px' : '0px', background: 'var(--danger)', transition: 'height 0.3s', marginTop: noisy ? '90px' : '100px' }}></div>
            <p>001</p>
          </div>
          <div style={{ width: '40px' }}>
            <div style={{ height: noisy ? '15px' : '0px', background: 'var(--danger)', transition: 'height 0.3s', marginTop: noisy ? '85px' : '100px' }}></div>
            <p>010</p>
          </div>
          <div style={{ width: '40px' }}>
            <div style={{ height: noisy ? '80px' : '100px', background: 'var(--primary-color)', transition: 'height 0.3s', marginTop: noisy ? '20px' : '0' }}></div>
            <p>111</p>
          </div>
        </div>
        
        <button className="gate-btn" onClick={() => setNoisy(!noisy)}>{noisy ? 'Switch to Ideal' : 'Switch to Real Hardware'}</button>
      </div>
    </div>
  );
}