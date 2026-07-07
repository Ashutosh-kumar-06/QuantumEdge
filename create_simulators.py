import os

os.makedirs(r"d:\quantumEdge\frontend\src\components\simulators", exist_ok=True)

simulators = {
    "ProbabilitySimulator.tsx": """import { useState } from 'react';
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
          <div>Probability: <strong>{prob}</strong> ({Math.round(prob * 100)}%)</div>
        </div>
        <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', height: '30px', borderRadius: '15px', overflow: 'hidden' }}>
          <div style={{ width: `${prob * 100}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}""",

    "EntanglementSimulator.tsx": """import { useState } from 'react';
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
}""",

    "DensityMatrixSimulator.tsx": """import { useState } from 'react';
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
}""",

    "ParameterizedSimulator.tsx": """import { useState } from 'react';
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
}""",

    "GroverSimulator.tsx": """import { useState } from 'react';
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
}""",

    "ShorSimulator.tsx": """import { useState } from 'react';
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
}""",

    "VQESimulator.tsx": """import { useState, useEffect } from 'react';
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
}""",

    "HardwareSimulator.tsx": """import { useState } from 'react';
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
}"""
}

for name, code in simulators.items():
    with open(f"d:\\quantumEdge\\frontend\\src\\components\\simulators\\{name}", "w", encoding="utf-8") as f:
        f.write(code)

print("Simulators created!")
