# AI Student Planner — Project Plan

## Top-Level Overview

Build a full-stack web + mobile application called **AI Student Planner** that allows students to:
- Enter courses, homework assignments, due dates, and estimated study hours
- Receive AI-generated personalized study schedules
- Get reminders via browser push, email, SMS, and mobile push notifications

The system uses a React web frontend, a React Native mobile app, a Python FastAPI backend, SQLite (dev) / PostgreSQL (prod), Redis for job scheduling, and an AI provider toggle between OpenAI and Ollama.

All components are containerized with Docker Compose for local development and designed for cloud deployment later.

---

## Project Structure

```
ai-student-planner/
├── frontend/          # React + TypeScript + Vite (web)
├── mobile/            # React Native + Expo (mobile)
├── backend/           # Python FastAPI
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic (AI, notifications, scheduler)
│   │   └── core/      # Config, auth, DB setup
│   └── tests/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding

**Status:** `[ ] pending`

**Intent:**
Create the monorepo folder structure, Docker Compose setup, and shared configuration so all subsequent sub-tasks have a working foundation to build on.

**Expected Outcomes:**
- `ai-student-planner/` folder exists with `frontend/`, `mobile/`, `backend/` directories
- `docker-compose.yml` runs backend + SQLite + Redis with a single `docker compose up`
- `.env.example` documents all required environment variables
- `README.md` describes how to run the project locally

**Todo List:**
1. Create root folder `ai-student-planner/`
2. Scaffold `backend/` as a Python FastAPI project with `pyproject.toml` or `requirements.txt`
3. Scaffold `frontend/` with Vite + React + TypeScript (`npm create vite`)
4. Scaffold `mobile/` with Expo (`npx create-expo-app`)
5. Write `docker-compose.yml` with services: `backend`, `redis`; use SQLite volume mount for dev
6. Write `.env.example` with all keys: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`, `AI_PROVIDER`, `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `EXPO_PUSH_TOKEN`
7. Write root `README.md` with local setup instructions

**Relevant Context:**
- No existing codebase — greenfield project
- SQLite requires no separate Docker service for dev; swap `DATABASE_URL` for PostgreSQL in prod

---

### Sub-Task 2 — Backend: Database Models and Auth

**Status:** `[ ] pending`

**Intent:**
Define the full database schema using SQLAlchemy and implement JWT-based user authentication (register, login, token refresh). This is the foundation all other backend features depend on.

**Expected Outcomes:**
- All database tables created via Alembic migrations
- `POST /auth/register` and `POST /auth/login` endpoints work and return JWT tokens
- Protected routes reject requests without a valid token
- Passwords are hashed with bcrypt

**Todo List:**
1. Define SQLAlchemy models: `User`, `Course`, `Homework`, `Reminder`, `StudyPlan`, `StudyBlock`
2. Set up Alembic for database migrations
3. Run initial migration to create all tables
4. Implement `POST /auth/register` — validate email, hash password, create user
5. Implement `POST /auth/login` — verify credentials, return JWT access + refresh tokens
6. Implement JWT middleware — decode token, inject current user into request context
7. Write unit tests for auth endpoints

**Relevant Context:**

Data model relationships:
- `User` has many `Course`
- `Course` has many `Homework`
- `Homework` has many `Reminder`
- `User` has many `StudyPlan`
- `StudyPlan` has many `StudyBlock` (each block links to a `Homework`)

Key fields:
- `Homework`: `title`, `due_date`, `estimated_hours`, `priority`, `status` (pending/in_progress/done)
- `Reminder`: `remind_at`, `channel` (email/sms/browser_push/mobile_push), `sent` (bool)
- `StudyBlock`: `homework_id`, `start_time`, `end_time`
- `User.notification_prefs`: JSON column storing per-channel defaults (e.g. `{"email": true, "sms": false, "lead_time_hours": 24}`)

---

### Sub-Task 3 — Backend: Courses and Homework API

**Status:** `[ ] pending`

**Intent:**
Build the core CRUD API endpoints for courses and homework so students can enter and manage their workload. All endpoints are protected and scoped to the authenticated user.

**Expected Outcomes:**
- Full CRUD for courses: `GET/POST /courses`, `GET/PUT/DELETE /courses/{id}`
- Full CRUD for homework: `GET/POST /homework`, `GET/PUT/DELETE /homework/{id}`
- Homework list supports filtering by course, status, and due date range
- All responses use Pydantic schemas

**Todo List:**
1. Write Pydantic schemas for `Course` and `Homework` (create, update, response)
2. Implement course CRUD endpoints — enforce user ownership
3. Implement homework CRUD endpoints — enforce user ownership, validate `due_date` is in the future on create
4. Add query parameter filtering to `GET /homework`: `?course_id=`, `?status=`, `?due_before=`
5. Write integration tests for course and homework endpoints

**Relevant Context:**
- Use the `User` model from Sub-Task 2 for ownership enforcement
- `estimated_hours` on `Homework` is used by the AI planner in Sub-Task 5

---

### Sub-Task 4 — Backend: Reminder System

**Status:** `[ ] pending`

**Intent:**
Implement the reminder scheduling engine. When a homework item is created or updated, reminders are automatically scheduled based on the user's notification preferences. A background worker processes the queue and dispatches notifications through the correct channels.

**Expected Outcomes:**
- Reminders are created automatically when homework is saved
- `PUT /users/me/notification-prefs` allows users to set per-channel defaults and lead time
- Background scheduler (APScheduler + Redis) fires reminders at the correct time
- Email sent via SendGrid, SMS via Twilio, browser push via Web Push (VAPID), mobile push via Expo Push API
- Sent reminders are marked `sent=true` and not re-fired

**Todo List:**
1. Implement `PUT /users/me/notification-prefs` endpoint — store preferences in `User.notification_prefs`
2. Write `reminder_service.py` — given a `Homework` object and user prefs, compute `remind_at` times and create `Reminder` rows
3. Call `reminder_service` from homework create and update handlers
4. Set up APScheduler with Redis job store — poll for due reminders every 60 seconds
5. Implement `email_sender.py` — SendGrid `send_mail` wrapper
6. Implement `sms_sender.py` — Twilio `messages.create` wrapper
7. Implement `push_sender.py` — Web Push VAPID sender for browser, Expo Push API for mobile
8. Implement `notification_dispatcher.py` — routes a `Reminder` to the correct sender based on `channel`
9. Mark reminder `sent=true` after successful dispatch; log failures without crashing
10. Write tests for reminder creation logic and dispatcher routing

**Relevant Context:**
- `User.notification_prefs` JSON shape: `{"email": bool, "sms": bool, "browser_push": bool, "mobile_push": bool, "lead_time_hours": int}`
- VAPID keys are generated once and stored in `.env`
- Expo Push Token is stored per-user when the mobile app registers (added in Sub-Task 7)
- Web Push subscription object is stored per-user when the browser subscribes (added in Sub-Task 6)

---

### Sub-Task 5 — Backend: AI Study Plan Service

**Status:** `[ ] pending`

**Intent:**
Build the AI service that takes the student's pending homework (titles, due dates, estimated hours) and generates a structured weekly study schedule. Support both OpenAI and Ollama via a config toggle.

**Expected Outcomes:**
- `POST /study-plan/generate` accepts optional free time slots and returns a structured study plan
- Plan is persisted as `StudyPlan` + `StudyBlock` rows
- `GET /study-plan/latest` returns the most recent plan for the current user
- AI provider switches between OpenAI and Ollama based on `AI_PROVIDER` env var
- If AI API is unavailable, a rule-based fallback distributes hours evenly across available days

**Todo List:**
1. Write `ai_provider.py` — abstract interface with `OpenAIProvider` and `OllamaProvider` implementations; select based on `AI_PROVIDER` env var
2. Write the prompt template — sends homework list with due dates and estimated hours, requests JSON response with study blocks
3. Write `study_plan_service.py` — calls AI provider, parses JSON response, validates blocks fit within due dates
4. Implement rule-based fallback in `study_plan_service.py` — if AI fails, distribute estimated hours evenly starting from today up to each due date
5. Implement `POST /study-plan/generate` endpoint — accepts optional `free_slots` in request body, calls service, persists and returns plan
6. Implement `GET /study-plan/latest` endpoint
7. Write tests for prompt construction, response parsing, and fallback logic

**Relevant Context:**
- OpenAI: use `gpt-4o-mini` as default (cheapest capable model)
- Ollama: use `llama3` as default local model; base URL from `OLLAMA_BASE_URL` env var
- Prompt must instruct the AI to return strict JSON: `[{"homework_id": "...", "start_time": "ISO8601", "end_time": "ISO8601"}]`
- `estimated_hours` from `Homework` model (Sub-Task 3) drives the schedule

---

### Sub-Task 6 — Web Frontend

**Status:** `[ ] pending`

**Intent:**
Build the React web application with all screens needed for the student to manage their workload, view their AI-generated study plan, configure reminders, and receive browser push notifications.

**Expected Outcomes:**
- Login / Register screens with JWT auth stored in `localStorage`
- Dashboard showing upcoming homework sorted by due date
- Courses page — add, edit, delete courses with color coding
- Homework page — add, edit, delete homework with due date picker and estimated hours
- Study Plan page — shows AI-generated weekly calendar view; trigger regeneration
- Settings page — toggle per-channel notification preferences and lead time
- Browser push notification permission request and VAPID subscription sent to backend
- Responsive layout works on desktop and tablet

**Todo List:**
1. Set up React Router with routes: `/login`, `/register`, `/dashboard`, `/courses`, `/homework`, `/study-plan`, `/settings`
2. Create `AuthContext` — stores JWT, expiry, current user; wraps protected routes
3. Build Login and Register forms with validation
4. Build Dashboard — fetch and display homework due within 7 days; show today's study blocks from latest plan
5. Build Courses page — CRUD UI backed by `/courses` API
6. Build Homework page — CRUD UI backed by `/homework` API; include course selector, due date picker, priority selector
7. Build Study Plan page — fetch `/study-plan/latest`; render weekly calendar grid with study blocks; add "Generate New Plan" button
8. Build Settings page — fetch and update `/users/me/notification-prefs`
9. Implement browser push subscription — request permission, generate subscription via VAPID public key, `POST /notifications/subscribe`
10. Add global toast notification component for in-app feedback
11. Add axios interceptor to attach JWT to all requests and handle 401 refresh

**Relevant Context:**
- Use `react-query` (TanStack Query) for data fetching and cache invalidation
- Use `date-fns` for date formatting
- Use `react-big-calendar` or a simple CSS grid for the study plan weekly view
- VAPID public key loaded from `VITE_VAPID_PUBLIC_KEY` env var

---

### Sub-Task 7 — Mobile App (React Native + Expo)

**Status:** `[ ] out of scope — Phase 2 TODO`

**Intent:**
Build the React Native mobile app sharing the same API as the web frontend. Focus on the core flows and mobile push notification registration. Screens mirror the web app with mobile-appropriate navigation.

**Expected Outcomes:**
- Login / Register screens
- Dashboard with upcoming homework list
- Add / edit homework screen
- Study plan screen showing today's and tomorrow's study blocks
- Settings screen for notification preferences
- Mobile push token registered with backend on login
- Push notifications received when app is in background

**Todo List:**
1. Set up Expo Router with tab navigation: Dashboard, Homework, Study Plan, Settings
2. Create shared `api.ts` service layer — same REST calls as web, configured via `EXPO_PUBLIC_API_URL`
3. Implement auth flow — Login and Register screens, store JWT in `expo-secure-store`
4. Build Dashboard screen — upcoming homework list with due date badges
5. Build Homework screen — list with add/edit modal
6. Build Study Plan screen — today's schedule as a vertical timeline
7. Build Settings screen — notification preference toggles
8. Implement Expo push notification registration — request permission, get Expo push token, `POST /notifications/register-mobile-token`
9. Add background notification handler using `expo-notifications`

**Relevant Context:**
- Use `expo-secure-store` instead of `localStorage` for JWT storage on mobile
- Expo Push Token is per-device; store it on the `User` model in the backend (add `expo_push_token` column in migration)
- Reuse TypeScript types from `frontend/src/types/` — consider extracting to a shared `packages/types/` if duplication grows

---

### Sub-Task 8 — Docker Compose and Local Dev Setup

**Status:** `[ ] pending`

**Intent:**
Wire all services together into a single `docker-compose.yml` so the entire stack starts with one command for local development.

**Expected Outcomes:**
- `docker compose up` starts: `backend`, `redis`, `frontend` (Vite dev server)
- Hot reload works for both backend (uvicorn --reload) and frontend (Vite HMR)
- SQLite database file is persisted on a local volume
- All environment variables loaded from `.env` file
- `docker compose up` prints no errors on a clean clone after copying `.env.example` to `.env`

**Todo List:**
1. Write `backend/Dockerfile` — Python slim image, install dependencies, run `uvicorn` with `--reload`
2. Write `frontend/Dockerfile` — Node alpine image, `vite dev --host`
3. Write root `docker-compose.yml` — services: `backend` (port 8000), `redis` (port 6379), `frontend` (port 5173)
4. Mount `./backend` and `./frontend` as volumes for hot reload
5. Add SQLite data volume at `/app/data/db.sqlite`
6. Document mobile setup separately in `README.md` — Expo runs via `npx expo start`, not Docker

**Relevant Context:**
- Mobile (Expo) is not Dockerized — it runs via `npx expo start` on the developer's machine
- Redis uses the official `redis:7-alpine` image, no custom config needed
- PostgreSQL is not in Docker Compose for dev — only needed for cloud deploy (documented in README)

---

## Technology Summary

| Layer | Choice | Cost |
|---|---|---|
| Web frontend | React + TypeScript + Vite | Free |
| Mobile | React Native + Expo | Free |
| Backend | Python FastAPI + Uvicorn | Free |
| Database (dev) | SQLite | Free |
| Database (prod) | PostgreSQL | Free / cloud tier |
| Job scheduler | APScheduler + Redis | Free |
| Auth | JWT + bcrypt | Free |
| Email | SendGrid (100/day free) | Free tier |
| SMS | Twilio (free trial credits) | Free trial |
| Browser push | Web Push API (VAPID) | Free |
| Mobile push | Expo Push Notifications | Free |
| AI (cloud) | OpenAI gpt-4o-mini | Pay per use |
| AI (local) | Ollama llama3 | Free |
| Containers | Docker Compose | Free |

---

## Deployment Architecture

### Local — `docker compose up --build`

```
Browser → http://localhost:5173
  → nginx (frontend container)
    → /api/* proxied to http://backend:8080/api/   (Docker Compose internal DNS)
      → Spring Boot (backend container)
                ↕
          H2 file database
          (volume: /app/data)
```

| Config | Value | Where set |
|---|---|---|
| `VITE_API_URL` | *(empty)* — browser uses relative `/api/...`, nginx proxies it | `docker-compose.yml` build arg |
| `BACKEND_HOST` | `backend` — Docker Compose service name | `docker-compose.yml` environment |
| `PORT` | Defaults to `8080` via `${PORT:-8080}` in nginx.conf | nginx.conf fallback |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | `docker-compose.yml` environment |

### Railway — production

```
Browser → https://frontend.up.railway.app
  → React app calls VITE_API_URL/api/... directly
    → https://backend.up.railway.app/api/...
      → Spring Boot
            ↕
      H2 file database
      (Railway Volume: /app/data)
```

| Config | Value | Where set |
|---|---|---|
| `VITE_API_URL` | `https://<backend>.up.railway.app` | Railway frontend Build Argument |
| `PORT` | Injected by Railway at runtime | Railway runtime (auto) |
| `CORS_ALLOWED_ORIGINS` | `https://<frontend>.up.railway.app` | Railway backend Variable |
| `SPRING_DATASOURCE_URL` | `jdbc:h2:file:/app/data/studentplanner;AUTO_SERVER=TRUE` | Railway backend Variable |

### Vite dev server — `npm run dev` (no Docker)

```
Browser → http://localhost:5173
  → Vite dev server (HMR)
    → /api/* proxied to http://localhost:8080  (vite.config.ts proxy)
      → Spring Boot running natively (mvn spring-boot:run)
```

No environment variables needed — the proxy in [`frontend/vite.config.ts`](frontend/vite.config.ts) handles routing automatically.

---

## Key Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Local full-stack setup — starts backend + frontend with one command |
| `frontend/Dockerfile` | Multi-stage: builds React app with Vite, serves with nginx |
| `frontend/nginx.conf` | Serves static files; proxies `/api/` to backend (local only) |
| `backend/Dockerfile` | Multi-stage: builds Spring Boot JAR with Maven, runs with JRE |
| `backend/src/main/resources/application.properties` | Spring Boot config — datasource, JWT, CORS, server port |
| `deployment.md` | Step-by-step Railway deployment guide |
| `fix-logs.md` | Record of all issues fixed during Railway deployment |
