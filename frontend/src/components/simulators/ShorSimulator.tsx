import { useState } from 'react';
import '../../simulator.css';

export default function ShorSimulator() {
  const [a, setA] = useState(7);
  const N = 15;
  const period = a === 7 ? 4 : (a === 11 ? 2 : (a === 2 ? 4 : 4));
  const [step, setStep] = useState(0);

  return (
    <div className="mini-simulator circuit-simulator">
      <div className="bloch-meta">
        <h4>Shor's Period Finding</h4>
        <span className="badge">Interactive</span>
      </div>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Find the period of f(x) = {a}^x mod 15</p>
        
        <select value={a} onChange={(e) => { setA(parseInt(e.target.value)); setStep(0); }} className="lang-select" style={{ margin: '10px 0', padding: '5px' }}>
          <option value="7">a = 7</option>
          <option value="11">a = 11</option>
          <option value="2">a = 2</option>
        </select>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', margin: '20px 0' }}>
          {[0,1,2,3,4,5,6].map(x => {
            const val = Math.pow(a, x) % N;
            const isHighlight = step > 0 && (x % period === 0);
            return (
              <div key={x} style={{ padding: '10px', background: isHighlight ? 'var(--success-color)' : 'rgba(255,255,255,0.1)', color: isHighlight ? '#000' : '#fff', borderRadius: '5px' }}>
                <div>x={x}</div>
                <div style={{ fontWeight: 'bold' }}>{val}</div>
              </div>
            );
          })}
        </div>

        <button className="gate-btn" onClick={() => setStep(1)} disabled={step > 0}>Find Period via QPE</button>
        {step > 0 && <p style={{ marginTop: '10px', color: 'var(--success-color)' }}>Period r = {period}. (GCD computed classically to find factors!)</p>}
      </div>
    </div>
  );
}