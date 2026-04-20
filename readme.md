# 🚀 SevaSync – AI-Powered Volunteer Matching Platform

> ⚡ A collaborative full-stack platform that intelligently connects NGOs with the most suitable volunteers using AI, geolocation, and performance analytics.

---

## 📌 Overview

SevaSync is designed to solve the inefficiency in NGO–volunteer coordination by introducing a **data-driven matching system**.
It ensures that the **right volunteer reaches the right task at the right time**.

---

## 🔥 Key Features

* 🤖 AI-assisted volunteer ranking (Google Gemini + fallback system)
* 📍 Location-based filtering using Haversine distance
* ⚡ Real-time task assignment and response system
* 🧠 Multi-factor scoring (skills, urgency, distance, performance)
* 📊 Volunteer performance tracking & scoring
* 🗺️ Smart location processing (reverse geocoding)
* 🔐 Secure authentication system

---

## 🛠️ Tech Stack

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Backend  | Django, Django REST Framework |
| Frontend | React (Vite), Axios           |
| Database | PostgreSQL (Neon)             |
| AI       | Google Gemini API             |
| Location | Geopy (OpenStreetMap)         |

---

## 🧠 Matching Algorithm (Core Innovation)

SevaSync uses a **hybrid scoring + AI refinement system**.

---

### 🔹 Step 1: Candidate Filtering

* Only **available volunteers** are considered
* Volunteers already working on tasks are excluded
* Distance filter applied:

  * Max radius = **10 km**

---

### 🔹 Step 2: Base Score Calculation

Each volunteer is scored out of **100 points**:

| Factor         | Logic                            | Score |
| -------------- | -------------------------------- | ----- |
| 🧠 Skill Match | Exact match → 40, Partial → 20   | 40    |
| ⚡ Urgency      | High → 20, Medium → 10           | 20    |
| 📍 Distance    | ≤2km → 20, ≤5km → 15, ≤10km → 10 | 20    |
| 📊 Performance | Based on completion rate         | 20    |

👉 **Final Score = Skill + Urgency + Distance + Performance**

---

### 🔹 Step 3: Distance Calculation

Uses **Haversine Formula**:

* Computes real-world distance between task and volunteer
* Ensures geographically relevant matching

---

### 🔹 Step 4: AI-Based Refinement (Google Gemini)

Top candidates are sent to **Google Gemini API** for intelligent ranking.

AI considers:

* Contextual skill relevance
* Task urgency importance
* Real-world suitability

---

### 🔹 Step 5: Fallback Mechanism (Critical)

If Gemini fails (quota/network):

* ❌ No crash
* ⚡ Instant fallback to base scoring
* ✅ System remains fully functional

---

## ⚡ Why SevaSync is Different

| Feature              | Traditional Systems | SevaSync                  |
| -------------------- | ------------------- | ------------------------- |
| Matching             | Manual / random     | AI + algorithmic          |
| Location awareness   | Basic               | Real distance (Haversine) |
| AI integration       | ❌ None              | ✅ Google Gemini           |
| Reliability          | Breaks on failure   | Fallback system           |
| Performance tracking | ❌ No                | ✅ Yes                     |
| Smart ranking        | ❌ No                | ✅ Multi-factor scoring    |

---

## 🌐 Use of Google Technologies

SevaSync integrates modern Google-powered capabilities:

| Technology                      | Usage                         |
| ------------------------------- | ----------------------------- |
| Google Gemini API               | AI-based volunteer ranking    |
| Google Cloud-ready architecture | Easily deployable             |
| AI-driven prompt engineering    | Context-aware decision making |

👉 This makes the system:

* Smarter
* Scalable
* Industry-relevant

---

## 📂 Project Structure

```id="pro1"
sevasync/
│
├── backend/
│   ├── apps/
│   │   ├── ai/         # AI services (Gemini, clustering)
│   │   ├── matching/   # Core matching algorithm
│   │   ├── tasks/      # Task & assignment system
│   │   ├── volunteers/ # Volunteer management
│   │   └── users/      # Authentication
│
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
```

---

## ⚙️ Setup Instructions

### 🔹 Backend

```bash id="pro2"
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 🔹 Environment Variables

```env id="pro3"
DATABASE_URL=your_neon_database_url
AI_API_KEY=your_gemini_api_key
USE_GEMINI=true
```

### 🔹 Run Backend

```bash id="pro4"
python manage.py migrate
python manage.py runserver
```

### 🔹 Frontend

```bash id="pro5"
cd frontend
npm install
npm run dev
```

---

## 📡 Core API Endpoints

| Method | Endpoint                  | Description      |
| ------ | ------------------------- | ---------------- |
| POST   | /api/task/create/         | Create task      |
| POST   | /api/task/assign/         | Assign volunteer |
| POST   | /api/task/respond/        | Accept/Reject    |
| POST   | /api/task/update-status/  | Complete task    |
| GET    | /api/volunteer/getUpdate/ | Updates          |

---

## 🤝 Team

* **Badal Sahoo**
  Backend, AI Matching System, APIs, Database

* **Smiti Shikha Panda**
  Frontend (React UI/UX)

---

## 🚀 Future Enhancements

* 🔔 Real-time notifications (WebSockets)
* 🧠 ML-based ranking (no external API)
* 📍 Live volunteer tracking
* 📱 Mobile app version

---

## 👨‍💻 Author

Badal Sahoo
CSE @ NIT Rourkela

---


