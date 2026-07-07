<div align="center">
  <img src="https://quantum-computing.ibm.com/assets/quantum-bg.gif" width="100%" height="250" style="object-fit: cover;" alt="Quantum Background" />
  
  <br />
  <h1>⚛️ QuantumEdge</h1>
  <p><strong>The Next-Generation Interactive Quantum Computing Curriculum</strong></p>

  <p>
    <img alt="Docker" src="https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker" />
    <img alt="React" src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img alt="Python" src="https://img.shields.io/badge/Qiskit-Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
    <img alt="C++" src="https://img.shields.io/badge/QuEST-C++-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white" />
  </p>
</div>

<br />

## 🌟 Overview

QuantumEdge is a comprehensive, interactive learning platform designed to take students from quantum beginners to advanced algorithm engineers. By bridging the gap between theoretical math and practical coding, QuantumEdge offers a state-of-the-art interactive lab where users can write Python (Qiskit) or C++ (QuEST) and instantly visualize the execution of their quantum circuits.

<br />

## 🚀 Key Features

*   🧠 **10 Comprehensive Modules**: Learn everything from Linear Algebra to VQE and Shor's Algorithm.
*   💻 **Interactive Coding Lab**: An embedded VS Code-style editor (Monaco) with live code execution.
*   ⚛️ **Dual Language Support**: Write in **Python (Qiskit)** or **C++ (QuEST)**.
*   📈 **Live Circuit Visualizer**: Watch your gates trace through the circuit dynamically as you code.
*   🤖 **AI Code Reviewer**: Integrated AI that analyzes your quantum code and provides feedback.
*   🔒 **Optional Authentication**: Sign in via Email, Google, or GitHub, or stay anonymous with local storage tracking.

<br />

## 🛠️ Architecture

QuantumEdge is built with a highly scalable, distributed microservices architecture using Docker.

| Service | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, TS | Glassmorphic UI with Markdown rendering and Monaco editor. |
| **API Gateway** | Node.js, Express | Handles routing, authentication, and job queuing. |
| **Python Worker** | Python, Qiskit | Secure sandbox that executes user Qiskit code. |
| **C++ Worker** | C++, QuEST | High-performance state-vector simulator for C++ code. |
| **Database** | MongoDB | Stores curriculum content and user data. |
| **Message Broker**| RabbitMQ | Distributes simulation jobs to the workers asynchronously. |
| **Cache** | Redis | Caches job results for lightning-fast retrievals. |

<br />

## ☁️ Deployment (AWS EC2 Free Tier)

Ready to launch this to the world? We've prepared an automated script that installs all dependencies and spins up the platform on a fresh AWS EC2 instance.

1.  Provision an **Ubuntu 22.04 LTS** EC2 instance (t2.micro / Free Tier eligible).
2.  SSH into your instance:
    ```bash
    ssh -i your-key.pem ubuntu@<your-ec2-ip>
    ```
3.  Clone the repository:
    ```bash
    git clone https://github.com/Ashutosh-kumar-06/QuantumEdge.git
    cd QuantumEdge
    ```
4.  Run the automated deployment script:
    ```bash
    chmod +x setup-ec2.sh
    ./setup-ec2.sh
    ```
5.  Open your browser and navigate to `http://<your-ec2-ip>:5173`.

<br />

## 🔑 Firebase Authentication (Optional)

QuantumEdge supports Firebase Authentication for Google, GitHub, and Email sign-ins.
To enable real authentication, update the `frontend/src/firebase.ts` file with your own Firebase project credentials.

<br />

<div align="center">
  <i>Built with passion for the future of Quantum Software Engineering.</i>
</div>
