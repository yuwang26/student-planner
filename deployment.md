# Deploy Student Planner to Railway

This guide walks you through deploying the full **student-planner** stack (Spring Boot backend + React frontend) to [Railway](https://railway.app) for free.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript, served by nginx |
| Backend | Spring Boot 3, Java 21, JWT auth |
| Database | H2 file-based, persisted via Railway Volume |

## Prerequisites

- Project pushed to a GitHub repository
- A free [Railway](https://railway.app) account (sign in with GitHub)

---

## Step 1 — Push to GitHub

If the project is not already on GitHub, push it now:

```bash
git remote add origin https://github.com/YOUR_USERNAME/student-planner.git
git push -u origin main
```

---

## Step 2 — Create a new Railway project

1. Go to [railway.app](https://railway.app) and log in.
2. Click **New Project**.
3. Select **Deploy from GitHub repo** and authorise Railway to access your repository.

---

## Step 3 — Deploy the Backend service

1. Inside your new project, click **Add Service → GitHub Repo**.
2. Select the `student-planner` repository.
3. Set **Root Directory** to `backend`.
4. Railway detects `backend/Dockerfile` automatically and starts a build.
5. Open the service **Variables** tab and add:

   | Variable | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:h2:file:/app/data/studentplanner;AUTO_SERVER=TRUE` |
   | `CORS_ALLOWED_ORIGINS` | `https://<your-frontend-domain>.up.railway.app` *(add after Step 4)* |

6. Open the service **Volumes** tab and add a volume:
   - **Mount Path**: `/app/data`
   - When Railway asks for a port, enter `8080`

   This persists the H2 database file across restarts and redeploys.

7. Go to **Settings → Networking → Generate Domain**, enter port `8080`.
   Copy the generated URL, e.g.:
   ```
   https://student-planner-backend-production.up.railway.app
   ```

---

## Step 4 — Deploy the Frontend service

1. Inside the same Railway project, click **Add Service → GitHub Repo**.
2. Select the same `student-planner` repository.
3. Set **Root Directory** to `frontend`.
4. Railway detects `frontend/Dockerfile` automatically.
5. Open the service **Variables** tab and add:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://student-planner-backend-production.up.railway.app` |

   > ⚠️ `VITE_API_URL` is a **build-time** variable — it must be set **before** the build runs so Vite can bake it into the JavaScript bundle. The `frontend/Dockerfile` declares it as a Docker `ARG` for this purpose.

6. Go to **Settings → Networking → Generate Domain**, enter port `8080`.
   Copy the generated frontend URL, e.g.:
   ```
   https://student-planner-frontend-production.up.railway.app
   ```

7. Go back to the **backend** service → **Variables** and set:

   | Variable | Value |
   |---|---|
   | `CORS_ALLOWED_ORIGINS` | `https://student-planner-frontend-production.up.railway.app` |

8. Redeploy the backend after setting `CORS_ALLOWED_ORIGINS`.

---

## Step 5 — Verify the deployment

1. Open the frontend URL in your browser.
2. Open **DevTools → Network** tab.
3. Try to register a new account.
4. Confirm the API request URL shows the **backend** domain:
   ```
   https://student-planner-backend-production.up.railway.app/api/auth/register
   ```
   If it shows the frontend domain instead, `VITE_API_URL` was not picked up — trigger a manual redeploy of the frontend from the **Deployments** tab.

---

## Step 6 — Automatic redeploys

Railway redeploys automatically on every `git push` to your connected branch. No extra setup needed.

---

## Complete environment variable reference

### Backend service — Variables

| Variable | Value | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:h2:file:/app/data/studentplanner;AUTO_SERVER=TRUE` | H2 file database path |
| `CORS_ALLOWED_ORIGINS` | `https://<frontend>.up.railway.app` | Allows the frontend origin through Spring Security CORS |

### Backend service — Volumes

| Mount Path | Purpose |
|---|---|
| `/app/data` | Persists the H2 database file across container restarts |

### Frontend service — Variables (Build Arguments)

| Variable | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://<backend>.up.railway.app` | Backend public URL baked into the JS bundle at build time |

---

## Files changed for Railway compatibility

| File | Change |
|---|---|
| `frontend/tsconfig.json` | Added `"types": ["vite/client"]` to resolve `import.meta.env` TypeScript error |
| `frontend/nginx.conf` | Changed `listen 8080` to `listen ${PORT}` so nginx binds to Railway's dynamic port |
| `frontend/Dockerfile` | Added `ARG VITE_API_URL` / `ENV` so Vite bakes the backend URL into the bundle; uses `envsubst` to inject `$PORT` into nginx config at startup |
| `backend/Dockerfile` | Changed `ENTRYPOINT` to `-Dserver.port=${PORT:-8080}` so Spring Boot binds to Railway's dynamic port |
| `backend/src/main/resources/application.properties` | Made `cors.allowed-origins` configurable via `${CORS_ALLOWED_ORIGINS}` env var |
| `backend/src/main/java/com/studentplanner/config/SecurityConfig.java` | Added `OPTIONS` `permitAll()` rule so CORS preflight requests are not blocked by Spring Security |

---

## Troubleshooting

**`Application failed to respond`**
- Railway's health check cannot reach the container. Confirm `$PORT` is being used — both `frontend/nginx.conf` and `backend/Dockerfile` must bind to `${PORT}`.

**`VITE_API_URL must be set for production builds`** *(build error)*
- The variable is not reaching the Docker build step. Confirm it is set in the frontend service Variables and trigger a manual redeploy.

**API calls going to the frontend URL instead of backend**
- `VITE_API_URL` was empty when the bundle was built. Set the variable, then trigger a full redeploy (not just a restart) so `npm run build` runs again.

**403 on API calls**
- `CORS_ALLOWED_ORIGINS` on the backend does not match the frontend domain exactly. Check for trailing slashes or `http` vs `https` mismatches.

**405 on API calls**
- Ensure the backend `Dockerfile` uses `-Dserver.port=${PORT:-8080}` so Spring Boot is actually reachable on the port Railway expects.

**Backend loses data after redeploy**
- The Volume at `/app/data` is not attached. Go to the backend service → Volumes tab and confirm it is mounted.
