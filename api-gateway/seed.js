const mongoose = require('mongoose');
const Course = require('./models/Course');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:examplepassword@localhost:27017/quantumedge?authSource=admin';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const { createClient } = require('redis');

const curriculum = [
  {
    id: 'quantum-fundamentals',
    title: 'Quantum Fundamentals',
    description: 'Understand qubits, superposition, entanglement, Bloch sphere.',
    prerequisites: [],
    estHours: 8,
    content: `# Quantum Fundamentals\n\nWelcome to the world of Quantum Computing! In this tutorial, we will explore the fundamental concepts that distinguish quantum mechanics from classical physics.\n\n## 1. What is a Qubit?\nClassical computers use bits, which can be strictly \`0\` or \`1\`. A quantum computer uses quantum bits (qubits), which can exist in a state of **superposition**—meaning they can represent \`0\`, \`1\`, or any quantum proportion of both simultaneously.\n\nMathematically, a qubit state $|\\psi\\rangle$ is represented as:\n$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$\nwhere $|\\alpha|^2 + |\\beta|^2 = 1$.\n\n## 2. The Bloch Sphere\nThe Bloch sphere is a geometric representation of a single qubit's state space. \n- The North Pole represents $|0\\rangle$.\n- The South Pole represents $|1\\rangle$.\n- The equator represents equal superpositions, such as the $|+\\rangle$ and $|-\\rangle$ states.\n\n## 3. Superposition and Entanglement\n- **Superposition:** The ability of a quantum system to be in multiple states at the same time until it is measured.\n- **Entanglement:** A phenomenon where two or more qubits become perfectly correlated. If you measure one entangled qubit, you instantly know the state of the other, regardless of distance!\n\n> [!TIP]\n> **Lab Exercise:** You will use the \`plot_bloch_vector\` function in Qiskit to visualize a qubit vector pointing along the X-axis (the $|+\\rangle$ state).\n\n\`\`\`simulator\ntype: probability\n\`\`\``,
    starterCode: `# Visualize a Bloch Sphere
from qiskit.visualization import plot_bloch_vector
import math

# To point to the positive X-axis (|+> state):
# Radius r=1, Theta=pi/2, Phi=0
# Complete this vector:
bloch_vector = [1, math.pi/2, 0]
print("Bloch vector plotted")`
  },
  {
    id: 'programming-foundations',
    title: 'Programming Foundations',
    description: 'Python basics; Git/GitHub workflow.',
    prerequisites: [],
    estHours: 5,
    content: `# Programming Foundations\n\nBefore we can program quantum computers, we need a strong foundation in classical programming. The de-facto language for quantum computing today is Python.\n\n## 1. Python Basics\nPython is an interpreted, high-level language. It uses indentation for scoping instead of curly braces.\n\n\`\`\`python\ndef hello_quantum():\n    print("Hello, Quantum World!")\n\`\`\`\n\n## 2. Using Libraries\nQuantum frameworks like Qiskit are simply Python libraries. You import them just like any other module:\n\n\`\`\`python\nimport numpy as np\nfrom qiskit import QuantumCircuit\n\`\`\`\n\n> [!TIP]\n> **Lab Exercise:** Write a simple Python script to print the first 5 numbers of the Fibonacci sequence.\n\n\`\`\`simulator\ntype: entanglement\n\`\`\``,
    starterCode: `# Write a python script to print the first 5 Fibonacci numbers

def fib(n):
    # Your code here
    pass

print("Done")`
  },
  {
    id: 'intro-to-qiskit',
    title: 'Intro to Qiskit',
    description: 'Install Qiskit; create/run simple circuits on simulators.',
    prerequisites: ['programming-foundations'],
    estHours: 6,
    content: `# Introduction to Qiskit\n\nQiskit is an open-source SDK developed by IBM for working with quantum computers at the level of pulses, circuits, and application modules.\n\n## 1. The QuantumCircuit Class\nThe core of Qiskit is the \`QuantumCircuit\` object. You initialize it by specifying the number of qubits, and optionally the number of classical bits (for storing measurements).\n\n\`\`\`python\nfrom qiskit import QuantumCircuit\n\n# Create a circuit with 1 qubit and 1 classical bit\nqc = QuantumCircuit(1, 1)\n\`\`\`\n\n## 2. Adding Gates\nYou can apply gates as methods on the circuit object.\n\`\`\`python\nqc.x(0) # Apply Pauli-X (NOT) gate to qubit 0\n\`\`\`\n\n## 3. Measuring\nMeasurements collapse the quantum state and store the result in classical bits.\n\`\`\`python\nqc.measure(0, 0) # Measure qubit 0 into classical bit 0\n\`\`\`\n\n> [!TIP]\n> **Lab Exercise:** Create a 1-qubit circuit, apply an X gate to flip it from \`0\` to \`1\`, and measure it.\n\n\`\`\`simulator\ntype: density-matrix\n\`\`\``,
    starterCode: `from qiskit import QuantumCircuit

# Create a circuit with 1 qubit
qc = QuantumCircuit(1)

# Apply Pauli-X gate
qc.x(0)

# Add measurement
qc.measure_all()`
  },
  {
    id: 'quantum-gates',
    title: 'Quantum Gates & Circuits',
    description: 'Implement single/multi-qubit gates; understand Pauli ops.',
    prerequisites: ['quantum-fundamentals', 'intro-to-qiskit'],
    estHours: 10,
    content: `# Quantum Gates and Circuits\n\nJust as classical logic circuits are built from logic gates (AND, OR, NOT), quantum circuits are built from quantum gates. \n\n## 1. Single Qubit Gates\n- **Pauli-X (NOT):** Flips $|0\\rangle$ to $|1\\rangle$ and vice-versa.\n- **Pauli-Z:** Flips the phase of the qubit (rotates around Z axis).\n- **Hadamard (H):** Creates a perfect 50/50 superposition. $|0\\rangle \\xrightarrow{H} \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$\n\n## 2. Multi-Qubit Gates\n- **CNOT (Controlled-NOT):** The most fundamental 2-qubit gate. It applies an X gate to the *target* qubit only if the *control* qubit is $|1\\rangle$.\n\n## 3. Creating Entanglement (The Bell State)\nBy combining a Hadamard gate and a CNOT gate, we can create entangled qubits!\n\n\`\`\`python\nqc = QuantumCircuit(2)\nqc.h(0)           # Put qubit 0 in superposition\nqc.cx(0, 1)       # Entangle qubit 0 and 1\n\`\`\`\n\n> [!TIP]\n> **Lab Exercise:** Recreate the Bell State circuit in the editor.\n\n\`\`\`simulator\ntype: bloch-sphere\nstate: superposition\n\`\`\``,
    starterCode: `from qiskit import QuantumCircuit

# Build a Bell state
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()`
  },
  {
    id: 'circuit-visualization',
    title: 'Circuit Visualization',
    description: 'Visualize circuits, measurement histograms, Bloch vectors.',
    prerequisites: ['quantum-gates'],
    estHours: 4,
    content: `# Circuit Visualization\n\nVisualizing quantum circuits and results is crucial for debugging and understanding quantum algorithms.\n\n## 1. Drawing Circuits\nQiskit provides an easy way to draw circuits in ASCII/text format directly in the terminal, or using Matplotlib for rich graphics.\n\n\`\`\`python\nprint(qc.draw('text'))\n\`\`\`\n\n## 2. Histograms\nWhen you run a quantum circuit on a simulator with "shots" (e.g. 1024 times), you get a dictionary of counts. You can visualize this data as a histogram to see the probability distribution.\n\n> [!TIP]\n> **Lab Exercise:** Create a 3-qubit GHZ state (an extension of the Bell state) and rely on the platform's automatic visualizer to render your circuit diagram in the side panel!\n\n\`\`\`simulator\ntype: circuit-demo\ngates: H,X,M\n\`\`\``,
    starterCode: `from qiskit import QuantumCircuit

# 3-Qubit GHZ State
qc = QuantumCircuit(3)
qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.measure_all()

# The visualizer panel will automatically render this!`
  },
  {
    id: 'parameterized-circuits',
    title: 'Parameterized & Dynamic Circuits',
    description: 'Use parameterized circuits for algorithms (VQE); dynamic (flow control).',
    prerequisites: ['quantum-gates'],
    estHours: 10,
    content: `# Parameterized Circuits\n\nIn modern variational quantum algorithms (like VQA and VQE), we don't hardcode rotation angles. Instead, we use *parameters* that can be optimized by a classical optimizer in a loop.\n\n## 1. The Parameter Class\nQiskit allows you to inject symbolic parameters into your gates.\n\n\`\`\`python\nfrom qiskit.circuit import Parameter\n\ntheta = Parameter("θ")\nqc = QuantumCircuit(1)\nqc.rx(theta, 0)  # Rotate around X-axis by an unknown angle theta\n\`\`\`\n\n## 2. Binding Parameters\nBefore executing the circuit, you must "bind" the parameter to a concrete numerical value.\n\n\`\`\`python\nbound_qc = qc.assign_parameters({theta: 3.14159})\n\`\`\`\n\n> [!TIP]\n> **Lab Exercise:** Create a parameterized circuit with two parameters $\\theta$ and $\\phi$. Bind them to $\\pi$ and $\\pi/2$ respectively.\n\n\`\`\`simulator\ntype: parameterized\n\`\`\``,
    starterCode: `from qiskit import QuantumCircuit
from qiskit.circuit import Parameter
import math

theta = Parameter("θ")
phi = Parameter("φ")

qc = QuantumCircuit(1)
qc.rx(theta, 0)
qc.rz(phi, 0)

# Bind the parameters
bound_qc = qc.assign_parameters({theta: math.pi, phi: math.pi/2})
bound_qc.measure_all()`
  },
  {
    id: 'grovers-algorithm',
    title: "Grover's Search Algorithm",
    description: 'O(sqrt(N)) unstructured database search using amplitude amplification.',
    prerequisites: ['parameterized-circuits'],
    estHours: 12,
    content: `# Grover's Algorithm\n\nGrover's algorithm demonstrates one of the most famous quantum advantages: it can search an unstructured database of $N$ items in $O(\\sqrt{N})$ time, compared to $O(N)$ classically.\n\n## 1. The Oracle\nThe oracle is a black-box function that identifies the "winner" state by flipping its phase (multiplying its amplitude by -1).\n\n## 2. Amplitude Amplification (The Diffuser)\nOnce the winner is marked with a negative phase, the "diffuser" operator performs an inversion about the mean. Because the winner's amplitude is negative, the mean is lowered, and flipping around it dramatically *amplifies* the probability of measuring the winner.\n\n## 3. The Grover Iterator\nThe oracle and diffuser are repeated approximately $\\frac{\\pi}{4} \\sqrt{N}$ times.\n\n> [!TIP]\n> **Lab Exercise:** Review the provided oracle for state $|11\\rangle$. Build the diffusion operator and measure the amplified state.\n\n\`\`\`simulator\ntype: grover\n\`\`\``,
    starterCode: `from qiskit import QuantumCircuit

# Grover for 2 qubits (winner is |11>)
qc = QuantumCircuit(2)

# Initialization
qc.h([0, 1])

# Oracle for |11>
qc.cz(0, 1)

# Diffuser
qc.h([0, 1])
qc.z([0, 1])
qc.cz(0, 1)
qc.h([0, 1])

qc.measure_all()`
  },
  {
    id: 'shors-algorithm',
    title: "Shor's Factoring Algorithm",
    description: 'Break RSA encryption using Quantum Phase Estimation (QPE).',
    prerequisites: ['grovers-algorithm'],
    estHours: 15,
    content: `# Shor's Algorithm\n\nShor's algorithm famously factors prime numbers exponentially faster than the best known classical algorithms, posing a significant threat to RSA encryption.\n\n## 1. Quantum Fourier Transform (QFT)\nThe QFT is the quantum analogue of the discrete Fourier transform. It maps the computational basis to the Fourier basis and is central to period finding.\n\n## 2. Period Finding\nShor's algorithm relies on classical number theory reducing factoring to "period finding" of the function $f(x) = a^x \\pmod N$. A quantum computer can find this period $r$ simultaneously in superposition.\n\n## 3. Quantum Phase Estimation (QPE)\nQPE uses the QFT to estimate the eigenvalue (phase) of a unitary operator, which yields the period $r$.\n\n> [!TIP]\n> **Lab Exercise:** Implementing full Shor's is complex! Let's start by implementing a 3-qubit Quantum Fourier Transform (QFT) circuit.\n\n\`\`\`simulator\ntype: shor\n\`\`\``,
    starterCode: `from qiskit import QuantumCircuit
import math

qc = QuantumCircuit(3)
# Apply H to q0, then controlled phase rotations
qc.h(0)
qc.cp(math.pi/2, 1, 0)
qc.cp(math.pi/4, 2, 0)

qc.h(1)
qc.cp(math.pi/2, 2, 1)

qc.h(2)
qc.swap(0, 2)

qc.measure_all()`
  },
  {
    id: 'vqe',
    title: 'Variational Quantum Eigensolver (VQE)',
    description: 'Calculate molecular ground state energies using hybrid quantum-classical loops.',
    prerequisites: ['shors-algorithm'],
    estHours: 15,
    content: `# Variational Quantum Eigensolver (VQE)\n\nVQE is a flagship algorithm for the NISQ (Noisy Intermediate-Scale Quantum) era. It is a hybrid algorithm that uses both classical and quantum resources to find the ground state energy of a molecule (represented as a Hamiltonian).\n\n## 1. The Ansatz\nAn *ansatz* is a parameterized quantum circuit representing a guess of the molecule's wave function.\n\n## 2. The Cost Function\nThe quantum computer prepares the ansatz state and measures its energy with respect to the Hamiltonian.\n\n## 3. The Classical Optimizer\nA classical optimizer (like COBYLA or SPSA) takes the measured energy, adjusts the parameters $\\vec{\\theta}$, and feeds them back into the quantum circuit. This loop repeats until the minimum energy is found.\n\n> [!TIP]\n> **Lab Exercise:** Create a simple Hardware Efficient Ansatz for 2 qubits using parameterized RY gates and a CX entanglement layer.\n\n\`\`\`simulator\ntype: vqe\n\`\`\``,
    starterCode: `from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector

# 4 parameters for a 2-qubit ansatz
thetas = ParameterVector("θ", 4)

ansatz = QuantumCircuit(2)
# Layer 1
ansatz.ry(thetas[0], 0)
ansatz.ry(thetas[1], 1)

# Entanglement
ansatz.cx(0, 1)

# Layer 2
ansatz.ry(thetas[2], 0)
ansatz.ry(thetas[3], 1)

print("Ansatz created")`
  },
  {
    id: 'capstone',
    title: 'Capstone Project',
    description: 'Design and implement a complete quantum application.',
    prerequisites: ['vqe'],
    estHours: 20,
    content: `# Capstone Project\n\nCongratulations on making it this far! In this final module, you will synthesize everything you've learned.\n\n## The Challenge\nYou must design a hybrid quantum-classical application that utilizes both Qiskit (Python) and QuEST (C++).\n\nYou will:\n1. Construct an advanced ansatz using Qiskit.\n2. Simulate the high-depth circuit using the C++ backend for performance.\n3. Write a brief report analyzing the decoherence noise overhead using the AI Code Reviewer.\n\n> [!TIP]\n> **Lab Exercise:** Switch your editor to C++ (QuEST) and write a QuEST simulation that initializes a register, applies a Hadamard layer, and measures the probabilities.\n\n\`\`\`simulator\ntype: hardware\n\`\`\``,
    starterCode: `// Include QuEST library
#include <QuEST.h>
#include <iostream>

int main() {
  QuESTEnv env = createQuESTEnv();
  Qureg qubits = createQureg(3, env);
  
  // Initialize to |000>
  initZeroState(qubits);
  
  // Apply Hadamard to all qubits
  for(int i=0; i<3; i++) {
      hadamard(qubits, i);
  }
  
  qreal prob = getProbAmp(qubits, 0);
  std::cout << "Probability of |000>: " << prob << "\\n";
  
  destroyQureg(qubits, env);
  destroyQuESTEnv(env);
  return 0;
}`
  }
];

