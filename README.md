<div align="center">
  <img src="https://quantum-computing.ibm.com/assets/quantum-bg.gif" width="100%" height="250" style="object-fit: cover; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" alt="Quantum Background" />
  
  <br /><br />
  <h1>⚛️ QuantumEdge</h1>
  <p><strong>The Next-Generation Interactive Quantum Computing Curriculum & Collaborative IDE</strong></p>
  <p><h3>🔴 Live Demo: <a href="https://quantumedge.duckdns.org/">https://quantumedge.duckdns.org/</a></h3></p>

  <p>
    <a href="#-architecture"><img alt="Docker Architecture" src="https://img.shields.io/badge/Architecture-Microservices-blue?style=for-the-badge&logo=docker" /></a>
    <img alt="React" src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
    <img alt="Python" src="https://img.shields.io/badge/Qiskit-Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
    <img alt="C++" src="https://img.shields.io/badge/QuEST-C++-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white" />
    <img alt="Redis" src="https://img.shields.io/badge/Redis-Rate%20Limiting-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
    <img alt="RabbitMQ" src="https://img.shields.io/badge/RabbitMQ-Async-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" />
    <img alt="WebRTC" src="https://img.shields.io/badge/WebRTC-Video-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
  </p>
</div>

<br />

## 🌟 Overview

QuantumEdge is a comprehensive, interactive learning platform designed to take students from quantum beginners to advanced algorithm engineers. By bridging the gap between theoretical math and practical coding, QuantumEdge offers a **state-of-the-art interactive lab** where users can write Python (Qiskit) or C++ (QuEST) and instantly visualize the execution of their quantum circuits.

Built with a **highly scalable, distributed microservices architecture**, it features secure **Docker-in-Docker sandboxing**, an async **RabbitMQ job queue**, and **WebSockets / WebRTC** for real-time multiplayer collaboration.

<br />

## 🎯 Technical Highlights (For Recruiters & Engineers)

I built QuantumEdge to solve complex distributed systems problems while delivering a seamless user experience. Here are the core technical achievements:

- 🔒 **Production-Grade Security (HTTPS & WSS):** Deployed behind an **Nginx Reverse Proxy** configured with strict Let's Encrypt SSL/TLS certificates, ensuring all REST API calls and WebSocket connections are fully encrypted and secure against packet sniffing.
- 🛡️ **Secure Code Execution (Docker-in-Docker):** To safely execute arbitrary, untrusted user code (Python & C++), the worker nodes dynamically spawn ephemeral, resource-constrained, network-disabled Docker containers for every single job execution.
- ⚡ **Asynchronous Message Queueing:** Instead of blocking API threads with synchronous HTTP/gRPC calls for heavy simulations (5-15s execution time), the system uses **RabbitMQ** to decouple the Express Gateway from the Worker nodes, allowing high concurrency and fault tolerance.
- 🤝 **Real-Time WebRTC & WebSockets:** Implemented a **Full Mesh Topology** WebRTC video conferencing system, seamlessly layered with Socket.io for **Google Docs-style live cursors**, shared multi-file IDEs, and synchronized Excalidraw whiteboards.
- 🧱 **Advanced React Patterns:** Leveraged complex React state management for a VS Code-style Monaco editor environment, including resizable panes, time-travel execution history, and a multi-file project explorer.
- 🚦 **Redis Rate Limiting:** Implemented a robust sliding-window rate limiter per IP address to protect API endpoints and prevent abuse of the Gemini AI Code Review endpoints and Docker execution environments.

<br />

## 🚀 Key Features

| Feature | Description |
|:---|:---|
| 🧠 **10 Comprehensive Modules** | Deep dives from Linear Algebra → VQE → Shor's Algorithm |
| 💻 **Interactive Coding Lab** | VS Code-style Monaco editor with resizable split panels |
| ⚛️ **Dual Language Support** | Execute both Python (Qiskit) and C++ (QuEST) natively |
| 🤝 **Multiplayer Collaboration** | WebRTC Video Chat, Live Multi-User Cursors, and Shared Excalidraw Whiteboards |
| 🗂️ **Multi-File Explorer** | Create and manage multiple Python and C++ files within the browser Sandbox |
| ⏪ **Time-Travel History** | Instantly restore your code state and output from past executions |
| 📚 **Quantum Snippets Library**| 1-click injection of complex Qiskit algorithms (Grover, Shor, VQE) |
| 📈 **Live Circuit Visualizer** | Watch your gates trace through the circuit dynamically with a visual builder |
| 🤖 **AI Code Reviewer** | Gemini-powered analysis to debug and optimize your quantum code |
| 🐳 **Sandboxed Execution** | Docker-out-of-Docker with strict CPU/Memory/Network isolation |

<br />

## 🛠️ Architecture Overview

QuantumEdge is built with a scalable, distributed microservices architecture using Docker Compose.

