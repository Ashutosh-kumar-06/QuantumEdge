import React, { useState, useEffect } from 'react';

interface CircuitBuilderProps {
  onCodeGenerated: (code: string) => void;
}

type GateType = 'H' | 'X' | 'Y' | 'Z' | null;

export default function CircuitBuilder({ onCodeGenerated }: CircuitBuilderProps) {
  const [numQubits, setNumQubits] = useState(3);
  const [numMoments, setNumMoments] = useState(5);
  // Grid: moments[m][q] = Gate | null
  const [moments, setMoments] = useState<GateType[][]>(
    Array(numMoments).fill(null).map(() => Array(numQubits).fill(null))
  );

  const handleCellClick = (m: number, q: number) => {
    const types: GateType[] = [null, 'H', 'X', 'Y', 'Z'];
    const current = moments[m][q];
    const currentIndex = types.indexOf(current);
    const nextType = types[(currentIndex + 1) % types.length];
    
    const newMoments = [...moments];
    newMoments[m] = [...newMoments[m]];
    newMoments[m][q] = nextType;
    setMoments(newMoments);
  };

  useEffect(() => {
    // Generate Python code
    let code = `from qiskit import QuantumCircuit\n\n`;
    code += `qc = QuantumCircuit(${numQubits})\n\n`;
    
    for (let m = 0; m < numMoments; m++) {
      let hasGates = false;
      let momentCode = '';
      for (let q = 0; q < numQubits; q++) {
        const gate = moments[m] ? moments[m][q] : null;
        if (gate === 'H') momentCode += `qc.h(${q})\n`;
        if (gate === 'X') momentCode += `qc.x(${q})\n`;
        if (gate === 'Y') momentCode += `qc.y(${q})\n`;
        if (gate === 'Z') momentCode += `qc.z(${q})\n`;
        if (gate) hasGates = true;
      }
      if (hasGates) code += momentCode + '\n';
    }
    
    code += `qc.measure_all()\n`;
    onCodeGenerated(code);
  }, [moments, numQubits, numMoments, onCodeGenerated]);

  // Handle resizing arrays
  useEffect(() => {
    setMoments(prev => {
      const newMoments = Array(numMoments).fill(null).map((_, m) => {
        return Array(numQubits).fill(null).map((_, q) => {
          return (prev[m] && prev[m][q]) ? prev[m][q] : null;
        });
      });
      return newMoments;
    });
  }, [numQubits, numMoments]);

  return (
    <div className="circuit-builder" style={{ padding: '1rem', color: '#fff', background: 'transparent', height: '100%', overflow: 'auto' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#64ffda' }}>Visual Circuit Builder</h3>
      <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>Click cells to cycle through gates (H, X, Y, Z).</p>
      
      <div className="grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowX: 'auto' }}>
        {Array(numQubits).fill(null).map((_, q) => (
          <div key={`q-${q}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', fontWeight: 'bold' }}>q[{q}]</div>
            <div style={{ display: 'flex', gap: '0.2rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#444', zIndex: 0 }}></div>
              {Array(numMoments).fill(null).map((_, m) => (
                <div 
                  key={`cell-${m}-${q}`}
                  onClick={() => handleCellClick(m, q)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #555',
                    background: moments[m] && moments[m][q] ? 'var(--primary)' : '#222',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: 'bold',
                    color: moments[m] && moments[m][q] ? '#000' : '#fff'
                  }}
                >
                  {moments[m] && moments[m][q] ? moments[m][q] : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setNumMoments(m => m + 1)} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>+ Add Moment</button>
        <button onClick={() => setNumMoments(m => Math.max(1, m - 1))} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#ff6b6b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>- Remove Moment</button>
        <div style={{ width: '1rem' }}></div>
        <button onClick={() => setNumQubits(q => q + 1)} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>+ Add Qubit</button>
        <button onClick={() => setNumQubits(q => Math.max(1, q - 1))} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#ff6b6b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>- Remove Qubit</button>
      </div>
    </div>
  );
}
