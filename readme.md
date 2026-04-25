# SevaSync

SevaSync is a full-stack volunteer coordination platform for NGOs. It converts community reports into actionable tasks, ranks suitable volunteers using location-aware scoring and AI refinement, and tracks assignments, progress updates, completion, points, and badges.

The project is built around one core idea: help the right volunteer reach the right task at the right time.

## Table Of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Core Workflow](#core-workflow)
- [Data Model](#data-model)
- [Matching Algorithm](#matching-algorithm)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [CSV Format](#csv-format)
- [API Reference](#api-reference)
- [Development Notes](#development-notes)
- [Future Enhancements](#future-enhancements)

## Features

- Firebase-based signup and login with role-based routing.
- Separate NGO and volunteer dashboards.
- CSV upload for community needs.
- Automatic need type detection from problem text.
- Location geocoding with OpenStreetMap/Nominatim.
- DBSCAN clustering for nearby needs.
- Severity calculation with Gemini-based refinement fallback.
- Task generation from clustered needs.
- Volunteer recommendation using skill, urgency, distance, and performance.
- Assignment request, accept/reject, progress update, and completion workflow.
- Volunteer points, badges, availability, and profile management.
- NGO heatmap for mapped community needs.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios |
| Maps | Leaflet, React-Leaflet |
| Auth | Firebase Authentication |
| Backend | Django, Django REST Framework |
| Database | PostgreSQL |
| AI | Google Gemini |
| Location | Geopy, OpenStreetMap/Nominatim |
| ML/Clustering | NumPy, scikit-learn DBSCAN |
| Deployment | Gunicorn, Procfile-ready backend |

## Architecture

```mermaid
flowchart LR
    User[NGO / Volunteer] --> UI[React + Vite Frontend]
    UI --> Firebase[Firebase Auth]
    UI --> Axios[Axios API Client]
    Axios --> DRF[Django REST API]
    DRF --> Auth[Firebase Token Verification]
    DRF --> DB[(PostgreSQL)]
    DRF --> CSV[CSV Processor]
    CSV --> Geo[Nominatim Geocoding]
    CSV --> Needs[Need Records]
    Needs --> Pipeline[AI Pipeline]
    Pipeline --> Cluster[DBSCAN Clustering]
    Pipeline --> Gemini[Gemini Severity Refinement]
    Pipeline --> Tasks[Task Records]
    Tasks --> Matching[Volunteer Matching Engine]
    Matching --> GeminiRank[Optional Gemini Ranking]
    Tasks --> Updates[Task Updates + Completion]
```

High-level request flow:

```text
React UI
  -> Axios service adds Firebase Bearer token
  -> Django REST Framework verifies token
  -> request.user is mapped from Firebase email to local User
  -> app-specific views read/write PostgreSQL models
  -> AI/location/matching services run when needed
```

## Project Structure

```text
sevasync/
├── backend/
│   ├── apps/
│   │   ├── ai/             # Need model, heatmap, clustering, severity, Gemini services
│   │   ├── matching/       # Volunteer matching and scoring logic
│   │   ├── ngo/            # NGO upload, dashboard, task listing APIs
│   │   ├── tasks/          # Task, assignment, progress update APIs
│   │   ├── users/          # Local user records and auth endpoints
│   │   └── volunteers/     # Volunteer profile, dashboard, points, availability APIs
│   ├── config/             # Django settings, URL routing, ASGI/WSGI
│   ├── utils/              # Firebase auth, CSV processing, location, keyword mapping
│   ├── manage.py
│   ├── requirements.txt
│   └── Procfile
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable dashboard/task/profile/map components
│   │   ├── pages/          # Login, NGO dashboard, volunteer dashboard, task detail pages
│   │   ├── services/       # Axios API service and Firebase auth service
│   │   ├── App.jsx         # Frontend routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── readme.md
```

## Core Workflow

### 1. Authentication

```text
User signs up or logs in
  -> Firebase creates/verifies account
  -> frontend receives Firebase ID token
  -> frontend sends token to Django auth endpoint
  -> Django verifies token through Firebase Admin SDK
  -> Django creates/fetches local User
  -> user is routed by role:
       NGO -> /ngo-dashboard
       VOLUNTEER -> /volunteer-dashboard
```

### 2. NGO CSV Upload To Task Generation

```text
NGO uploads CSV
  -> POST /api/upload/
  -> CSV rows are parsed
  -> problem text is mapped to need types
  -> pincode/location is geocoded to latitude and longitude
  -> Need records are bulk-created
  -> needs are clustered with DBSCAN
  -> cluster severity is calculated
  -> Gemini can refine severity
  -> Task records are created or updated
  -> NGO sees generated tasks in dashboard
```

### 3. NGO Task Assignment

```text
NGO opens task detail
  -> backend returns task details, updates, and recommended volunteers
  -> NGO sends assignment request to a volunteer
  -> Assignment status becomes requested
  -> Task status becomes requested
```

### 4. Volunteer Response

```text
Volunteer dashboard loads requested and active tasks
  -> volunteer accepts or rejects request
  -> if accepted:
       Assignment status becomes accepted
       Task status becomes assigned
       other pending requests for that volunteer are rejected
  -> if rejected:
       Assignment status becomes rejected
```

### 5. Progress Updates And Completion

```text
Accepted volunteer opens task detail
  -> volunteer posts progress update
  -> NGO sees update on task detail page
  -> NGO marks task completed
  -> Task and Assignment become completed
  -> volunteer receives points
  -> volunteer task count and badges update
```

## Data Model

```text
User
  - name
  - email
  - role: NGO | VOLUNTEER

Volunteer
  - user: one-to-one User
  - skills
  - location
  - latitude / longitude
  - availability
  - points
  - tasks_completed

Need
  - ngo: User
  - name
  - problem
  - need_type
  - pincode
  - location_text
  - latitude / longitude

Task
  - ngo: User
  - need_type
  - location
  - location_name
  - urgency
  - total_needs
  - status: pending | requested | assigned | completed

Assignment
  - task
  - volunteer
  - status: requested | accepted | rejected | completed

TaskUpdate
  - task
  - volunteer
  - message
  - created_at
```

## Matching Algorithm

The volunteer matching engine ranks available volunteers for a task.

### Candidate Filtering

- Only available volunteers are considered.
- Volunteers with an accepted active assignment are excluded.
- Volunteers without valid latitude/longitude are skipped.
- Volunteers outside a 10 km radius are skipped.

### Base Score

| Factor | Logic | Max Score |
| --- | --- | --- |
| Skill match | exact need type match = 40, partial match = 20 | 40 |
| Urgency | high = 20, medium = 10, low = 0 | 20 |
| Distance | <= 2 km = 20, <= 5 km = 15, <= 10 km = 10 | 20 |
| Performance | completion ratio scaled to 20 | 20 |

```text
Final score = skill score + urgency score + distance score + performance score
```

If Gemini is enabled, the top candidates can be sent for AI-based score refinement. If Gemini fails or is disabled, the system falls back to the base score.

## Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL
- Firebase project with Email/Password authentication enabled
- Gemini API key, optional but recommended for AI refinement

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend runs at:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs at:

```text
http://localhost:5173
```

## Environment Variables

Create a `.env` file in `backend/`.

```env
SECRET_KEY=your_django_secret_key
DEBUG=True

DB_NAME=sevasync
DB_USER=postgres
DB_PASSWORD=your_postgres_password

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

AI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key
USE_GEMINI=true
```

Create a `.env` file in `frontend/`.

```env
VITE_API_BASE_URL=http://localhost:8000/api

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Current backend database settings use local PostgreSQL variables (`DB_NAME`, `DB_USER`, `DB_PASSWORD`). A `DATABASE_URL`/Neon configuration is present in settings but commented out; enable that block if deploying with Neon.

## CSV Format

The upload pipeline expects a CSV with these headers:

```csv
name,problem,pincode,location
```

Example:

```csv
name,problem,pincode,location
Ravi,No drinking water available in the area,769001,Rourkela
Anita,Family needs food and medical help,769004,Panposh Rourkela
```

The backend reads each row, detects one or more need types from the `problem` field, geocodes `pincode` or `location`, creates `Need` records, and generates clustered `Task` records.

## API Reference

Base URL:

```text
http://localhost:8000/api
```

Most protected endpoints require:

```http
Authorization: Bearer <firebase_id_token>
```

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/signup/` | Create local Django user after Firebase signup |
| POST | `/auth/login/` | Verify Firebase token and return local role |

### NGO

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/upload/` | Upload CSV and generate needs/tasks |
| GET | `/ngo/dashboard/` | Dashboard counts for current NGO |
| GET | `/ngo/requests/` | List current NGO tasks; supports `urgency=HIGH/MEDIUM/LOW` |
| GET | `/ngo/volunteers/` | List volunteers |
| GET | `/heatmap/` | Heatmap points for current NGO |

### Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/task/<task_id>/` | Get task detail |
| POST | `/task/assign/` | Send assignment request to volunteer |
| POST | `/task/respond/` | Volunteer accepts or rejects assignment |
| POST | `/task/update-status/` | NGO marks task completed and awards points |
| POST | `/task/update/` | Older task completion endpoint |
| POST | `/task/create/` | Manual task creation endpoint |

### Volunteer

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/volunteer/create/` | Create volunteer profile |
| GET | `/volunteer/dashboard/` | Requested and active volunteer tasks |
| GET | `/volunteer/profile/` | Current volunteer profile |
| PATCH | `/volunteer/update/` | Update volunteer skills/location |
| PATCH | `/volunteer/availability/` | Update volunteer availability |
| GET | `/volunteer/points/` | Points and badges |
| GET | `/volunteer/performance/` | Completion performance data |
| POST | `/volunteer/addUpdate/` | Add task progress update |
| GET | `/volunteer/getUpdate/?task_id=<id>` | Get task updates and recommended volunteers |

### AI

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/extract/` | Legacy raw text extraction endpoint |

## Development Notes

- `frontend/src/services/api.js` contains a `matchVolunteers()` helper that calls `/match/`, but the backend currently does not expose `/api/match/`. Current task recommendations are returned through `/volunteer/getUpdate/?task_id=<id>`.
- `backend/apps/tasks/views.py:create_task()` still references older `Task` fields (`need`, `title`) that are no longer present in the current model.
- `backend/apps/ai/views.py:extract_needs()` still references older `Need` fields (`data`, `type`, `urgency`, `location`) that are no longer present in the current model.
- The current implementation uses request/response updates. WebSocket-based real-time notifications are not implemented yet.
- Matching quality depends on volunteers having updated skills and valid geocoded latitude/longitude.

## Future Enhancements

- Add a dedicated `/api/match/` endpoint or remove the unused frontend helper.
- Clean up legacy `create_task()` and `extract_needs()` code paths.
- Add WebSocket notifications for task requests and progress updates.
- Add stronger role-based permissions for every endpoint.
- Add pagination and search for task and volunteer lists.
- Add automated tests for matching, CSV upload, and task completion rewards.
- Add production-ready deployment configuration for Neon/PostgreSQL and static frontend hosting.

## Team

- Badal Sahoo - Backend, AI matching system, APIs, database
- Smiti Shikha Panda - Frontend, React UI/UX

## Author

Badal Sahoo  
CSE @ NIT Rourkela
