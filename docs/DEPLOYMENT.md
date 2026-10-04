# Production Deployment Guide

This guide details deployment procedures for the **NxtWave AI Student Growth Engine & SaaS Platform**.

---

## 1. System Architecture & Prerequisites

The platform consists of two primary services:
1. **Backend API Gateway & Growth Engine:** FastAPI ASGI service with SQLAlchemy ORM, analytical calculations, and AI provider abstraction.
2. **Frontend Growth Cockpit:** High-performance React 18 SPA built with Vite, TypeScript, and Tailwind CSS.
3. **Persistent Data Store:** SQLite (standard for single-instance / hiring sprint demonstration) or PostgreSQL (recommended for horizontal multi-replica scaling).

### Prerequisites
- **Docker & Docker Compose** (v2.0+) OR
- **Python 3.11+** and **Node.js 20+** (for bare-metal execution)
- Minimum 1 GB RAM, 1 vCPU, 5 GB storage

---

## 2. Quickstart: Docker Compose Deployment (Recommended)

Docker Compose orchestrates both the backend container (with healthchecks) and the frontend container (served via production Nginx) with volume persistence.

### Step 1: Clone and Configure Environment
```bash
# Clone the repository
git clone <repository_url> nxtwave-growth-challenge
cd nxtwave-growth-challenge

# Create production environment file from template
cp .env.example .env
```

Edit `.env` to configure production secrets:
```bash
# Generate secure random secret keys
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_API_KEY=$(openssl rand -hex 16)
```

### Step 2: Build and Start Services
```bash
docker-compose up -d --build
```

### Step 3: Verify Container Health
```bash
# Check running containers
docker-compose ps

# Query backend health probe
curl -f http://localhost:8000/health

# Query frontend health probe
curl -I http://localhost:80/
```

