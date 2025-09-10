# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/build/ /usr/share/nginx/html
# Simple healthcheck
HEALTHCHECK CMD wget -qO- http://localhost/ || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
