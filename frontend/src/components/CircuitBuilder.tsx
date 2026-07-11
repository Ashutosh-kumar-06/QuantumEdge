import React, { useState, useEffect } from 'react';

import { Socket } from 'socket.io-client';

interface CircuitBuilderProps {
  onCodeGenerated: (code: string) => void;
  socket?: Socket;
  roomId?: string;
  username?: string;
}

type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | null;

export default function CircuitBuilder({ onCodeGenerated, socket, roomId, username }: CircuitBuilderProps) {
  const [numQubits, setNumQubits] = useState(3);
  const [numMoments, setNumMoments] = useState(5);
  // Grid: moments[m][q] = Gate | null
  const [moments, setMoments] = useState<GateType[][]>(
    Array(numMoments).fill(null).map(() => Array(numQubits).fill(null))
  );

  const handleCellClick = (m: number, q: number) => {
    const types: GateType[] = [null, 'H', 'X', 'Y', 'Z', 'S', 'T'];
    const current = moments[m] ? moments[m][q] : null;
    const currentIndex = types.indexOf(current);
    const nextType = types[(currentIndex + 1) % types.length];
    
    const newMoments = [...moments];
    newMoments[m] = [...newMoments[m]];
    newMoments[m][q] = nextType;
    setMoments(newMoments);

    // Sync with remote peers
    if (socket && roomId) {
      socket.emit('circuit_update', { roomId, username, moments: newMoments });
    }
  };

  // Listen for remote updates
  useEffect(() => {
    if (!socket) return;
    
    const handleRemoteUpdate = (data: any) => {
      // Don't update if we sent it
      if (data.username === username) return;
      setMoments(data.moments);
      // Auto-expand grid if needed
      if (data.moments.length > numMoments) setNumMoments(data.moments.length);
      if (data.moments[0]?.length > numQubits) setNumQubits(data.moments[0].length);
    };

    socket.on('circuit_update', handleRemoteUpdate);
    return () => {
      socket.off('circuit_update', handleRemoteUpdate);
    };
  }, [socket, username, numMoments, numQubits]);

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
        if (gate === 'S') momentCode += `qc.s(${q})\n`;
        if (gate === 'T') momentCode += `qc.t(${q})\n`;
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

  const removeQubit = () => {
    setNumQubits(q => {
      const nextQ = Math.max(1, q - 1);
      // Clean up moments array to remove the last qubit's gates
      const newMoments = moments.map(mRow => mRow.slice(0, nextQ));
      setMoments(newMoments);
      if (socket && roomId) {
        socket.emit('circuit_update', { roomId, username, moments: newMoments });
      }
      return nextQ;
    });
  };

  const removeMoment = () => {
    setNumMoments(m => {
      const nextM = Math.max(1, m - 1);
      const newMoments = moments.slice(0, nextM);
      setMoments(newMoments);
      if (socket && roomId) {
        socket.emit('circuit_update', { roomId, username, moments: newMoments });
      }
      return nextM;
    });
  };

  return (
    <div className="circuit-builder" style={{ padding: '1rem', color: '#fff', background: 'transparent', height: '100%', overflow: 'auto' }}>
      <h3 className="builder-title" style={{ marginTop: 0, marginBottom: '1rem', color: '#64ffda' }}>Visual Circuit Builder</h3>
      <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>Click cells to cycle through gates (H, X, Y, Z, S, T).</p>
      
      <div className="builder-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
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
                    color: moments[m] && moments[m][q] ? '#000' : '#fff',
                    borderRadius: '4px',
                    transition: 'all 0.1s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {moments[m] && moments[m][q] ? moments[m][q] : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="builder-controls" style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setNumMoments(m => m + 1)} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>+ Add Moment</button>
        <button onClick={removeMoment} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#ff6b6b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>- Remove Moment</button>
        <div style={{ width: '1rem' }}></div>
        <button className="add-qubit-btn" onClick={() => setNumQubits(q => q + 1)} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>+ Add Qubit</button>
        <button className="remove-qubit-btn" onClick={removeQubit} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#ff6b6b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>- Remove Qubit</button>
      </div>
    </div>
  );
}
