# Stage 1: build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
# Declare build arg before COPY so it is available to Vite at build time.
# - Local (docker compose): empty string; nginx proxies /api/ to the backend container.
# - Railway: set to the backend public URL via Railway Build Arguments.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 8080
# Substitute PORT and BACKEND_HOST at container startup.
# Defaults applied in shell before envsubst (envsubst does not support ${VAR:-default} syntax).
CMD ["/bin/sh", "-c", "export PORT=${PORT:-8080}; export BACKEND_HOST=${BACKEND_HOST:-backend}; envsubst '${PORT} ${BACKEND_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
