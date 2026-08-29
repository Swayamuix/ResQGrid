# ResQGrid: Technical Architecture & Debugging Reference (`AGENTS.md`)

This document serves as the single source of truth for ResQGrid's system architecture, component hierarchy, database schema, active API specifications, and critical design invariants.

---

## 1. System Architecture & Component Hierarchy

```
resqgrid-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML wrapper, metadata & dark background
│   │   ├── page.tsx                # Master split-pane Operations Dashboard layout
│   │   ├── globals.css             # Tailwind base + Leaflet dark filters + flat SaaS styles
│   │   └── api/
│   │       ├── data/bootstrap/     # GET: Initial database snapshot
│   │       ├── sos/submit/         # POST: Citizen SOS ingestion -> 3-Agent pipeline -> DB
│   │       ├── sos/simulate/       # POST: Automated flood SOS demo trigger -> Agent pipeline
│   │       ├── routing/calculate/  # POST: B2B Fleet hazard-aware route clearance & loss calculation
│   │       └── agents/stream/      # GET: Server-Sent Events (SSE) live telemetry stream
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Flat SaaS Operations top bar: live telemetry, clock, simulation action
│   │   │   └── MobileBottomNav.tsx # Fixed mobile bottom navigation bar (Map, Incidents, Agents, Fleet, Intake)
│   │   ├── map/
│   │   │   ├── HazardMap.tsx       # Leaflet instance: flat CartoDB tiles, sharp markers, safe/blocked polylines
│   │   │   └── MapControls.tsx     # Clean flat layer filter pills (Hazards, Incidents, Depots, Routes)
│   │   ├── sidebar/
│   │   │   ├── OperationsSidebar.tsx# Fixed split-pane right sidebar (~400px) with segmented tabs
│   │   │   ├── IncidentsTab.tsx    # High-density tabular incidents list & inspection panel
│   │   │   ├── AgentAuditLogTab.tsx# Tabular execution feed of Scout, Logistics, Comms with JSON inspector
│   │   │   ├── FleetRoutingTab.tsx # B2B vehicle clearance calculator, hydro-lock scorecard & loss prevented
│   │   │   ├── SosIntakeTab.tsx    # Clean distress intake form + simulation action
│   │   │   └── LogDetailModal.tsx  # Flat modal for inspecting structured agent payloads
│   │   ├── fleet/
│   │   │   └── ApiSnippetModal.tsx # Enterprise developer code snippets (curl, Python, TypeScript)
│   │   └── sos/
│   │       └── LiveSimulationToast.tsx # Flat, subtle toast notifications
│   ├── context/
│   │   └── ResQContext.tsx         # Global state provider, API fetchers, SSE event listener & audio
│   ├── db/
│   │   ├── schema.ts               # Drizzle ORM SQLite table definitions
│   │   └── index.ts                # better-sqlite3 connection, auto-table creation & seed bootstrap
│   ├── lib/
│   │   ├── gemini.ts               # GoogleGenAI SDK client initialization (@google/genai)
│   │   └── agents/
│   │       ├── eventStream.ts      # In-memory pub/sub event hub for SSE broadcasting
│   │       ├── scoutAgent.ts       # Gemini 2.5 Flash structured entity extraction & SAR verification
│   │       ├── logisticsAgent.ts   # Flood polygon collision, elevated bypass routing & rescue dispatch
│   │       ├── commsAgent.ts       # Gemini 2.5 Flash multilingual vernacular generator (EN, HI, TA, BN)
│   │       └── orchestrator.ts     # Master pipeline coordinator committing to SQLite
│   ├── types/
│   │   └── resq.ts                 # Shared TypeScript interfaces & types
│   └── utils/
│       ├── audio.ts                # Web Audio API tactical sound synthesizer (beeps, alarm, chimes)
│       └── formatters.ts           # INR currency, coordinates & depth color helpers
├── resqgrid.db                     # Embedded SQLite database (WAL mode)
└── tailwind.config.ts              # High-density SaaS Operations theme palette
```

---

## 2. Active API Endpoints & Payloads

### `GET /api/data/bootstrap`
Returns initial state snapshot from SQLite database.

### `POST /api/sos/submit`
Ingests distress report, triggers `gemini-2.5-flash` Scout extraction -> Logistics pathfinding -> Comms multilingual translation, commits to SQLite, and broadcasts via SSE.

### `POST /api/sos/simulate`
Simulates a random flood emergency scenario across Yamuna flood basin, runs 3-agent orchestration against DB, and broadcasts updates.

### `POST /api/routing/calculate`
Calculates vehicle clearance safety against active flood polygons, computes damage prevention value, and caches route in DB.

### `GET /api/agents/stream`
Server-Sent Events (SSE) live telemetry stream.

---

## 3. Critical Invariants & Guardrails

1. **Pragmatic SaaS Operations Aesthetic**:
   - Flat, crisp 1px borders (`border-zinc-800`), dark `zinc-950` / `zinc-900` surfaces, clean typography, and zero distracting neon drop shadows or glowing animations.
   - Status indicators rendered as solid 2px/6px dots (`●`) and flat micro-badges (`P1`, `P2`, `P3`).

2. **Fixed Split-Pane Layout Architecture**:
   - Left Canvas: Unobstructed Leaflet map taking all available screen width.
   - Right Sidebar: Fixed-width Operations panel (~390px - 430px) with segmented tabs.

3. **Backend & Database Preservation**:
   - All SQLite schemas, Drizzle ORM queries, Gemini 2.5 Flash agent pipelines, and SSE streaming remain active and intact.
