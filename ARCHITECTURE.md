# 🛠️ QuantumEdge Architecture

QuantumEdge is a distributed application designed to provide interactive quantum computing curriculum. It uses a modern, scalable microservices architecture that safely executes user-provided quantum code.

## System Diagram

```mermaid
graph TD
    %% Define styles
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef queue fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef db fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    classDef worker fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff

    %% Components
    Client[React Frontend<br/>Vite / TS]:::client
    Nginx((Nginx<br/>Reverse Proxy<br/>HTTPS / WSS)):::client
    API[API Gateway<br/>Express.js + Socket.io]:::api
    Redis[(Redis<br/>Rate Limiting)]:::db
    Mongo[(MongoDB<br/>Users, Courses, Jobs)]:::db
    RabbitMQ[[RabbitMQ<br/>Message Broker]]:::queue
    Firebase((Firebase<br/>Auth API)):::client
    Gemini((Gemini AI<br/>API)):::client
    
    subgraph Workers
        PyWorker[Python Worker<br/>Qiskit]:::worker
        CppWorker[C++ Worker<br/>QuEST]:::worker
    end

    subgraph Sandboxes
        PySandbox[Python Sandbox<br/>Docker]:::worker
        CppSandbox[C++ Sandbox<br/>Docker]:::worker
    end

    %% Flow
    Client -. "WebRTC (Peer-to-Peer)" .- Client
    Client -- "OAuth2" --> Firebase
    Client -- "HTTPS / WSS\n(Rate Limited)" --> Nginx
    Nginx -- "Reverse Proxy" --> API
    API <--> Redis
    API <--> Mongo
    API -- "REST" --> Gemini
    
    API -- "Publish Job\n(Async)" --> RabbitMQ
    RabbitMQ -- "Consume Job" --> PyWorker
    RabbitMQ -- "Consume Job" --> CppWorker
    
    PyWorker -- "Spawn/Exec" --> PySandbox
    CppWorker -- "Spawn/Exec" --> CppSandbox
    
    PyWorker -- "Publish Result" --> RabbitMQ
    CppWorker -- "Publish Result" --> RabbitMQ
    
    RabbitMQ -- "Consume Result" --> API
```

## Component Details

### 1. Nginx (Reverse Proxy & Load Balancer)
- **Role:** Handles incoming HTTPS and WSS (Secure WebSockets) traffic from the internet, terminating SSL/TLS via Let's Encrypt, and proxying requests to the internal API Gateway.
- **Security:** Protects against direct exposure of internal services, blocks malformed requests, and provides a layer of DDOS protection.

### 2. Frontend (React / Vite)
- **Role:** Interactive UI with Monaco editor, markdown rendering, and circuit visualizations.
- **WebRTC:** Uses simple-peer to establish direct peer-to-peer UDP connections for low-latency video and audio streaming during meetings, bypassing the API Gateway.
- **Auth:** Integrates with Firebase SDK for secure Google, GitHub, and Email authentication.

### 3. API Gateway (Node.js / Express + Socket.io)
- **Role:** Central entry point for all API requests and real-time collaboration. Handles HTTP routing, rate limiting, and queuing jobs.
- **WebSockets:** Uses `socket.io` to manage real-time rooms for Group Chat and Group Video meetings. Broadcasts `cursor_move`, `code_update`, `whiteboard_update`, and `terminal_output` events to synchronize the collaborative IDE state across all connected clients in a room.
- **AI Integration:** Securely communicates with the external Google Gemini API for the AI Code Review feature.
- **Rate Limiting:** Sliding-window rate limiter backed by Redis. Strict limits on execution (`POST /api/simulate`) and AI endpoints.

### 4. Redis (Cache & Rate Limiting)
- **Role:** High-speed in-memory store.
- **Usage:** Currently used for tracking rate limit counters per IP. Will be used for caching curriculum data in the future.

### 5. MongoDB (Database)
- **Role:** Persistent storage for user profiles, curriculum content, and simulation job records.
- **Why Mongo?** Document model is ideal for flexible curriculum data (Markdown content, code snippets) and unstructured job results.

### 6. RabbitMQ (Message Broker)
- **Role:** Asynchronous task queue decoupling the API Gateway from execution workers.
- **Why not gRPC?** Code execution takes 5–15 seconds. gRPC (synchronous request/response) would block the API thread and keep HTTP connections open too long. The asynchronous fire-and-forget publish/subscribe pattern of RabbitMQ is perfect for this.

### 7. Simulation Workers (Python & C++)
- **Role:** Listen to RabbitMQ for jobs, execute them safely, and post results back to RabbitMQ.
- **Security (Docker-in-Docker):** Workers spawn ephemeral, resource-constrained, network-disabled containers (`--network none`, `--memory 256m`) for each user job to prevent malicious code execution.

## 📊 System Resource Requirements

To run this application reliably, the following minimum system resources are required:

### Storage (Disk Size)
Total disk space required is **~5 to 6 GB**:
- **Source Code:** ~10 MB
- **Base Infrastructure Images:** MongoDB (~700MB), RabbitMQ (~250MB), Redis (~35MB)
- **Custom Built Images:** C++ Worker (1.42GB), Python Worker (1.34GB), Frontend (767MB), API Gateway (265MB)

### Memory (RAM)
The application requires **1.5 GB to 2.5 GB of RAM**. 

**Base Idle Memory (~830 MB):**
- Frontend (Vite): ~500 MB
- RabbitMQ: ~140 MB
- MongoDB: ~110 MB
- API Gateway: ~45 MB
- Workers & Redis: ~35 MB combined

**Spike Memory:**
- **Building:** Running `docker compose up --build` uses over 1.5GB RAM due to C++ compilation (CMake) and Python package downloads.
- **Execution:** When a user runs a simulation, the workers spawn temporary Docker containers that can consume up to 256MB of RAM per concurrent job.

*(Note: When running on a 1GB RAM machine like an AWS `t2.micro`, a 2GB Swap file is mandatory to prevent Out-Of-Memory crashes during the build and execution phases).*