```mermaid
graph TD
    %% Define styles
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef queue fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef db fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    classDef worker fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff

    %% Components
    subgraph ClientBrowsers["Client Browsers (React/Vite)"]
        ClientA[User A]:::client
        ClientB[User B]:::client
        ClientC[User C]:::client
        
        ClientA -. "WebRTC Video/Audio" .- ClientB
        ClientB -. "WebRTC Video/Audio" .- ClientC
        ClientC -. "WebRTC Video/Audio" .- ClientA
    end
    
    Nginx((Nginx<br/>Load Balancer<br/>HTTPS / WSS)):::client
    API[API Gateway<br/>3x Replicas<br/>Express.js + Socket.io]:::api
    Redis[(Redis<br/>Rate Limiting &<br/>Socket.io Adapter)]:::db
    Mongo[(MongoDB<br/>Users, Projects)]:::db
    RabbitMQ[[RabbitMQ<br/>Message Broker]]:::queue
    TURN((Coturn<br/>TURN Server)):::client
    Firebase((Firebase<br/>Auth API)):::client
    Gemini((Gemini AI<br/>API)):::client
    Yjs[Yjs CRDT Server<br/>WebSocket]:::api
    
    subgraph Workers
        PyWorker[Python Worker<br/>Qiskit]:::worker
        CppWorker[C++ Worker<br/>QuEST]:::worker
    end

    subgraph Ephemeral Sandboxes
        PySandbox[Python Sandbox<br/>Docker]:::worker
        CppSandbox[C++ Sandbox<br/>Docker]:::worker
    end

    %% Flow
    ClientA -- "OAuth2" --> Firebase
    ClientBrowsers -- "HTTPS / WSS (REST & Socket.io)" --> Nginx
    ClientBrowsers -. "STUN/TURN Relay" .-> TURN
    Nginx -- "Reverse Proxy\nRound Robin" --> API
    Nginx -- "/yjs/ Proxy" --> Yjs
    ClientBrowsers -- "WSS Sync" --> Yjs
    API <--> Redis
    API <--> Mongo
    API -- "REST / WebSocket Stream" --> Gemini
    
    API -- "Publish Job (Async)" --> RabbitMQ
    RabbitMQ -- "Consume Job" --> PyWorker
    RabbitMQ -- "Consume Job" --> CppWorker
    
    PyWorker -- "Spawn Container" --> PySandbox
    CppWorker -- "Spawn Container" --> CppSandbox
    
    PyWorker -- "Publish Result" --> RabbitMQ
    CppWorker -- "Publish Result" --> RabbitMQ
    
    RabbitMQ -- "Consume Result" --> API
```

*(For deep technical details on inter-service communication and memory profiles, see [architecture.md](./architecture.md))*

<br />

## 🏗️ Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/Ashutosh-kumar-06/QuantumEdge.git
cd QuantumEdge

# 2. Build and start all distributed services (will take a few minutes)
docker compose up -d --build

# 3. Seed the MongoDB database with the Quantum Curriculum
docker compose exec api-gateway node seed.js

# 4. Open in your browser
# Frontend: http://localhost:5173
# API:      http://localhost:4000/health
```

> **Note on Hardware Requirements:** Idle services consume ~830 MB RAM. Compiling the custom C++ and Python images (`docker compose up --build`) and running concurrent simulations will spike RAM usage up to 2.5 GB. If running on a 1GB machine, ensure a 2GB Swap file is enabled.

<br />

## ☁️ Deployment (AWS EC2 Free Tier)

Deploying to production? See the comprehensive [deployment_guide.md](./docs/deployment_guide.md) for step-by-step instructions on provisioning an AWS EC2 instance, installing Docker, mapping DuckDNS, and setting up an Nginx Reverse Proxy with Let's Encrypt SSL certificates.

<br />

## 📁 Project Structure

```
QuantumEdge/
├── frontend/                 # React 19 + Vite + TypeScript (Monaco, Excalidraw, Socket.io)
├── api-gateway/              # Express.js REST API + WebSocket Server
│   ├── middleware/           # Redis Rate Limiting & Pagination
│   ├── models/               # Mongoose schemas
│   └── index.js              
├── simulation-worker/        # Python 3.10 Qiskit worker (RabbitMQ Consumer)
│   └── sandbox_runner.py     # Docker-in-Docker Ephemeral Spawner
├── cpp-worker/               # C++ QuEST worker (RabbitMQ Consumer)
├── docker-compose.yml        # Orchestrates the 7 Microservices
└── architecture.md           # Deep dive into the architecture
```

<br />

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

<br />

<div align="center">
  <p>Architected & Built with ❤️ by <a href="https://github.com/Ashutosh-kumar-06">Ashutosh Kumar</a></p>
  <p>
    <a href="https://github.com/Ashutosh-kumar-06/QuantumEdge"><img alt="Stars" src="https://img.shields.io/github/stars/Ashutosh-kumar-06/QuantumEdge?style=social" /></a>
    <a href="https://github.com/Ashutosh-kumar-06/QuantumEdge"><img alt="Forks" src="https://img.shields.io/github/forks/Ashutosh-kumar-06/QuantumEdge?style=social" /></a>
  </p>
</div>
