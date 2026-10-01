# Deploy Student Planner to Railway

This guide walks you through deploying the full **student-planner** stack (Spring Boot backend + React frontend) to [Railway](https://railway.app) for free.

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
4. Railway detects the [`backend/Dockerfile`](backend/Dockerfile) automatically.
5. Open the service **Variables** tab and add:

   | Variable | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:h2:file:/app/data/studentplanner;AUTO_SERVER=TRUE` |

6. Open the service **Volumes** tab and add a volume:
   - **Mount Path**: `/app/data`

   This persists the H2 database across restarts.

7. Click **Deploy**. Wait for the build to finish.

8. Once deployed, go to **Settings → Networking** and note the **internal hostname** (e.g. `backend.railway.internal`). You will need it in Step 4.

---

## Step 4 — Deploy the Frontend service

1. Inside the same Railway project, click **Add Service → GitHub Repo**.
2. Select the same `student-planner` repository.
3. Set **Root Directory** to `frontend`.
4. Railway detects the [`frontend/Dockerfile`](frontend/Dockerfile) automatically.
5. Open the service **Variables** tab and add:

   | Variable | Value |
   |---|---|
   | `BACKEND_HOST` | the internal hostname from Step 3 (e.g. `backend.railway.internal`) |

   > The [`frontend/nginx.conf`](frontend/nginx.conf) proxies all `/api/` requests to `http://${BACKEND_HOST}:8080/api/`.
   > The [`frontend/Dockerfile`](frontend/Dockerfile) uses `envsubst` to inject this value at container startup.

6. Click **Deploy**.

---

## Step 5 — Expose the Frontend publicly

1. Select the **frontend** service.
2. Go to **Settings → Networking → Generate Domain**.
3. Railway provides a public HTTPS URL, for example:
   ```
   https://student-planner-frontend.up.railway.app
   ```
4. Open that URL in your browser — the application is live.

---

## Step 6 — Enable automatic redeploys (optional)

Railway redeploys automatically on every `git push` to your configured branch by default. No extra setup needed.

---

## Environment variables reference

### Backend

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | JDBC URL for the H2 file database |

### Frontend

| Variable | Description |
|---|---|
| `BACKEND_HOST` | Internal Railway hostname of the backend service |

---

## Files changed for Railway compatibility

| File | Change |
|---|---|
| [`frontend/nginx.conf`](frontend/nginx.conf) | Replaced hardcoded `backend` hostname with `${BACKEND_HOST}` env var |
| [`frontend/Dockerfile`](frontend/Dockerfile) | Uses `envsubst` to inject `BACKEND_HOST` into nginx config at startup |

---

## Troubleshooting

**Backend fails to start**
- Check that the Volume is mounted at `/app/data`.
- Check the `SPRING_DATASOURCE_URL` variable is set correctly.

**Frontend shows "Bad Gateway" on API calls**
- Verify `BACKEND_HOST` matches the backend's internal hostname exactly.
- Make sure the backend service has finished deploying before testing.

**Changes not deploying**
- Confirm the correct branch is connected in Railway's service settings.
- Trigger a manual redeploy from the **Deployments** tab.
