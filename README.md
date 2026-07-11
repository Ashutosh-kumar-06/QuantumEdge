<div align="center">
  <img src="https://quantum-computing.ibm.com/assets/quantum-bg.gif" width="100%" height="250" style="object-fit: cover;" alt="Quantum Background" />
  
  <br />
  <h1>⚛️ QuantumEdge</h1>
  <p><strong>The Next-Generation Interactive Quantum Computing Curriculum</strong></p>

  <p>
    <img alt="Docker" src="https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker" />
    <img alt="React" src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img alt="Python" src="https://img.shields.io/badge/Qiskit-Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
    <img alt="C++" src="https://img.shields.io/badge/QuEST-C++-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white" />
    <img alt="Redis" src="https://img.shields.io/badge/Redis-Rate%20Limiting-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  </p>
</div>

<br />

## 🌟 Overview

QuantumEdge is a comprehensive, interactive learning platform designed to take students from quantum beginners to advanced algorithm engineers. By bridging the gap between theoretical math and practical coding, QuantumEdge offers a state-of-the-art interactive lab where users can write Python (Qiskit) or C++ (QuEST) and instantly visualize the execution of their quantum circuits.

<br />

## 🚀 Key Features

| Feature | Description |
|:---|:---|
| 🧠 **10 Comprehensive Modules** | Linear Algebra → VQE → Shor's Algorithm |
| 💻 **Interactive Coding Lab** | VS Code-style Monaco editor with resizable panels |
| ⚛️ **Dual Language Support** | Python (Qiskit) and C++ (QuEST) |
| 📈 **Live Circuit Visualizer** | Watch your gates trace through the circuit dynamically |
| 🤖 **AI Code Reviewer** | Gemini-powered analysis of your quantum code |
| 🔒 **Optional Authentication** | Email, Google, or GitHub — or stay anonymous |
| 🛡️ **Rate Limiting** | Redis-backed sliding window per endpoint |
| 📄 **Paginated APIs** | Offset-based pagination with metadata |
| 🐳 **Sandboxed Execution** | Docker-out-of-Docker with network isolation |

<br />

## 🛠️ Architecture

QuantumEdge is built with a scalable, distributed microservices architecture using Docker Compose.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                    (React + Vite + TypeScript)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / REST
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Rate Limiter │  │  Pagination  │  │   Route Handlers       │ │
│  │  (Redis)     │  │  Middleware   │  │  /curriculum /simulate │ │
│  └──────┬──────┘  └──────────────┘  └────────────┬───────────┘ │
│         │                                         │             │
│         ▼                                         ▼             │
│  ┌─────────────┐                          ┌─────────────┐      │
│  │    Redis     │                          │  RabbitMQ   │      │
│  │  (Cache +    │                          │  (Message   │      │
│  │  Rate Limit) │                          │   Broker)   │      │
│  └─────────────┘                          └──────┬──────┘      │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                      ┌────────────────────────────┼────────┐
                      │                            │        │
                      ▼                            ▼        │
           ┌──────────────────┐        ┌────────────────┐   │
           │  Python Worker   │        │   C++ Worker   │   │
           │  (Qiskit)        │        │   (QuEST)      │   │
           │                  │        │                │   │
           │  ┌────────────┐  │        │  ┌──────────┐  │   │
           │  │  Sandbox   │  │        │  │ Sandbox  │  │   │
           │  │  Container │  │        │  │Container │  │   │
           │  └────────────┘  │        │  └──────────┘  │   │
           └──────────────────┘        └────────────────┘   │
                                                            │
                      ┌─────────────────────────────────────┘
                      ▼
           ┌──────────────────┐
           │     MongoDB      │
           │  (Courses, Jobs, │
           │   Users)         │
           └──────────────────┘
