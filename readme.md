# SévaSync

**AI-assisted volunteer coordination for NGOs.** SévaSync turns raw community
reports (CSV uploads or manual entries) into geographically-clustered, severity-ranked
tasks, then matches each task to the best-fit nearby volunteers using a
location-aware scoring engine. NGOs dispatch requests; volunteers accept, post
progress, and earn points on completion.

> One idea: get the right volunteer to the right task at the right time.

---

## Table of contents

- [Live architecture](#live-architecture)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Core workflow](#core-workflow)
- [The AI / data pipeline](#the-ai--data-pipeline)
- [Matching algorithm](#matching-algorithm)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [CSV format](#csv-format)
- [API reference](#api-reference)
- [Testing](#testing)
- [Deployment (Render + Vercel + Neon)](#deployment-render--vercel--neon)

---

## Live architecture

```
            ┌──────────────────┐         HTTPS / JSON          ┌─────────────────────┐
  Browser ──│  React + Vite    │ ───────────────────────────▶ │  Django REST API     │
            │  (Vercel)        │   Bearer <Firebase ID token>  │  (Render, gunicorn)  │
            └────────┬─────────┘                                └──────────┬──────────┘
                     │ Firebase Auth (email/pwd)                           │
                     ▼                                                      ▼
            ┌──────────────────┐                                ┌─────────────────────┐
            │  Firebase        │  verify_id_token (admin SDK)   │  PostgreSQL (Neon)  │
            └──────────────────┘ ◀───────────────────────────── └─────────────────────┘
```

- **Auth:** the frontend signs users in with Firebase (email/password) and sends the
  resulting **ID token** as `Authorization: Bearer <token>`. The Django API verifies it
  with the Firebase Admin SDK and maps it to a local `User` row.
- **Near-real-time updates:** the SPA uses a lightweight **React polling hook**
  (`usePolling`) — no WebSockets/Channels — so dashboards refresh on their own.

---

## Features

**NGO**
- Dashboard with live stat cards (requests, active/urgent tasks, completed, active volunteers) and a needs **heatmap**.
- **CSV upload** of community reports → automatic task generation.
- Manual single-need creation.
- Per-task volunteer recommendations with skill / distance / performance scoring.
- Send requests to **multiple volunteers** per task; **cancel a request** or **cancel a task**.
- Mark tasks complete (awards points to assigned volunteers).

**Volunteer**
- Dashboard of requested + active tasks, profile, availability toggle, and points.
- **Accept / reject** requests; **withdraw** from an accepted task.
- Post **progress updates** on active tasks.
- Skills + map-based location (with address autocomplete) used by the matcher.
- Points awarded by task urgency.

**Platform**
- Keyword-based **need-type detection** from free text.
- **DBSCAN** geographic clustering + per-task **severity scoring**.
- OpenStreetMap / **Nominatim** geocoding with a 3-tier cache (memory → DB → API).
- Role-based access (NGO vs Volunteer) on every endpoint.

---

## Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 19, Vite, React Router, Tailwind CSS v4, Leaflet, Axios, Firebase JS SDK |
| Backend   | Django + Django REST Framework, gunicorn, WhiteNoise |
| Auth      | Firebase Authentication + Firebase Admin SDK |
| Database  | PostgreSQL (Neon in prod) via `dj-database-url` |
| AI / data | scikit-learn (DBSCAN), NumPy, geopy/Nominatim, Google GenAI (optional refiner) |
| Hosting   | Backend → Render · Frontend → Vercel · DB → Neon |

---

## Project structure

```
sevasync/
├── backend/
│   ├── apps/
│   │   ├── users/         # custom User, Firebase signup/login, permissions
│   │   ├── ngo/           # NGO dashboard, requests list, heatmap endpoint
│   │   ├── needs/         # Need model, CSV ingestion service, manual create
│   │   ├── tasks/         # Task/Assignment models, services (assign/respond/
│   │   │                  #   complete/cancel/withdraw/progress), views, urls
│   │   ├── volunteers/    # Volunteer model + profile/availability/points
│   │   ├── matching/      # location-aware volunteer scoring
│   │   ├── ai/            # extraction (need detector), clustering (DBSCAN),
│   │   │                  #   severity scorer, pipeline, heatmap generator
│   │   └── geocoding/     # cached geocode results
│   ├── config/settings/   # base.py + development.py + production.py
│   ├── infrastructure/    # firebase, gemini, geocoding (nominatim), logging
│   ├── core/constants/    # tunables: matching, severity, clustering, rewards
│   ├── audit_tests.py     # end-to-end API test suite (mocks Firebase/geocoding)
│   ├── verify_workflows.py# narrated full-journey verification
│   ├── build.sh           # Render build command
│   └── requirements*.txt
└── frontend/
    └── src/
        ├── api/           # axios client + endpoint wrappers
        ├── auth/          # Firebase web SDK
        ├── features/      # auth, ngo, tasks, volunteer (Tailwind UI)
        ├── shared/        # sidebars, layouts, usePolling hook
        └── maps/          # Leaflet heatmap
```

---

## Core workflow

1. **Sign up / log in** (Firebase) → role routes to the NGO or Volunteer dashboard.
2. **NGO uploads a CSV** of needs (name, problem, pincode, location).
3. The **pipeline** detects need types, geocodes, clusters nearby needs, scores
   severity, and creates **Tasks**.
4. NGO opens a task → sees **ranked volunteers** → sends requests (one or several).
5. **Volunteer** accepts/rejects; on accept the task becomes *assigned*.
6. Volunteer posts **progress**; NGO marks the task **complete** → volunteers earn points.
7. NGO can **cancel a request** (return the task to the pool) or **cancel the task**.

---

## The AI / data pipeline

CSV rows → `Need`s → tasks, in `apps/needs/services.py` + `apps/ai/pipeline/processor.py`:

1. **Need-type detection** (`apps/ai/extraction/need_detector.py`) — keyword match on
   the free-text problem when no explicit `need_type` column is supplied
   (e.g. "power cut" → electricity, "medical emergency" → medical).
2. **Geocoding** (`infrastructure/geocoding/nominatim.py`) — pincode/location →
   lat/lng with a 3-tier cache (in-memory → `GeocodedLocation` table → Nominatim API).
3. **Clustering** (`apps/ai/clustering/dbscan.py`) — DBSCAN over haversine distances
   groups nearby needs (radius/min-samples in `core/constants/clustering.py`).
4. **Severity** (`apps/ai/severity/scorer.py`) — each task's urgency = type criticality
   (medical > shelter/food/water > electricity > general) **+** a people-count size
   tier → `HIGH | MEDIUM | LOW`.
5. **Task creation** — one task per (need-type, cluster) with averaged coordinates and
   `source_needs` links; duplicate uploads are de-duplicated by row hash.

> An optional Gemini refiner (`infrastructure/gemini`, `apps/ai/gemini`) is scaffolded
> behind `USE_GEMINI` and off by default.

---

## Matching algorithm

`apps/matching/utils.py` scores every available volunteer for a task (single
annotated query, no N+1). Constants live in `core/constants/matching.py`.

```
score = skill_match + urgency_bonus + distance_score + performance_score
```

- **Skill** — full match (need type ∈ skills) or partial keyword match.
- **Urgency** — HIGH adds more than MEDIUM.
- **Distance** — haversine; volunteers beyond `MAX_MATCHING_DISTANCE_KM` (10 km) are
  excluded; nearer = higher score.
- **Performance** — completed/total assignment ratio (new volunteers get a neutral score
  so they aren't permanently excluded).

Volunteers who are unavailable or already on an accepted task are filtered out.

---

## Local setup

**Prerequisites:** Python 3.13, Node 18+, PostgreSQL, a Firebase project.

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

createdb sevasync                 # local Postgres database
cp .env.example .env              # then fill in values (see below)

python manage.py migrate
python manage.py runserver        # http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env              # set VITE_API_BASE_URL + Firebase web keys
npm run dev                       # http://localhost:5173
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Example / notes |
|---|---|
| `DJANGO_ENV` | `development` (default) or `production` |
| `SECRET_KEY` | Django secret |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/sevasync` (local) · Neon URL in prod |
| `DB_CONN_MAX_AGE` | optional, default `0` |
| `ALLOWED_HOSTS` | prod only, comma-separated (e.g. `sevasync-api.onrender.com`) |
| `CORS_ALLOWED_ORIGINS` | prod only (e.g. `https://sevasync.vercel.app`) |
| `FIREBASE_CREDENTIALS` | path to service-account JSON (local) **— or —** |
| `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` | the three key fields (preferred on Render; `\n` in the private key is fine) |
| `USE_GEMINI` | `false` (optional refiner) |
| `AI_API_KEY` | Google GenAI key (only if `USE_GEMINI=true`) |

### Frontend (`frontend/.env`)

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | e.g. `http://127.0.0.1:8000/api` (local) or the Render URL `/api` |
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Firebase web config |

> `.env` files and the Firebase service-account JSON are git-ignored — never commit them.

---

## CSV format

Header row required. `need_type` is optional (inferred from `problem` when absent).

```csv
name,problem,pincode,location
user_1,water shortage,769004,"Panposh, Rourkela"
user_2,medical emergency,769001,"Railway Station Area, Rourkela"
user_3,power cut,769008,"Sector 1 NIT, Rourkela"
```

---

## API reference

All routes are under `/api`. Protected routes require `Authorization: Bearer <Firebase ID token>`.

**Auth**
- `POST /auth/signup/` — `{ token, name, role }` (role: `NGO` | `VOLUNTEER`)
- `POST /auth/login/` — `{ token }` → `{ role, user_id }`

**NGO**
- `GET  /ngo/dashboard/` — counts + name
- `GET  /ngo/requests/?urgency=HIGH|MEDIUM|LOW` — task list
- `POST /ngo/upload/` — multipart `file` (CSV)
- `GET  /ngo/heatmap/` — active-task points weighted by urgency

**Needs**
- `POST /needs/` — manual need
- `POST /needs/upload/` — CSV (same as `/ngo/upload/`)

**Tasks**
- `GET  /tasks/<id>/` — detail (accepted/requested volunteers, can_assign)
- `POST /tasks/<id>/assign/` — `{ volunteer_id }`
- `POST /tasks/<id>/respond/` — `{ action: "accept" | "reject" }` (volunteer)
- `POST /tasks/<id>/complete/` — award points (NGO)
- `POST /tasks/<id>/cancel/` — cancel whole task (NGO)
- `POST /tasks/<id>/cancel-request/` — `{ volunteer_id }` retract one request (NGO)
- `GET/POST /tasks/<id>/progress/` — list / add progress (+ recommended volunteers)
- `POST /tasks/assignments/<id>/withdraw/` — volunteer withdraws

**Volunteers**
- `GET   /volunteers/dashboard/` · `GET /volunteers/profile/` · `GET /volunteers/points/`
- `PATCH /volunteers/me/` — skills/location/coords · `PATCH /volunteers/availability/`

---

## Testing

```bash
cd backend
python manage.py test audit_tests verify_workflows
```

- `audit_tests.py` — 39 end-to-end API tests (auth, roles, CSV pipeline, matching,
  assignment lifecycle, rewards, cancel, dashboard integrity). Firebase token
  verification and geocoding are mocked.
- `verify_workflows.py` — a narrated full-journey run (NGO + two volunteers).

---

## Deployment (Render + Vercel + Neon)

### Database — Neon
Create a Postgres database and copy the **pooled** connection string (it already
includes `?sslmode=require`).

### Backend — Render (Web Service, root = `backend/`)
- **Build command:** `./build.sh` (installs deps, `collectstatic`, `migrate`)
- **Start command:** `gunicorn config.wsgi` (see `Procfile`)
- **Environment:**
  - `DJANGO_ENV=production`
  - `SECRET_KEY=…`
  - `DATABASE_URL=<Neon URL>`
  - `ALLOWED_HOSTS=<your-service>.onrender.com`
  - `CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app`
  - `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
    (no JSON file needed — credentials are built from these)

### Frontend — Vercel (root = `frontend/`)
- **Build:** `npm run build` · **Output:** `dist`
- **Environment:** `VITE_API_BASE_URL=https://<your-service>.onrender.com/api` plus the
  `VITE_FIREBASE_*` web keys.

Static files for the Django admin are served by WhiteNoise (configured in
`config/settings/production.py`).
