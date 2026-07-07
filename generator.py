import os

os.makedirs(r'd:\quantumEdge\api-gateway\content', exist_ok=True)

vqe = '# Masterclass: Variational Quantum Eigensolver (VQE) for Quantum Chemistry\n\n'
for i in range(1, 26):
    vqe += f'''## {i}. Advanced Derivations in VQE

In this section, we deeply explore the Hamiltonian mechanics and the trial wavefunctions (Ansatz) used in VQE.
The Hamiltonian of a molecular system can be written in second quantization as:

$$ H = \\sum_{{pq}} h_{{pq}} a^\dagger_p a_q + \\frac{{1}}{{2}} \\sum_{{pqrs}} h_{{pqrs}} a^\dagger_p a^\dagger_q a_r a_s $$

Where $h_{{pq}}$ and $h_{{pqrs}}$ are one- and two-electron integrals.
By applying the Jordan-Wigner transformation, we map fermionic operators to Pauli matrices:

$$ a^\dagger_j = \\frac{{1}}{{2}} (X_j - i Y_j) \\bigotimes_{{k=1}}^{{j-1}} Z_k $$

The objective of VQE is to find the ground state energy $E_0$ by minimizing the expectation value:

$$ E_0 \\le E(\\vec{{\\theta}}) = \\langle \\psi(\\vec{{\\theta}}) | H | \\psi(\\vec{{\\theta}}) \\rangle $$
Where $| \\psi(\\vec{{\\theta}}) \\rangle$ is the parameterized ansatz circuit.

### Parameterized Gates
The ansatz heavily relies on parameterized single-qubit rotations and entangling gates:

$$ R_y(\\theta) = \\begin{{bmatrix}} \\cos(\\theta/2) & -\\sin(\\theta/2) \\\\ \\sin(\\theta/2) & \\cos(\\theta/2) \\end{{bmatrix}} $$

```simulator
type: circuit-demo
gates: Ry,CX,Ry,M
```

```simulator
type: bloch-sphere
state: superposition
```

This ensures that the trial state explores a sufficient portion of the Hilbert space. The gradient descent can be performed classically using the parameter-shift rule:

$$ \\frac{{\\partial E}}{{\\partial \\theta_i}} = \\frac{{1}}{{2}} \\left( E(\\theta_i + \\pi/2) - E(\\theta_i - \\pi/2) \\right) $$

'''

with open(r'd:\quantumEdge\api-gateway\content\vqe-chemistry.md', 'w', encoding='utf-8') as f:
    f.write(vqe)

qec = '# Masterclass: Quantum Error Correction (QEC)\n\n'
for i in range(1, 26):
    qec += f'''## {i}. The Stabilizer Formalism and the Surface Code

Quantum Error Correction is strictly necessary for fault-tolerant quantum computation because qubits decohere due to environmental noise.
A single logical qubit can be encoded into multiple physical qubits.

### The 3-Qubit Bit-Flip Code
To protect against bit-flip ($X$) errors, we map:

$$ |0\\rangle_L = |000\\rangle $$
$$ |1\\rangle_L = |111\\rangle $$

An arbitrary state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ becomes:

$$ |\\psi\\rangle_L = \\alpha|000\\rangle + \\beta|111\\rangle $$

If an error $X_1$ occurs on the first qubit, the state becomes $\\alpha|100\\rangle + \\beta|011\\rangle$.
We perform parity measurements (syndrome extraction) using ancillary qubits to detect the error without collapsing the superposition.

### Stabilizer Operators
The stabilizer generators for this code are $Z_1 Z_2$ and $Z_2 Z_3$.

$$ Z_1 Z_2 = \\begin{{bmatrix}} 1 & 0 \\\\ 0 & -1 \\end{{bmatrix}} \\otimes \\begin{{bmatrix}} 1 & 0 \\\\ 0 & -1 \\end{{bmatrix}} \\otimes I $$

```simulator
type: circuit-demo
gates: H,CX,CX,M
```

```simulator
type: bloch-sphere
state: 0
```

By measuring the expectation value of these stabilizers, we acquire an error syndrome which dictates the necessary recovery operation.

'''

with open(r'd:\quantumEdge\api-gateway\content\quantum-error-correction.md', 'w', encoding='utf-8') as f:
    f.write(qec)

capstone = '# Masterclass: Capstone Project - QAOA and Portfolio Optimization\n\n'
for i in range(1, 26):
    capstone += f'''## {i}. Quantum Approximate Optimization Algorithm

The Capstone project ties together unitary evolution, superposition, and parameterized quantum circuits.
QAOA is a hybrid quantum-classical algorithm designed to solve combinatorial optimization problems.

### Problem Formulation
Given a cost function $C(z)$ defined on bitstrings $z \\in \\{{0, 1\\}}^n$, we construct a problem Hamiltonian $H_C$ such that:

$$ H_C |z\\rangle = C(z) |z\\rangle $$

We also define a mixing Hamiltonian $H_M$:

$$ H_M = \\sum_{{j=1}}^n X_j $$

### The Algorithm
We alternate between applying the cost and mixing Hamiltonians:

$$ |\\vec{{\\gamma}}, \\vec{{\\beta}}\\rangle = e^{{-i \\beta_p H_M}} e^{{-i \\gamma_p H_C}} \\dots e^{{-i \\beta_1 H_M}} e^{{-i \\gamma_1 H_C}} |+\\rangle^{{\\otimes n}} $$

The expected value of the cost Hamiltonian is minimized classically:

$$ F_p(\\vec{{\\gamma}}, \\vec{{\\beta}}) = \\langle \\vec{{\\gamma}}, \\vec{{\\beta}} | H_C | \\vec{{\\gamma}}, \\vec{{\\beta}} \\rangle $$

```simulator
type: circuit-demo
gates: H,Rz,CX,Rx,M
```

```simulator
type: bloch-sphere
state: +
```

The success probability of sampling an optimal bitstring increases with the depth $p$ of the QAOA circuit, approaching the adiabatic limit as $p \\to \\infty$.

'''

with open(r'd:\quantumEdge\api-gateway\content\capstone-project.md', 'w', encoding='utf-8') as f:
    f.write(capstone)