```

### Service Details

| Service | Technology | Port | Description |
|:---|:---|:---|:---|
| **Frontend** | React 19, Vite, TypeScript | 5173 | Glassmorphic UI with Monaco editor and resizable panels |
| **API Gateway** | Node.js, Express 5 | 4000 | REST API with rate limiting, pagination, job queuing |
| **Python Worker** | Python 3.10, Qiskit | — | Sandboxed Qiskit code execution via Docker-out-of-Docker |
| **C++ Worker** | Python + g++, QuEST | — | Compiles and runs QuEST C++ code in isolated containers |
| **MongoDB** | Mongo 7 | 27017 | Stores curriculum, user progress, and simulation jobs |
| **RabbitMQ** | RabbitMQ 3 | 5672 | Async message broker for job distribution |
| **Redis** | Redis Alpine | 6379 | Rate limiting counters and caching |

### Inter-Service Communication

| Path | Protocol | Pattern | Why |
|:---|:---|:---|:---|
| Frontend → API Gateway | HTTP/REST | Request-Response | Standard web API |
| API Gateway → Workers | AMQP (RabbitMQ) | Async Pub/Sub | Jobs take 5-15s; async is correct |
| Workers → API Gateway | AMQP (RabbitMQ) | Async Pub/Sub | Results pushed back via queue |
| API Gateway → Redis | TCP | Request-Response | Rate limit counter reads/writes |
| API Gateway → MongoDB | TCP | Request-Response | Database CRUD |

> **Why not gRPC?** The simulation workers run long-running jobs (5-15 seconds). RabbitMQ's async fire-and-forget pattern is the correct choice — gRPC would block API threads. gRPC would only benefit a future low-latency service (e.g., <50ms circuit validation).

<br />

## 📊 System Resource Requirements

To run this application reliably in a production or dev environment, ensure you have the following resources:

| Resource | Requirement | Details |
|:---|:---|:---|
| **Storage** | **~5 to 6 GB** | Base images (Mongo/Redis/Rabbit) + Custom Docker Images (C++/Python workers are ~1.4GB each). |
| **Memory** | **1.5 GB - 2.5 GB** | Idle services consume ~830 MB. Compiling images (`docker compose up --build`) and concurrent simulation jobs will spike RAM usage up to 2.5 GB. |

> [!WARNING]
> If running on a 1GB RAM instance (like AWS `t2.micro`), **you must configure a 2GB Swap file** before running `docker compose build`, otherwise the OS will kill the build process due to Out-Of-Memory errors.

<br />

## 🛡️ Rate Limiting

All API endpoints are protected by Redis-backed sliding window rate limiters.

| Endpoint | Limit | Window | Reason |
|:---|:---|:---|:---|
| `POST /api/simulate` | 10 req | 1 min | Spawns Docker containers |
| `POST /api/review` | 5 req | 1 min | Calls external Gemini API |
| `GET /api/curriculum` | 60 req | 1 min | Light database read |
| `GET /api/job/:id` | 120 req | 1 min | Frontend polling |
| `GET /api/jobs` | 30 req | 1 min | Paginated list |
| `GET /api/progress/:user` | 30 req | 1 min | User data read |

**Headers** returned on every response:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1720700000
```

When exceeded, returns `429 Too Many Requests` with `Retry-After` header.

<br />

## 📄 Paginated API Endpoints

### `GET /api/jobs`
```bash
# Basic pagination
curl "http://localhost:4000/api/jobs?page=1&limit=10"

# With filters
curl "http://localhost:4000/api/jobs?status=completed&language=python&page=2&limit=5"

# Custom sort
curl "http://localhost:4000/api/jobs?sort=createdAt&order=asc"
```

Response:
```json
{
  "jobs": [
    { "jobId": "abc123", "language": "python", "status": "completed", "createdAt": "..." }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### `GET /api/curriculum` (optional pagination)
```bash
# All modules (backward compatible)
curl "http://localhost:4000/api/curriculum"

# Paginated
curl "http://localhost:4000/api/curriculum?page=1&limit=5"
```

<br />

## 🏗️ Quick Start (Local Development)

```bash
# Clone
git clone https://github.com/Ashutosh-kumar-06/QuantumEdge.git
cd QuantumEdge

# Start all services
docker compose up -d --build

# Seed the database
docker compose exec api-gateway node seed.js

# Open browser
# Frontend: http://localhost:5173
# API:      http://localhost:4000/health
```

<br />

## ☁️ Deployment (AWS EC2 Free Tier)

1. Provision **Ubuntu 24.04 LTS** EC2 instance (`t2.micro` / Free Tier eligible, 30 GB storage)
2. SSH in and install Docker:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   sudo usermod -aG docker ubuntu && newgrp docker
   ```
3. Clone and deploy:
   ```bash
   git clone https://github.com/Ashutosh-kumar-06/QuantumEdge.git
   cd QuantumEdge
   docker compose up -d --build
   docker compose exec api-gateway node seed.js
   ```
4. Get a **free DNS** at [duckdns.org](https://www.duckdns.org) → point to your EC2 IP
5. Set up **Nginx + Let's Encrypt** for free HTTPS

> See [deployment_guide.md](./docs/deployment_guide.md) for the full step-by-step guide.

<br />

## 🔑 Firebase Authentication (Optional)

QuantumEdge supports Firebase Authentication for Google, GitHub, and Email sign-ins.
To enable real authentication, update `frontend/src/firebase.ts` with your Firebase project credentials.

<br />

## 📁 Project Structure

```
QuantumEdge/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/            # Dashboard, Tutorial, Lab, Auth
│   │   ├── components/       # MiniSimulator, Bloch Sphere
│   │   └── context/          # ProgressContext (localStorage)
│   └── Dockerfile
├── api-gateway/              # Express.js REST API
│   ├── index.js              # Main server with rate limiting
│   ├── middleware/
│   │   ├── rateLimiter.js    # Redis-backed rate limiter
│   │   └── paginate.js       # Pagination helper
│   ├── models/               # Mongoose schemas
│   └── Dockerfile
├── simulation-worker/        # Python Qiskit worker
│   ├── worker.py             # RabbitMQ consumer
│   ├── sandbox_runner.py     # Sandboxed code execution
│   └── Dockerfile
├── cpp-worker/               # C++ QuEST worker
│   ├── worker.py
│   └── Dockerfile
├── docker-compose.yml        # Full stack orchestration
└── README.md
```

<br />

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

<br />

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Ashutosh-kumar-06">Ashutosh Kumar</a></p>
  <p>
    <img alt="Stars" src="https://img.shields.io/github/stars/Ashutosh-kumar-06/QuantumEdge?style=social" />
    <img alt="Forks" src="https://img.shields.io/github/forks/Ashutosh-kumar-06/QuantumEdge?style=social" />
  </p>
</div>
