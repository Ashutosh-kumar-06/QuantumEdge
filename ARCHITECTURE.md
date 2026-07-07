# QuantumEdge — Complete Project Architecture & Flow Guide

> **Purpose:** This document explains how the entire QuantumEdge project works, how every component connects together, and what each file does. Written for absolute beginners.

---

## Table of Contents
1. [What is QuantumEdge?](#what-is-quantumedge)
2. [High-Level Architecture](#high-level-architecture)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Technology Stack](#technology-stack)
5. [Project Folder Structure](#project-folder-structure)
6. [Component-by-Component Breakdown](#component-by-component-breakdown)
   - [Frontend (React)](#1-frontend-react)
   - [API Gateway (Node.js/Express)](#2-api-gateway-nodejsexpress)
   - [Simulation Worker (Python/Qiskit)](#3-simulation-worker-pythonqiskit)
   - [C++ Worker (QuEST)](#4-c-worker-quest)
   - [Infrastructure Services](#5-infrastructure-services)
7. [How a User Request Flows Through the System](#how-a-user-request-flows-through-the-system)
8. [How the Curriculum is Loaded](#how-the-curriculum-is-loaded)
9. [How Simulators Work Inside Tutorials](#how-simulators-work-inside-tutorials)
10. [Docker: How Everything Runs Together](#docker-how-everything-runs-together)
11. [File-by-File Reference](#file-by-file-reference)

---

## What is QuantumEdge?

QuantumEdge is a **full-stack web application** designed to teach quantum computing to software developers. Think of it like an interactive online course platform (similar to IBM Quantum Learning) where users can:

- 📖 **Read** rich tutorials with mathematical equations and interactive simulators
- 💻 **Write** quantum code in a built-in code editor (supporting Python/Qiskit and C++/QuEST)
- ▶️ **Run** their code on real quantum simulators running on the server
- 🤖 **Get AI feedback** on their code from Google's Gemini AI

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER'S WEB BROWSER                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              FRONTEND (React + Vite)                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │   │
│  │  │ Dashboard  │  │ Tutorial   │  │ Lab (Code Editor +     │ │   │
│  │  │ (Module    │  │ (Markdown  │  │  Monaco Editor +       │ │   │
│  │  │  Cards)    │  │  + Sims)   │  │  Terminal Output)      │ │   │
│  │  └────────────┘  └────────────┘  └────────────────────────┘ │   │
│  └─────────────────────────┬────────────────────────────────────┘   │
│                            │ HTTP Requests (fetch)                  │
└────────────────────────────┼───────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Node.js + Express)                 │
│                          Port 4000                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│  │GET /curriculum│ │POST /simulate│ │POST /review  │ │GET /job/:id││
│  │(Read courses) │ │(Submit code) │ │(AI feedback) │ │(Poll result││
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────┬───────┘│
│         │                │                │               │         │
│     ┌───▼───┐       ┌────▼───┐       ┌────▼───┐     ┌────▼───┐    │
│     │MongoDB│       │RabbitMQ│       │Gemini  │     │MongoDB │    │
│     │(Read) │       │(Queue) │       │ API    │     │(Read)  │    │
│     └───────┘       └────┬───┘       └────────┘     └────────┘    │
└──────────────────────────┼────────────────────────────────────────┘
                           │ Message Queue
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐
│  SIMULATION WORKER   │  │    C++ WORKER         │
│  (Python + Qiskit)   │  │  (Python + QuEST)     │
│                      │  │                       │
│  Reads from:         │  │  Reads from:          │
│  'quantum_jobs' queue│  │  'cpp_jobs' queue     │
│                      │  │                       │
│  Spawns a sandboxed  │  │  Spawns a sandboxed   │
│  Docker container    │  │  Docker container     │
│  to execute code     │  │  to compile & run C++ │
│                      │  │                       │
│  Writes result to:   │  │  Writes result to:    │
│  'job_results' queue │  │  'job_results' queue  │
└──────────────────────┘  └──────────────────────┘
```

---

## Data Flow Diagram

Here's exactly what happens when a student uses the platform:

```
                    ┌─────────────┐
                    │   Student   │
                    │  Opens App  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Dashboard  │  ← Fetches GET /api/curriculum
                    │  Loads      │  ← Fetches GET /api/progress/student1
                    └──────┬──────┘
                           │ Clicks a module card
                    ┌──────▼──────┐
                    │  Tutorial   │  ← Fetches GET /api/curriculum
                    │  Page       │  ← Finds the matching module by ID
                    │  Renders    │  ← Renders Markdown → HTML
                    │  markdown   │  ← Detects ```simulator blocks
                    │  + sims     │  ← Renders <MiniSimulator> components
                    └──────┬──────┘
                           │ Clicks "Start Coding Challenge →"
                    ┌──────▼──────┐
                    │    Lab      │  ← Loads Monaco code editor
                    │    Page     │  ← Pre-fills with starterCode
                    └──────┬──────┘
                           │ Clicks "Run Simulation"
                    ┌──────▼──────┐
                    │  POST       │  → API Gateway receives code
                    │  /simulate  │  → Creates a Job in MongoDB
                    │             │  → Pushes message to RabbitMQ
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Worker     │  ← Picks up job from queue
                    │  (Python    │  ← Spawns sandboxed Docker container
                    │   or C++)   │  ← Executes user code safely
                    │             │  → Pushes result to 'job_results' queue
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  API GW     │  ← Consumes from 'job_results'
                    │  Updates    │  ← Updates Job status in MongoDB
                    │  MongoDB    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Frontend   │  ← Polls GET /api/job/:jobId
                    │  Shows      │  ← Displays circuit diagram + counts
                    │  Results    │
                    └─────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | User interface (SPA) |
| **Bundler** | Vite 8 | Fast dev server & production builds |
| **Code Editor** | Monaco Editor | VS Code-like editor in the browser |
| **Markdown** | react-markdown + KaTeX | Renders tutorials with math equations |
| **Routing** | React Router v7 | Page navigation (Dashboard → Tutorial → Lab) |
| **API Server** | Node.js + Express | REST API endpoints |
| **Database** | MongoDB (Mongoose) | Stores courses, user progress, and jobs |
| **Message Queue** | RabbitMQ | Async job processing between API and workers |
| **Cache** | Redis | Session caching (available for future use) |
| **Python Simulator** | Qiskit + AerSimulator | Runs quantum circuits written in Python |
| **C++ Simulator** | QuEST | Runs quantum circuits written in C++ |
| **AI Review** | Google Gemini API | Provides AI-powered code feedback |
| **Containerization** | Docker + Docker Compose | Runs all services together |

---

## Project Folder Structure

```
quantumEdge/
├── frontend/                    # 🎨 FRONTEND — React web app
│   ├── src/
│   │   ├── main.tsx             # Entry point — mounts React to the DOM
│   │   ├── App.tsx              # Root component — defines routes & navigation
│   │   ├── types.ts             # TypeScript type definitions (Module, Progress)
│   │   ├── index.css            # Global styles (colors, fonts, layout)
│   │   ├── App.css              # Page-specific styles (dashboard, tutorial, lab)
│   │   ├── simulator.css        # Styles for Bloch Sphere & Circuit simulators
│   │   ├── components/
│   │   │   └── MiniSimulator.tsx # Interactive Bloch Sphere + Circuit Demo
│   │   └── pages/
│   │       ├── Dashboard.tsx    # Module card grid + progress bar
│   │       ├── Tutorial.tsx     # Markdown renderer + embedded simulators
│   │       └── Lab.tsx          # Code editor + terminal + circuit visualizer
│   ├── package.json             # Frontend dependencies
│   └── Dockerfile               # Docker config for frontend
│
├── api-gateway/                 # 🖥️ API GATEWAY — Backend server
│   ├── index.js                 # Express server with all API routes
│   ├── seed.js                  # Script to populate MongoDB with curriculum
│   ├── models/
│   │   ├── Course.js            # MongoDB schema for course + modules
│   │   ├── Job.js               # MongoDB schema for simulation jobs
│   │   └── User.js              # MongoDB schema for user progress
│   ├── content/
│   │   ├── quantum-fundamentals.md     # Module 1 tutorial content
│   │   ├── programming-foundations.md  # Module 2 tutorial content
│   │   ├── intro-to-qiskit.md          # Module 3 tutorial content
│   │   ├── quantum-gates.md            # Module 4 tutorial content
│   │   ├── circuit-visualization.md    # Module 5 tutorial content
│   │   ├── parameterized-circuits.md   # Module 6 tutorial content
│   │   ├── grovers-algorithm.md        # Module 7 tutorial content
│   │   ├── shors-algorithm.md          # Module 8 tutorial content
│   │   ├── vqe.md                      # Module 9 tutorial content
│   │   └── capstone.md                 # Module 10 tutorial content
│   ├── package.json             # Backend dependencies
│   └── Dockerfile               # Docker config for API
│
├── simulation-worker/           # ⚛️ PYTHON WORKER — Qiskit simulator
│   ├── worker.py                # Listens to RabbitMQ, runs Python code
│   ├── sandbox_runner.py        # Executes code in an isolated environment
│   ├── requirements.txt         # Python dependencies (qiskit, pika)
│   └── Dockerfile               # Docker config for Python worker
│
├── cpp-worker/                  # ⚡ C++ WORKER — QuEST simulator
│   ├── worker.py                # Listens to RabbitMQ, compiles & runs C++ code
│   ├── requirements.txt         # Python dependencies (pika)
│   └── Dockerfile               # Docker config with QuEST C++ library
│
├── docker-compose.yml           # 🐳 Orchestrates ALL services together
└── README.md                    # Project documentation
```

---

## Component-by-Component Breakdown

### 1. Frontend (React)

The frontend is a **Single Page Application (SPA)** built with React. It has 3 pages:

#### `main.tsx` — The Starting Point
```
What it does: This is the FIRST file that runs when the app starts.
It finds the <div id="root"> element in index.html and mounts the
entire React application inside it. It also wraps the app in:
  - <StrictMode> → catches bugs during development
  - <BrowserRouter> → enables URL-based page navigation
```

#### `App.tsx` — The Router
```
What it does: Defines the navigation structure.
  - "/" → shows the Dashboard page
  - "/tutorial/:id" → shows a specific Tutorial page
  - "/lab/:id" → shows the Lab (coding) page
It also renders the header bar with "QuantumEdge PRO" branding
and navigation links.
```

#### `Dashboard.tsx` — The Home Page
```
What it does: When the app loads, this page:
  1. Fetches ALL modules from the API (GET /api/curriculum)
  2. Fetches the student's progress (GET /api/progress/student1)
  3. Renders a card for each module showing title + description
  4. Shows a progress bar (X / Y Modules Completed)
  5. When a card is clicked, navigates to /tutorial/<module-id>
```

#### `Tutorial.tsx` — The Learning Page
```
What it does: Renders the full tutorial content for a module.
  1. Fetches the curriculum and finds the module matching the URL :id
  2. Renders the Markdown content using react-markdown
  3. Enables math equations via KaTeX (LaTeX rendering)
  4. Detects ```simulator code blocks in the markdown
  5. Replaces them with <MiniSimulator> React components
  6. Shows a "Start Coding Challenge →" button at the bottom
```

#### `Lab.tsx` — The Coding Lab
```
What it does: The interactive coding environment.
  1. Loads a Monaco Editor (same editor as VS Code) with starter code
  2. User can switch between Python (Qiskit) and C++ (QuEST)
  3. "Run Simulation" button → sends code to POST /api/simulate
  4. Polls GET /api/job/:jobId every second to check if complete
  5. Displays results: circuit diagram + measurement counts
  6. "AI Code Review" button → sends code to POST /api/review
  7. Displays Gemini AI feedback in the terminal panel
```

#### `MiniSimulator.tsx` — Interactive Visualizations
```
What it does: Renders two types of interactive simulators:

  1. BLOCH SPHERE SIMULATOR:
     - Displays a 3D sphere representing a qubit's state
     - Stores the qubit state as a [x, y, z] vector
     - Has clickable buttons: X, Y, Z, H, S gates
     - When clicked, applies the gate's rotation matrix
     - The arrow smoothly animates to the new position

  2. CIRCUIT DEMO SIMULATOR:
     - Displays quantum gates on a wire
     - Has Play/Pause/Reset controls
     - Clicking "Play" animates a pulse moving through the gates
     - You can also click individual gates to step through
```

---

### 2. API Gateway (Node.js/Express)

The API Gateway is the **brain** of the backend. It handles all HTTP requests from the frontend and coordinates with other services.

#### `index.js` — The Server
```
Endpoints:
  GET  /api/curriculum        → Returns all 10 modules from MongoDB
  GET  /api/progress/:username → Returns a user's completed modules
  POST /api/simulate          → Accepts code, creates a Job, pushes to RabbitMQ
  GET  /api/job/:jobId        → Returns the status/result of a simulation job
  POST /api/review            → Sends code to Gemini AI for feedback
  GET  /health                → Health check endpoint

Background:
  - Listens to 'job_results' queue on RabbitMQ
  - When a worker completes a job, updates the Job status in MongoDB
```

#### `models/Course.js` — Course Schema
```
Defines what a "Course" looks like in MongoDB:
  - courseId: unique identifier (e.g., "quantum-dev-101")
  - title: display name
  - modules[]: array of Module objects, each containing:
    - id, title, description, prerequisites, estHours
    - content: the full Markdown tutorial text
    - starterCode: pre-filled code for the Lab
```

#### `models/Job.js` — Job Schema
```
Tracks every simulation request:
  - jobId: unique random ID
  - language: "python" or "cpp"
  - code: the user's submitted code
  - status: "queued" → "processing" → "completed" or "failed"
  - result: the output (counts, diagram, or error)
  - createdAt: timestamp
```

#### `models/User.js` — User Schema
```
Tracks student progress:
  - username: unique identifier
  - progress[]: array of { moduleId, completed, score }
```

#### `seed.js` — Database Seeder
```
What it does: Populates MongoDB with the initial curriculum.
  1. Defines 10 modules with inline content, starter code, etc.
  2. Checks if Markdown files exist in /content/ directory
  3. If they do, reads them and overwrites the inline content
  4. Saves everything as a single Course document in MongoDB
  5. Creates a test user "student1" with some modules completed
```

---

### 3. Simulation Worker (Python/Qiskit)

#### `worker.py` — The Queue Consumer
```
What it does: Runs forever, waiting for Python code to execute.
  1. Connects to RabbitMQ (retries every 5 seconds if not ready)
  2. Listens to the 'quantum_jobs' queue
  3. When a message arrives:
     a. Reads the job ID and user code
     b. Spawns a Docker container with NO NETWORK ACCESS
     c. Passes the code to sandbox_runner.py via stdin
     d. Collects the output (counts + circuit diagram)
     e. Sends the result back to 'job_results' queue
```

#### `sandbox_runner.py` — The Sandbox
```
What it does: Runs inside an ISOLATED Docker container.
  1. Reads Python code from stdin
  2. Executes it using Python's exec() function
  3. Expects the code to create a variable 'qc' (QuantumCircuit)
  4. Compiles the circuit using Qiskit's transpiler
  5. Runs it on AerSimulator (a classical simulator)
  6. Returns JSON: { status, counts, diagram }
  
SECURITY: This runs with --network=none and --memory=256m,
so malicious code cannot access the internet or crash the server.
```

---

### 4. C++ Worker (QuEST)

#### `worker.py` — The C++ Queue Consumer
```
What it does: Same pattern as the Python worker, but for C++ code.
  1. Listens to 'cpp_jobs' queue
  2. Spawns an isolated Docker container
  3. Inside the container:
     a. Writes user code to user_code.cpp
     b. Compiles with g++ linking the QuEST library
     c. Runs the compiled binary
  4. Returns the output via 'job_results' queue
```

---

### 5. Infrastructure Services

#### MongoDB
```
Purpose: Persistent data storage.
Stores: Courses (curriculum), Users (progress), Jobs (simulation results)
Port: 27017
```

#### RabbitMQ
```
Purpose: Message queue for async processing.
Queues:
  - 'quantum_jobs': Python simulation requests
  - 'cpp_jobs': C++ simulation requests  
  - 'job_results': Completed job results (consumed by API Gateway)
Ports: 5672 (AMQP), 15672 (Management UI)
```

#### Redis
```
Purpose: In-memory cache (available for future features like sessions).
Port: 6379
```

---

## How a User Request Flows Through the System

### Flow 1: Reading a Tutorial

```
Student clicks "Quantum Gates" on Dashboard
         │
         ▼
Frontend navigates to /tutorial/quantum-gates
         │
         ▼
Tutorial.tsx sends GET /api/curriculum to API Gateway
         │
         ▼
API Gateway queries MongoDB for Course "quantum-dev-101"
         │
         ▼
MongoDB returns the Course document with all 10 modules
         │
         ▼
Tutorial.tsx finds the module where id === "quantum-gates"
         │
         ▼
react-markdown renders the module.content (Markdown → HTML)
         │
         ▼
When it encounters a ```simulator code block, it renders
a <MiniSimulator> component instead of a <code> block
         │
         ▼
Student sees the tutorial with interactive Bloch spheres!
```

### Flow 2: Running Code in the Lab

```
Student writes Qiskit code in Monaco Editor
         │
         ▼
Clicks "Run Simulation"
         │
         ▼
Lab.tsx sends POST /api/simulate { code, language: "python" }
         │
         ▼
API Gateway creates a Job in MongoDB (status: "queued")
         │
         ▼
API Gateway pushes { jobId, code } to RabbitMQ 'quantum_jobs' queue
         │
         ▼
API Gateway returns { jobId, status: "queued" } to frontend
         │
         ▼
Frontend starts polling GET /api/job/:jobId every 1 second
         │
         ▼
Simulation Worker picks up the job from 'quantum_jobs'
         │
         ▼
Worker spawns an isolated Docker container (no network, 256MB RAM)
         │
         ▼
Container runs the code, Qiskit simulates the quantum circuit
         │
         ▼
Container returns { counts: {"00": 500, "11": 524}, diagram: "..." }
         │
         ▼
Worker pushes result to 'job_results' queue
         │
         ▼
API Gateway consumes from 'job_results', updates Job in MongoDB
(status: "completed", result: {...})
         │
         ▼
Frontend's next poll of GET /api/job/:jobId sees status "completed"
         │
         ▼
Lab.tsx displays the circuit diagram and measurement histogram!
```

### Flow 3: Getting AI Code Review

```
Student clicks "✨ AI Code Review"
         │
         ▼
Lab.tsx sends POST /api/review { code }
         │
         ▼
API Gateway sends the code to Google Gemini API with a prompt:
"Analyze this Qiskit code. Provide feedback on gate optimization..."
         │
         ▼
Gemini returns a text response with suggestions
         │
         ▼
API Gateway returns { feedback: "..." } to frontend
         │
         ▼
Lab.tsx displays the AI feedback in the terminal panel
```

---

## How the Curriculum is Loaded

```
Step 1: Developer runs "node seed.js"
         │
         ▼
Step 2: seed.js connects to MongoDB
         │
         ▼
Step 3: seed.js defines 10 modules with inline content
         │
         ▼
Step 4: For each module, it checks if a .md file exists
        in api-gateway/content/ (e.g., quantum-gates.md)
         │
         ▼
Step 5: If the file exists, it REPLACES the inline content
        with the file's contents (which are much longer & richer)
         │
         ▼
Step 6: Saves everything as ONE Course document in MongoDB
         │
         ▼
Step 7: Creates a test user "student1" with initial progress
         │
         ▼
Done! The curriculum is now accessible via GET /api/curriculum
```

---

## How Simulators Work Inside Tutorials

The Markdown files contain special code blocks like this:

````markdown
Here is a Hadamard gate that creates superposition:

```simulator
type: bloch-sphere
state: +
```

This shows the qubit pointing along the X-axis.
````

When the `Tutorial.tsx` page renders this Markdown:

1. `react-markdown` encounters the code block
2. It checks: is the language `simulator`?
3. If yes, instead of rendering `<code>`, it renders `<MiniSimulator config="type: bloch-sphere\nstate: +" />`
4. `MiniSimulator.tsx` parses the config string into key-value pairs
5. It reads `type: bloch-sphere` → renders the `BlochSphereSimulator`
6. It reads `state: +` → initializes the vector pointing along X-axis
7. The student sees an interactive 3D sphere with clickable gate buttons!

---

## Docker: How Everything Runs Together

`docker-compose.yml` defines 7 services that start simultaneously:

```
Service          │ Image/Build          │ Port  │ Purpose
─────────────────┼──────────────────────┼───────┼──────────────────────────
rabbitmq         │ rabbitmq:3-management│ 5672  │ Message queue
redis            │ redis:alpine         │ 6379  │ Cache
mongodb          │ mongo:latest         │ 27017 │ Database
api-gateway      │ ./api-gateway        │ 4000  │ REST API server
simulation-worker│ ./simulation-worker  │ (none)│ Python code executor
cpp-worker       │ ./cpp-worker         │ (none)│ C++ code executor
frontend         │ ./frontend           │ 5173  │ React web app
```

### Startup Order:
1. **mongodb**, **redis**, **rabbitmq** start first (infrastructure)
2. **api-gateway** starts after mongo, redis, rabbitmq are ready
3. **simulation-worker** and **cpp-worker** start after rabbitmq
4. **frontend** starts independently

### Network:
All services share a Docker bridge network called `quantum_network`, allowing them to communicate using service names as hostnames (e.g., `mongodb:27017`).

### Security (Docker-out-of-Docker):
The workers mount `/var/run/docker.sock` to spawn ISOLATED child containers for code execution. These child containers have:
- `--network none` → No internet access
- `--memory 256m` → Limited RAM
- `--cpus 0.5` → Limited CPU
- `--rm` → Auto-deleted after execution

---

## File-by-File Reference

| File | Language | What It Does |
|------|----------|--------------|
| `frontend/src/main.tsx` | TypeScript | Mounts React app to DOM |
| `frontend/src/App.tsx` | TypeScript | Defines routes & navigation header |
| `frontend/src/types.ts` | TypeScript | Defines Module & Progress interfaces |
| `frontend/src/pages/Dashboard.tsx` | TypeScript | Module grid + progress tracking |
| `frontend/src/pages/Tutorial.tsx` | TypeScript | Markdown renderer + simulator embedding |
| `frontend/src/pages/Lab.tsx` | TypeScript | Code editor + simulation runner |
| `frontend/src/components/MiniSimulator.tsx` | TypeScript | Bloch sphere + circuit visualizer |
| `frontend/src/index.css` | CSS | Global design tokens & layout |
| `frontend/src/App.css` | CSS | Dashboard/tutorial/lab page styles |
| `frontend/src/simulator.css` | CSS | 3D sphere & circuit wire styles |
| `api-gateway/index.js` | JavaScript | Express server with all API routes |
| `api-gateway/seed.js` | JavaScript | Populates MongoDB with curriculum |
| `api-gateway/models/Course.js` | JavaScript | Mongoose schema for courses |
| `api-gateway/models/Job.js` | JavaScript | Mongoose schema for simulation jobs |
| `api-gateway/models/User.js` | JavaScript | Mongoose schema for user progress |
| `simulation-worker/worker.py` | Python | Consumes quantum_jobs, runs Qiskit |
| `simulation-worker/sandbox_runner.py` | Python | Isolated code execution environment |
| `cpp-worker/worker.py` | Python | Consumes cpp_jobs, compiles & runs C++ |
| `docker-compose.yml` | YAML | Orchestrates all 7 services |

---

> **💡 Tip:** Every single line of code in these files has been commented with beginner-friendly explanations. Open any file to see exactly what each line does!
