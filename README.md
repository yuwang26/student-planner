# Student Planner — Project Overview

## Live App

🌐 **[https://student-planner-frontend-production.up.railway.app](https://student-planner-frontend-production.up.railway.app)**

| Service | URL |
|---|---|
| Frontend | https://student-planner-frontend-production.up.railway.app |
| Backend API | https://student-planner-backend-production.up.railway.app |

---

## What It Is

A full-stack web application that allows students to:
- Manage courses with colour coding
- Track homework assignments with due dates and status
- See a dashboard highlighting overdue and due-today homework
- Register and log in securely with JWT authentication

---

## Current Implementation Scope

| Area | Status | Notes |
|---|---|---|
| User auth (register / login / JWT) | ✅ Implemented | Email + password, bcrypt, JWT |
| Courses CRUD | ✅ Implemented | Name, description, colour |
| Homework CRUD | ✅ Implemented | Title, description, due date, status, course link |
| Dashboard | ✅ Implemented | Shows overdue and due-today homework |
| Due-soon flag | ✅ Implemented | Backend marks homework due within 24 h |
| Course filter on homework | ✅ Implemented | Client-side filter by course |
| Containerised (Docker) | ✅ Implemented | Both services have Dockerfiles |
| Railway cloud deployment | ✅ Deployed | Public HTTPS URLs |
| Mobile app | ❌ Out of scope | Removed — Phase 2 TODO |
| AI study plan | ❌ Out of scope | Phase 2 TODO |
| Notifications (email/SMS/push) | ❌ Out of scope | Phase 2 TODO |
| Study plan calendar | ❌ Out of scope | Phase 2 TODO |

---

## Architecture

```
┌─────────────────────────────────────┐
│  Browser                            │
│  React + TypeScript + Vite          │
│  TanStack Query · React Router      │
└──────────────┬──────────────────────┘
               │ HTTPS  /api/*
┌──────────────▼──────────────────────┐
│  Spring Boot 3  (Java 21)           │
│  REST API · Spring Security · JWT   │
│  Spring Data JPA                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  H2 Database (file mode)            │
│  Persisted at /app/data/            │
└─────────────────────────────────────┘
```

---

## Project Structure

```
student-planner/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/studentplanner/
│       ├── config/          SecurityConfig.java
│       ├── controller/      AuthController, CourseController,
│       │                    HomeworkController, GlobalExceptionHandler
│       ├── dto/             AuthDtos, CourseDtos, HomeworkDtos
│       ├── model/           User, Course, Homework
│       ├── repository/      UserRepository, CourseRepository, HomeworkRepository
│       ├── security/        JwtAuthFilter, JwtUtil, UserDetailsServiceImpl
│       └── service/         AuthService, CourseService, HomeworkService
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── components/      Layout.tsx
│       ├── context/         AuthContext.tsx
│       ├── lib/             api.ts (axios + JWT interceptor)
│       ├── pages/           Login, Register, Dashboard,
│       │                    CoursesPage, HomeworkPage
│       └── types/           index.ts
│
├── docker-compose.yml       Local full-stack setup
├── deployment.md            Railway deployment guide
└── fix-logs.md              Record of deployment fixes
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 18 |
| Frontend language | TypeScript | 5 |
| Frontend build tool | Vite | 5 |
| Frontend data fetching | TanStack Query | 5 |
| Frontend routing | React Router | 6 |
| Frontend HTTP client | axios | 1.7 |
| Frontend date handling | date-fns | 3 |
| Frontend server (prod) | nginx | alpine |
| Backend framework | Spring Boot | 3.3 |
| Backend language | Java | 21 |
| Backend auth | Spring Security + JWT (jjwt) | 0.12.6 |
| Backend persistence | Spring Data JPA + H2 | file mode |
| Backend build | Maven | 3.9 |
| Containers | Docker + Docker Compose | — |
| Cloud platform | Railway | free tier |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user, returns JWT |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/auth/me` | JWT | Get current user info |

### Courses — `/api/courses`
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/courses` | JWT | List all courses for current user |
| `POST` | `/api/courses` | JWT | Create a course |
| `PUT` | `/api/courses/{id}` | JWT | Update a course |
| `DELETE` | `/api/courses/{id}` | JWT | Delete a course |

### Homework — `/api/homework`
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/homework` | JWT | List all homework for current user |
| `POST` | `/api/homework` | JWT | Create homework |
| `PUT` | `/api/homework/{id}` | JWT | Update homework (all fields or status only) |
| `DELETE` | `/api/homework/{id}` | JWT | Delete homework |

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `id` | Long | PK |
| `email` | String | Unique, not null |
| `password` | String | bcrypt hashed |
| `fullName` | String | Optional |

### Course
| Field | Type | Notes |
|---|---|---|
| `id` | Long | PK |
| `name` | String | Required |
| `description` | String | Optional |
| `color` | String | Hex colour, optional |
| `user` | User | Owner (FK) |

### Homework
| Field | Type | Notes |
|---|---|---|
| `id` | Long | PK |
| `title` | String | Required |
| `description` | String | Optional |
| `dueDate` | LocalDate | Required |
| `status` | Enum | `PENDING` / `IN_PROGRESS` / `DONE` |
| `course` | Course | FK |
| `user` | User | Owner (FK) |

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Email + password sign in |
| `/register` | Register | Create new account |
| `/dashboard` | Dashboard | Overdue and due-today homework alert banner + table |
| `/courses` | CoursesPage | List, add, edit, delete courses with colour picker |
| `/homework` | HomeworkPage | List all homework, filter by course, add/edit/delete, inline status change |

---

## Running Locally

### Option A — Docker Compose (full stack, no installs needed)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

### Option B — Vite dev server + Spring Boot (hot reload)

```bash
# Terminal 1 — backend
cd backend
mvn spring-boot:run

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173 (Vite proxies `/api/*` to `localhost:8080`)

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

No environment variables needed — the proxy in `frontend/vite.config.ts` handles routing automatically.

---

## Key Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Local full-stack setup — starts backend + frontend with one command |
| `frontend/Dockerfile` | Multi-stage: builds React app with Vite, serves with nginx |
| `frontend/nginx.conf` | Serves static files; proxies `/api/` to backend (local only) |
| `frontend/vite.config.ts` | Vite config — dev proxy and build settings |
| `backend/Dockerfile` | Multi-stage: builds Spring Boot JAR with Maven, runs with JRE |
| `backend/src/main/resources/application.properties` | Spring Boot config — datasource, JWT, CORS, server port |
| `deployment.md` | Step-by-step Railway deployment guide |
| `fix-logs.md` | Record of all issues fixed during Railway deployment |

---

## Phase 2 — Future Scope

| Feature | Notes |
|---|---|
| AI study plan generator | OpenAI / Ollama integration to create weekly study schedule from homework |
| Email / SMS reminders | SendGrid + Twilio triggered before due dates |
| Browser push notifications | Web Push API (VAPID) |
| Mobile app | React Native + Expo — mirrors web app features |
| PostgreSQL | Swap H2 for PostgreSQL for production-grade persistence |
| Estimated study hours | Add `estimatedHours` field to Homework for AI planner input |
