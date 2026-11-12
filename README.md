# CNG Navigator

## Overview
**CNG Navigator – Smart CNG Trip Planner** is a full‑stack web application that helps vehicle owners locate the most convenient CNG filling station on a route. It consists of:
- **Frontend** – React + TypeScript + Vite + Tailwind CSS. Uses React‑Leaflet for interactive maps, Recharts for charts, and Axios for API calls.
- **Backend** – Java 21 + Spring Boot 3. Exposes REST APIs, runs a simulation engine for queue/pressure data, and stores everything in PostgreSQL.
- **Database** – PostgreSQL container via Docker Compose.

The demo runs completely locally, with simulated station data, so no external API keys are required.

## Prerequisites
- **Node.js 20+** (includes `npm`).
- **Java 21** (JDK) and **Maven** 3.9+.
- **Docker Desktop** (for PostgreSQL container).
- **Git** (optional, for cloning the repo).

## Project Structure
```
CNG/                     # Repository root
├─ backend/              # Spring Boot project
│   ├─ src/main/java/... # Java source
│   ├─ pom.xml           # Maven build file
│   └─ Dockerfile        # Build & run backend container
├─ frontend/             # Vite + React project
│   ├─ src/              # React source
│   ├─ index.html        # Entry HTML
│   ├─ package.json      # npm dependencies
│   └─ Dockerfile        # Build & serve frontend container
├─ docker-compose.yml    # PostgreSQL service
├─ implementation_plan.md
├─ architecture.md
└─ README.md             # (this file)
```

## Setup & Run (Demo)
### 1. Start PostgreSQL
```bash
docker compose up -d postgres
```
This will start a PostgreSQL container listening on **localhost:5432** with the default credentials defined in `docker-compose.yml`.

### 2. Backend
```bash
# From the repository root
cd backend
mvn clean install          # Build the jar
mvn spring-boot:run        # Start the API on http://localhost:8080
```
The backend will:
- Create the schema (`spring.jpa.hibernate.ddl-auto=update`).
- Seed the three demo stations (see `src/main/resources/data.sql`).
- Start a scheduled task that updates queue and pressure values every 15 seconds (demo mode).

### 3. Frontend
```bash
cd ../frontend
npm install                # Install dependencies
npm run dev                # Development server on http://localhost:5173
```
The React app will automatically proxy API calls to `http://localhost:8080` (see `vite.config.ts`).

### 4. Demo Walk‑through
1. Open `http://localhost:5173`.
2. Use the **Plan Your Trip** page. The demo route is pre‑filled:
   - **Start:** Bhopal Railway Station
   - **End:** AIIMS Bhopal
3. Click **FIND CNG STATIONS**.
4. The map shows the route, three simulated stations, and a recommendation panel.
5. Open a station’s **VIEW DETAILS** page, start the **Live Queue Simulation**, and observe changing queue/pressure values.

### 5. Docker (Optional) – Run Both Services in Containers
```bash
docker compose up --build
```
This builds the frontend and backend images, starts PostgreSQL, and exposes:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Configuration
- **Demo mode** is always enabled; external OSRM/Nominatim calls fall back to static mock data.
- Settings are stored in browser `localStorage` (simulation toggle, search radius, max detour, etc.) and affect API queries.
- To reset demo data, restart the backend or run the `POST /api/settings/reset` endpoint (not implemented in the skeleton).

## License & Credits
- This is a learning/demo project – feel free to modify and extend.
- Map tiles are from OpenStreetMap (© OpenStreetMap contributors).
- Icons from Lucide React (MIT License).

---
**Next steps** – Implement the backend source files (`Application.java`, entities, repositories, services, controllers) and the frontend components (Sidebar, MapPage, TripPlanner, Dashboard, etc.) following the architecture described in `architecture.md`.

For full implementation, refer to the plan in `implementation_plan.md` and start coding the skeleton files now.