Access the platform:
- **Growth SaaS Cockpit:** [http://localhost](http://localhost) (or port `5173`)
- **API Documentation (Swagger UI):** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Health Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 3. Clean Environment Bootstrapping

The application is engineered to bootstrap from a completely clean state without manual database scripts.

When the backend container starts:
1. **Schema Check:** Inspects the database and creates all tables on `Base.metadata` if missing.
2. **Auto-Seed:** If the database contains zero campaigns, it automatically injects baseline institutions (CBIT, VNRVJIET, VCE, JNTUH), partner clubs, and initial cohorts.
3. **Migrations:** Runs safe non-destructive migrations (`database.migrations.run_all_migrations`).
4. **Health Check Readiness:** Dynamic database ping (`SELECT 1`) ensures readiness before accepting traffic.

To test clean startup locally:
```bash
# Delete existing SQLite file
rm -f data/growth_engine.db

# Start backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
# Expected log: "Clean environment detected. Auto-seeding initial baseline campaign data..."
```

---

## 4. Alternative Deployment Topologies

### Option A: Cloud Container Services (Render / AWS App Runner / GCP Cloud Run / Railway / Fly.io)

For serverless container runners that provide a single container port (`PORT`):

1. **Build Frontend SPA First:**
   ```bash
   cd frontend
   npm ci
   npm run build
   cd ..
   ```
2. **Container Dockerfile Build:**
   ```bash
   docker build -t nxtwave-growth-engine .
   docker run -p 8000:8000 -e ENVIRONMENT=production nxtwave-growth-engine
   ```
3. Set Cloud Environment Variables:
   - `ENVIRONMENT=production`
   - `DEBUG=False`
   - `DATABASE_URL=sqlite:///./data/growth_engine.db` (or managed Postgres URL)
   - `SECRET_KEY=<your-secret>`
   - `ALLOWED_ORIGINS=["https://your-domain.com"]`

---

### Option B: Decoupled Deployment (Vercel / Netlify + Backend Container)

To host the frontend on a global CDN and the backend on a container:

1. **Deploy Frontend on Vercel/Netlify:**
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:** `VITE_API_URL=https://api.your-domain.com`

2. **Deploy Backend on Container Host:**
   - Configure `ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]` in backend environment variables.
   - Configure `FRONTEND_URL=https://your-frontend.vercel.app` for referral WhatsApp and deep links.

---

### Option C: Bare-Metal Linux VM (Ubuntu / Debian Systemd + Nginx)

#### 1. System Setup
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm nginx
sudo mkdir -p /var/www/nxtwave-growth && sudo chown -R $USER:$USER /var/www/nxtwave-growth
git clone <repo_url> /var/www/nxtwave-growth
cd /var/www/nxtwave-growth
```

#### 2. Backend Virtualenv
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

#### 3. Frontend Build
```bash
cd frontend
npm ci
npm run build
cd ..
```

#### 4. Systemd Service (`/etc/systemd/system/growth-engine.service`)
```ini
[Unit]
Description=NxtWave Growth Engine Backend Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/nxtwave-growth
EnvironmentFile=/var/www/nxtwave-growth/.env
ExecStart=/var/www/nxtwave-growth/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now growth-engine
```

#### 5. Nginx Reverse Proxy (`/etc/nginx/sites-available/growth-engine`)
```nginx
server {
    listen 80;
    server_name growth.your-domain.com;

    root /var/www/nxtwave-growth/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site and configure SSL:
```bash
sudo ln -s /etc/nginx/sites-available/growth-engine /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d growth.your-domain.com
```

---

## 5. Production Environment Variables Reference

| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `ENVIRONMENT` | string | `production` | Environment mode (`development`, `staging`, `production`). |
| `DEBUG` | boolean | `False` | Disables verbose debug logging and traceback exposure. |
| `PORT` | int | `8000` | Port for the Uvicorn ASGI server to bind. |
| `HOST` | string | `0.0.0.0` | Network interface to listen on. |
| `DATABASE_URL` | string | `sqlite:///./data/growth_engine.db` | SQLAlchemy connection string (SQLite or PostgreSQL). |
| `SECRET_KEY` | string | *Required in prod* | Secret string used for cryptographic signing and tokens. |
| `ADMIN_API_KEY` | string | *Required in prod* | Secret key for privileged mutations (`X-Admin-Key` header). |
| `ALLOWED_ORIGINS` | JSON list | `["http://localhost:5173"]` | Permitted origins for CORS browser preflight headers. |
| `AI_PROVIDER` | string | `deterministic_fallback` | Active LLM engine (`deterministic_fallback`, `openai`, `gemini`). |
| `OPENAI_API_KEY` | string | `""` | API key if `AI_PROVIDER=openai`. |
| `GEMINI_API_KEY` | string | `""` | API key if `AI_PROVIDER=gemini`. |
| `CAMPAIGN_TARGET_REGISTRATIONS` | int | `500` | Target student registrations constraint. |
| `CAMPAIGN_BUDGET_INR` | float | `2000.0` | Maximum campaign budget ceiling constraint. |
| `FRONTEND_URL` | string | `http://localhost` | Public domain for generating student referral links. |

---

## 6. Health Checks & Monitoring

The platform provides a dual-health endpoint supporting both standard monitoring systems and Kubernetes / Docker liveness probes:
- `GET /health` (Root alias)
- `GET /api/v1/health` (Versioned endpoint)

### Expected JSON Response (HTTP 200 OK)
```json
{
  "status": "healthy",
  "database": "connected",
  "app_name": "NxtWave AI Student Growth Engine",
  "version": "1.0.0",
  "environment": "production",
  "ai_provider": "deterministic_fallback",
  "campaign": {
    "target": 500,
    "budget_inr": 2000.0,
    "duration_days": 7,
    "workshop": "Build Your First AI Project in 60 Minutes"
  },
  "timestamp": "2026-10-05T00:50:00.000000+00:00"
}
```

### Docker Healthcheck Definition
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

---

## 7. Database Backups & Zero-Downtime Maintenance

### SQLite File Backup
To create a safe hot backup of the SQLite database:
```bash
sqlite3 data/growth_engine.db ".backup 'data/backup_$(date +%Y%m%d_%H%M%S).db'"
```

### PostgreSQL Dump
```bash
pg_dump -U growth_user -h localhost growth_engine_db > backup.sql
```