const fs = require('fs');
const path = require('path');

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding');
    
    // Clear existing data
    await Course.deleteMany({});
    await User.deleteMany({});
    const challengeData = {
      'quantum-fundamentals': { title: '1-Qubit Superposition', description: 'Create a superposition state with exactly 1 gate (Hadamard).', metric: 'gates', criteria: { maxGates: 1 } },
      'programming-foundations': { title: 'Python Fibonacci', description: 'Print output.', metric: 'gates', criteria: { maxGates: 100 } },
      'intro-to-qiskit': { title: 'Circuit Size Optimization', description: 'Create a 3-qubit circuit with depth <= 3.', metric: 'depth', criteria: { maxDepth: 3 } },
      'quantum-gates': { title: 'Bell State Preparation', description: 'Maximize the fidelity of this Bell state preparation.', metric: 'fidelity', criteria: { targetFidelity: 1.0, targetState: 'bell' } },
      'circuit-visualization': { title: 'GHZ State Size', description: 'Prepare a GHZ state with exactly 3 gates.', metric: 'gates', criteria: { maxGates: 3 } },
      'parameterized-circuits': { title: 'Parameter Binding', description: 'Create a parameterized circuit with exactly 2 parameters and a depth of 2.', metric: 'depth', criteria: { maxDepth: 2 } },
      'grovers-algorithm': { title: 'Grover Search Optimization', description: 'Implement a 3-qubit Grover search in under 15 gates.', metric: 'gates', criteria: { maxGates: 15 } },
      'shors-algorithm': { title: 'QFT Optimization', description: 'Implement a 3-qubit QFT in under 10 gates.', metric: 'gates', criteria: { maxGates: 10 } },
      'vqe': { title: 'VQE Runtime Optimization', description: 'Optimize this VQE circuit below 50ms runtime.', metric: 'runtime', criteria: { maxRuntimeMs: 50 } },
      'capstone': { title: 'Hardware Efficient Ansatz', description: 'Design an advanced circuit using exactly 5 qubits and gate count <= 30.', metric: 'gates', criteria: { maxGates: 30 } }
    };
    
    // Dynamically load content from markdown files if they exist
    for (let mod of curriculum) {
      if (challengeData[mod.id]) {
        mod.challenge = challengeData[mod.id];
      }
      const filePath = path.join(__dirname, 'content', `${mod.id}.md`);
      if (fs.existsSync(filePath)) {
        mod.content = fs.readFileSync(filePath, 'utf8');
      }
    }

    // Create the course
    const course = new Course({
      courseId: 'quantum-dev-101',
      title: 'IBM Certified Quantum Developer Curriculum',
      modules: curriculum
    });
    
    // Save the course to the database
    await course.save();
    console.log('Curriculum seeded successfully (10 Modules)');
    
    // Seed a test user
    const user = new User({
      username: 'student1',
      progress: [
        { moduleId: 'quantum-fundamentals', completed: true, score: 100 },
        { moduleId: 'programming-foundations', completed: true, score: 100 },
        { moduleId: 'intro-to-qiskit', completed: true, score: 100 }
      ]
    });
    
    // Save the user to the database
    await user.save();
    console.log('Test user seeded');
    
    // Clear Redis Cache
    try {
      const redisClient = createClient({ url: REDIS_URL });
      await redisClient.connect();
      const keys = await redisClient.keys('curriculum:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Cleared ${keys.length} cached curriculum keys from Redis`);
      }
      await redisClient.disconnect();
    } catch (e) {
      console.log('Redis cache not cleared (is Redis running?)', e.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
