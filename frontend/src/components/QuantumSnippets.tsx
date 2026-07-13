import React from 'react';

const SNIPPETS = [
  {
    id: 'bell',
    name: 'Bell State (Entanglement)',
    description: 'Creates a maximally entangled state between two qubits.',
    code: `from qiskit import QuantumCircuit

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

print("Circuit ready. Run the simulation to see the output!")`
  },
  {
    id: 'grover',
    name: "Grover's Search (2 Qubits)",
    description: "Finds the marked state |11> with quadratic speedup.",
    code: `from qiskit import QuantumCircuit
from qiskit.circuit.library import GroverOperator, ZGate

# 1. State preparation
qc = QuantumCircuit(2)
qc.h([0, 1])

# 2. Oracle (marks |11>)
oracle = QuantumCircuit(2)
oracle.cz(0, 1)

# 3. Diffuser (amplifies probability)
qc.compose(oracle, inplace=True)
qc.h([0, 1])
qc.z([0, 1])
qc.cz(0, 1)
qc.h([0, 1])

qc.measure_all()
print("Grover's circuit built!")`
  },
  {
    id: 'qft',
    name: "Quantum Fourier Transform",
    description: "Performs the QFT on 3 qubits. A core subroutine in Shor's Algorithm.",
    code: `from qiskit import QuantumCircuit
from math import pi

qc = QuantumCircuit(3)

# Qubit 0
qc.h(0)
qc.cp(pi/2, 1, 0)
qc.cp(pi/4, 2, 0)

# Qubit 1
qc.h(1)
qc.cp(pi/2, 2, 1)

# Qubit 2
qc.h(2)

# Swaps
qc.swap(0, 2)

qc.measure_all()
print("QFT circuit complete!")`
  },
  {
    id: 'vqe',
    name: 'Variational Quantum Eigensolver (VQE)',
    description: 'A hybrid quantum-classical algorithm for finding ground states.',
    code: `from qiskit import QuantumCircuit
from qiskit.circuit import Parameter

# Parameterized Ansatz
theta = Parameter('θ')
qc = QuantumCircuit(2)
qc.rx(theta, 0)
qc.cx(0, 1)
qc.measure_all()

# Bind parameter and execute
bound_qc = qc.bind_parameters({theta: 3.14 / 4})
print(bound_qc.draw())
print("VQE Ansatz built with θ = π/4")`
  }
];

interface QuantumSnippetsProps {
  onSelect: (code: string) => void;
}

export default function QuantumSnippets({ onSelect }: QuantumSnippetsProps) {
  return (
    <div style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
      <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>📚 Quantum Snippets</h3>
      <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Click a snippet below to instantly load it into the editor. Warning: this will overwrite your current code!
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {SNIPPETS.map(snippet => (
          <div 
            key={snippet.id} 
            className="snippet-card"
            style={{
              background: '#222',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => {
              if (confirm(`Load ${snippet.name}? This will replace your current code.`)) {
                onSelect(snippet.code);
              }
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#444')}
          >
            <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>{snippet.name}</h4>
            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>{snippet.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
