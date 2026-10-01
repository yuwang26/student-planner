nfig# Fix Logs — Student Planner Railway Deployment

A record of every issue encountered and fixed while deploying the student-planner app to Railway.

---

## Fix 1 — TypeScript build error: `Property 'env' does not exist on type 'ImportMeta'`

**Error:**
```
src/lib/api.ts(3,26): error TS2339: Property 'env' does not exist on type 'ImportMeta'.
```

**Cause:**
`import.meta.env` is a Vite-specific extension to the browser's `ImportMeta` interface. TypeScript does not know about it unless `vite/client` is included in the `types` array.

**Fix:**
Added `"types": ["vite/client"]` to `frontend/tsconfig.json`.

```json
"types": ["vite/client"]
```

**File changed:** `frontend/tsconfig.json`

---

## Fix 2 — Frontend container not responding: `Application failed to respond`

**Error:**
```
Application failed to respond
```

**Cause:**
Railway injects a `$PORT` environment variable at runtime and routes all external traffic to that port. The nginx config was hardcoded to `listen 8080`, so if Railway assigned a different port the health check got no response.

**Fix:**
Changed nginx to listen on `${PORT}` and used `envsubst` in the Dockerfile to inject it at container startup.

`frontend/nginx.conf`:
```nginx
listen ${PORT};
```

`frontend/Dockerfile`:
```dockerfile
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
```

**Files changed:** `frontend/nginx.conf`, `frontend/Dockerfile`

---

## Fix 3 — Register returns 403 Forbidden (CORS rejection)

**Error:**
```
Server error 403
```

**Cause:**
The backend `cors.allowed-origins` was hardcoded to `http://localhost:5173` in `application.properties`. Requests from the Railway frontend domain were rejected by Spring Security before reaching any endpoint.

**Fix:**
Made `cors.allowed-origins` configurable via an environment variable.

`backend/src/main/resources/application.properties`:
```properties
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173}
```

Then set in Railway backend service Variables:
```
CORS_ALLOWED_ORIGINS = https://student-planner-frontend-production.up.railway.app
```

**File changed:** `backend/src/main/resources/application.properties`

---

## Fix 4 — Register returns 405 Method Not Allowed (OPTIONS preflight blocked)

**Error:**
```
Server error 405
```

**Cause:**
The browser sends a CORS `OPTIONS` preflight request before every cross-origin POST. Spring Security's filter chain was intercepting the `OPTIONS` request and returning 405 before the CORS handler could respond.

**Fix:**
Added an explicit `permitAll()` rule for all `OPTIONS` requests as the first rule in the security filter chain.

`backend/src/main/java/com/studentplanner/config/SecurityConfig.java`:
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
    .requestMatchers("/api/auth/**", "/h2-console/**").permitAll()
    .anyRequest().authenticated()
)
```

**File changed:** `backend/src/main/java/com/studentplanner/config/SecurityConfig.java`

---

## Fix 5 — Backend ignoring Railway's `$PORT`: persistent 405 from Railway router

**Error:**
```
Server error 405 (persisting after Fix 4)
```

**Cause:**
Same root cause as Fix 2 but on the backend. Railway injects `$PORT` dynamically. Spring Boot was hardcoded to start on `8080` via `server.port=8080`. If Railway assigned a different port, requests never reached Spring Boot — they hit Railway's own router which returned 405.

**Fix:**
Made Spring Boot bind to Railway's `$PORT` at startup, falling back to `8080` for local use.

`backend/Dockerfile`:
```dockerfile
ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "app.jar"]
```

**File changed:** `backend/Dockerfile`

---

## Fix 6 — `VITE_API_URL` not baked into the frontend bundle

**Symptom:**
All API calls going to `https://student-planner-frontend-production.up.railway.app/api/auth/register` (the frontend itself) instead of the backend URL. Confirmed via DevTools → Network tab.

**Cause:**
`VITE_*` environment variables are baked into the JavaScript bundle at build time by Vite. Railway's service Variables are runtime environment variables — they are not automatically passed into the Docker build step. So `VITE_API_URL` was always empty when `npm run build` ran, causing `import.meta.env.VITE_API_URL` to resolve to `undefined` and all API calls to fall back to relative paths.

**Fix:**
Declared `VITE_API_URL` as a Docker `ARG` and promoted it to `ENV` before `npm run build` runs. Railway passes service Variables as Docker build arguments when they match a declared `ARG`.

`frontend/Dockerfile`:
```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

Then set in Railway frontend service **Build Arguments**:
```
VITE_API_URL = https://student-planner-backend-production.up.railway.app
```

**Files changed:** `frontend/Dockerfile`

---

## Final working configuration

### Railway — Backend service Variables
| Variable | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:h2:file:/app/data/studentplanner;AUTO_SERVER=TRUE` |
| `CORS_ALLOWED_ORIGINS` | `https://student-planner-frontend-production.up.railway.app` |

### Railway — Backend service Volumes
| Mount Path |
|---|
| `/app/data` |

### Railway — Frontend service Build Arguments
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://student-planner-backend-production.up.railway.app` |

### Live URLs
| Service | URL |
|---|---|
| Frontend | `https://student-planner-frontend-production.up.railway.app` |
| Backend | `https://student-planner-backend-production.up.railway.app` |
