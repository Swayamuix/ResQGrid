# 🛰️ ResQGrid — Autonomous Disaster Intelligence & Multi-Agent Response
ResQGrid is a real-time disaster intelligence platform powered by a hierarchical multi-agent system. It ingests simulated telemetry, evaluates dynamic flood and hazard threats, and automates vehicle-clearance resilient dispatch operations across an interactive GIS grid.
---
## 🏗️ System Architecture & Services
The platform consists of two decoupled service layers:

| Layer | Directory | Default Port | Description |
| :--- | :--- | :--- | :--- |
| **Multi-Agent Backend** | `backend/` | \http://localhost:3000\ | Agent orchestration core (Scout, Logistics, Comms), tool execution APIs, and routing models |
| **Command Frontend** | `frontend/` | \http://localhost:3001\ | Interactive Leaflet GIS dashboard, SOS triage queue, hazard layer toggles, and live telemetry |

---
## 🤖 Hierarchical Agent Core
* **Scout Agent:** Continuously processes sensor telemetry, monitors water-level thresholds, and dynamically flags blocked or high-risk grid corridors.
* **Logistics Agent:** Solves vehicle routing with physical vehicle clearance constraints (e.g., high-clearance rescue trucks vs. boats) against live flood levels.
* **Comms Agent:** Synthesizes status feeds, formats SMS/cellular emergency alerts, and updates operational dispatch logs.
---
## 🚀 Local Development Setup
### 1. Backend Service
```bash
cd backend
npm install
npm run dev
```
# Running on http://localhost:3000

### 2. Frontend Command Dashboard
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
# Running on http://localhost:3001

---
## 🛠️ Tech Stack
* **Framework:** Next.js (App Router), React, TypeScript
* **Styling & UI:** Tailwind CSS, Lucide React
* **Mapping & GIS:** Leaflet / React-Leaflet
* **Database & State:** SQLite, Server-Sent Events / REST API
