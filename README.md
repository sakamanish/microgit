# AI Study Buddy (React + Flask + Gemini)

A simple two-tier app:
- Frontend: React single-page app (builds to static and served by Nginx in Docker)
- Backend: Flask API that calls Google Gemini (Generate Content) via REST

## Features
- Ask AI questions from the browser
- Backend proxies to Gemini securely using `GEMINI_API_KEY`
- Email sending endpoint (optional)
- Dockerfiles for both services and docker-compose for local
- Jenkins pipeline for CI (builds, runs locally, optional push to Docker Hub)
- Ready for deployment on Render (backend as Python service, frontend as static site)

## Project Structure
```
backend/            # Flask API
  app.py            # Flask entry, Gemini call
  requirements.txt  # Python deps
  Dockerfile        # Backend container
frontend/           # React app
  src/components/ChatBox.js  # Calls backend /ask
  Dockerfile        # Multi-stage build + Nginx serve
  package.json
Jenkinsfile         # Windows-friendly pipeline (bat) builds, runs containers, pushes optionally
docker-compose.yml  # Local dev for both services
.dockerignore
.gitignore
```

## Prerequisites
- Node.js 18/20 (CRA 5 works with Node 18/20; Node 22 may fail)
- Python 3.10+ (tested with 3.11)
- Docker Desktop (for containerized runs)
- Git (for version control/CI)

## Environment Variables
Create `backend/.env` for local/dev:
```
GEMINI_API_KEY=YOUR_REAL_KEY
GEMINI_MODEL=gemini-2.0-flash
```
Frontend runtime base URL is set at build time via:
- `REACT_APP_API_URL` (defaults to `http://localhost:5000` if not set)

## Local Development (without Docker)
Backend:
```bash
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
# Serves at http://localhost:5000
```

Frontend:
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000 (calls backend at http://localhost:5000 by default)
```

## Local Development (with Docker)
Build images from repo root:
```bash
# Ensure backend/.env exists as above

docker build -t your-dockerhub-username/ai-study-buddy-backend:local -f backend/Dockerfile .
docker build -t your-dockerhub-username/ai-study-buddy-frontend:local -f frontend/Dockerfile .

# Run
docker rm -f ai-study-backend 2>nul || true
docker rm -f ai-study-frontend 2>nul || true

docker run -d --name ai-study-backend -p 5000:5000 --env-file backend/.env your-dockerhub-username/ai-study-buddy-backend:local
docker run -d --name ai-study-frontend -p 3000:80 your-dockerhub-username/ai-study-buddy-frontend:local
```
Open:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Using docker-compose
Update `docker-compose.yml` image names to your Docker Hub username if you plan to pull.
```bash
docker compose up --build -d
```

## Jenkins CI/CD (Windows-friendly)
The `Jenkinsfile` uses batch (`bat`) steps and includes:
- Install frontend/backend deps
- Build Docker images
- Run containers locally on the Jenkins machine (backend:5000, frontend:3000)
- Optional push to Docker Hub on `main`/`master` (requires credentials)

Setup steps:
1) Jenkins agent must have Docker Desktop running and accessible.
2) Add Jenkins credentials:
   - ID: `dockerhub-creds` (Kind: Username with password; Username: your Docker Hub username; Password: Docker Hub Access Token with Read & Write)
3) Edit `Jenkinsfile` env:
```groovy
environment {
  DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
  DOCKERHUB_USERNAME = "your-dockerhub-username"
}
```
4) Ensure `backend/.env` exists on the Jenkins workspace machine or supply secrets another way.
5) Point the job to the repository (branch: `main`) and Build.

## Docker Hub Push (manual)
```bash
docker login -u your-dockerhub-username
# Paste Docker Hub access token (Read & Write)

docker tag your-dockerhub-username/ai-study-buddy-backend:local  your-dockerhub-username/ai-study-buddy-backend:latest
docker tag your-dockerhub-username/ai-study-buddy-frontend:local your-dockerhub-username/ai-study-buddy-frontend:latest

docker push your-dockerhub-username/ai-study-buddy-backend:latest
docker push your-dockerhub-username/ai-study-buddy-frontend:latest
```

## Deploy on Render
Backend (Flask):
1) Render → New → Web Service → connect GitHub repo.
2) Root Directory: `backend`
3) Environment: Python 3.x
4) Build Command: (auto) or `pip install -r requirements.txt`
5) Start Command: `python app.py`
6) Env Vars: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.0-flash`, `PORT=5000`
7) Deploy → copy the backend URL (e.g., `https://your-backend.onrender.com`).

Frontend (Static Site):
1) Render → New → Static Site → connect repo.
2) Root Directory: `frontend`
3) Build Command: `npm install && npm run build`
4) Publish Directory: `build`
5) Environment Variable: `REACT_APP_API_URL=https://your-backend.onrender.com`
6) Deploy → static site URL becomes your frontend.

## Live URLs and Images
- Docker Images (Docker Hub):
  - Backend: `sakamanish/ai-study-buddy-backend`
  - Frontend: `sakamanish/ai-study-buddy-frontend`
- Deployed Frontend (Render):
  - [https://ai-study-buddy-frontend-ylvm.onrender.com/](https://ai-study-buddy-frontend-ylvm.onrender.com/)
- Deployed Backend (Render):
  - Set this to your actual Render Web Service URL (e.g., `https://your-backend.onrender.com`).

## Troubleshooting
- Node 22 + CRA 5 issues: use Node 18/20 or update deps.
- CORS: enabled via `flask-cors`. Lock down origins in production if needed.
- Docker DNS errors on Windows: set Docker Desktop DNS (8.8.8.8/1.1.1.1), restart WSL (`wsl --shutdown`).
- Jenkins cannot reach Docker: run Jenkins service as a user that can access Docker Desktop, ensure `com.docker.service` is running.
- Docker Hub push fails "insufficient scopes": use a Docker Hub Access Token with Read & Write and re-login.

## Tech Stack
- Frontend: React 18, CRA, Nginx (container serve)
- Backend: Flask, requests, flask-cors, python-dotenv
- AI: Google Gemini (Generative Language API) via REST `generateContent`
- CI/CD: Jenkins (Pipeline)
- Container: Docker, docker-compose
- Hosting: Render (Backend: Python service, Frontend: Static site)

## License
MIT (or your preferred license)
