# Hosting Specifications for COICOP Annotation System

This document provides specifications for hosting the annotation system on a local server, supporting up to 10 concurrent users.

---

## System Overview

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React + TypeScript + Vite | React 19.2, Vite 7.2 |
| Backend | Python FastAPI + Uvicorn | FastAPI (latest) |
| Database | SQLite | 3.x |
| CSS Framework | Tailwind CSS | 4.1 |

---

## Hardware Requirements

### Minimum Specifications (10 concurrent users)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 10 GB SSD | 20 GB SSD |
| Network | 100 Mbps | 1 Gbps |

### Storage Breakdown
- Operating System: ~5 GB
- Application files: ~500 MB
- Database (SQLite): ~50 MB (scales with data)
- Logs & temp files: ~1 GB buffer

---

## Linux Server Setup

### Tested Distributions
- Ubuntu 22.04 LTS / 24.04 LTS (Recommended)
- Debian 12
- Rocky Linux 9 / AlmaLinux 9

### Prerequisites Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Install Nginx (reverse proxy)
sudo apt install nginx -y

# Install process manager
sudo apt install supervisor -y
```

### Directory Structure

```
/opt/annotation-system/
├── backend/
│   ├── venv/
│   ├── main.py
│   ├── database.db
│   └── ...
├── frontend/
│   ├── dist/           # Production build
│   └── ...
└── logs/
    ├── backend.log
    └── nginx.log
```

### Backend Deployment

```bash
# Create application directory
sudo mkdir -p /opt/annotation-system
sudo chown $USER:$USER /opt/annotation-system

# Copy application files
cp -r backend /opt/annotation-system/
cd /opt/annotation-system/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install production server
pip install gunicorn uvicorn[standard]
```

### Backend Service Configuration

Create `/etc/supervisor/conf.d/annotation-backend.conf`:

```ini
[program:annotation-backend]
directory=/opt/annotation-system/backend
command=/opt/annotation-system/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
user=www-data
autostart=true
autorestart=true
stderr_logfile=/opt/annotation-system/logs/backend.err.log
stdout_logfile=/opt/annotation-system/logs/backend.out.log
environment=PATH="/opt/annotation-system/backend/venv/bin"
```

**Worker Configuration for 10 users:**
- Workers: 4 (formula: 2 × CPU cores + 1)
- Each worker handles ~2-3 concurrent connections

### Frontend Build & Deployment

```bash
cd /opt/annotation-system/frontend

# Install dependencies
npm ci --production=false

# Update API URL for production
# Edit src/api.ts: change baseURL to production server address

# Build for production
npm run build

# Output in dist/ directory
```

### Nginx Configuration

Create `/etc/nginx/sites-available/annotation-system`:

```nginx
upstream backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-server-ip;  # Or domain name

    # Frontend static files
    root /opt/annotation-system/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/annotation-system /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Start Services

```bash
# Create log directory
sudo mkdir -p /opt/annotation-system/logs
sudo chown www-data:www-data /opt/annotation-system/logs

# Start backend
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start annotation-backend

# Enable services on boot
sudo systemctl enable supervisor
sudo systemctl enable nginx
```

### Firewall Configuration

```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (if using SSL)
sudo ufw enable
```

---

## Windows Server Setup

### Tested Versions
- Windows Server 2019
- Windows Server 2022
- Windows 10/11 Pro (for development/small deployments)

### Prerequisites Installation

1. **Python 3.11+**
   - Download from https://www.python.org/downloads/
   - Check "Add Python to PATH" during installation

2. **Node.js 20 LTS**
   - Download from https://nodejs.org/
   - Use LTS version

3. **IIS (Internet Information Services)**
   - Enable via Server Manager → Add Roles and Features → Web Server (IIS)

### Directory Structure

```
C:\annotation-system\
├── backend\
│   ├── venv\
│   ├── main.py
│   ├── database.db
│   └── ...
├── frontend\
│   ├── dist\
│   └── ...
└── logs\
```

### Backend Deployment

Open PowerShell as Administrator:

```powershell
# Create directory
New-Item -ItemType Directory -Path C:\annotation-system -Force
Set-Location C:\annotation-system

# Copy backend files (adjust source path)
Copy-Item -Path "path\to\backend" -Destination "C:\annotation-system\" -Recurse

# Create virtual environment
cd C:\annotation-system\backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
pip install waitress
```

### Backend Windows Service

Install NSSM (Non-Sucking Service Manager):
- Download from https://nssm.cc/download

Create service:

```powershell
# Using NSSM
nssm install AnnotationBackend "C:\annotation-system\backend\venv\Scripts\python.exe"
nssm set AnnotationBackend AppParameters "-m waitress --host=127.0.0.1 --port=8000 main:app"
nssm set AnnotationBackend AppDirectory "C:\annotation-system\backend"
nssm set AnnotationBackend AppStdout "C:\annotation-system\logs\backend.log"
nssm set AnnotationBackend AppStderr "C:\annotation-system\logs\backend.err.log"
nssm start AnnotationBackend
```

Alternative: Create `run-backend.ps1`:

```powershell
Set-Location C:\annotation-system\backend
.\venv\Scripts\Activate.ps1
waitress-serve --host=127.0.0.1 --port=8000 --threads=8 main:app
```

### Frontend Build

```powershell
cd C:\annotation-system\frontend

# Install dependencies
npm ci

# Update API URL in src/api.ts

# Build
npm run build
```

### IIS Configuration

1. **Install URL Rewrite Module**
   - Download from https://www.iis.net/downloads/microsoft/url-rewrite

2. **Install Application Request Routing (ARR)**
   - Download from https://www.iis.net/downloads/microsoft/application-request-routing

3. **Create IIS Site**
   - Open IIS Manager
   - Right-click Sites → Add Website
   - Site name: `AnnotationSystem`
   - Physical path: `C:\annotation-system\frontend\dist`
   - Port: 80

4. **Configure URL Rewrite**

Create `web.config` in `C:\annotation-system\frontend\dist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- API Proxy -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://127.0.0.1:8000/api/{R:1}" />
                </rule>
                <!-- SPA Fallback -->
                <rule name="SPA Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".woff" mimeType="font/woff" />
            <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
        </staticContent>
    </system.webServer>
</configuration>
```

5. **Enable ARR Proxy**
   - IIS Manager → Server → Application Request Routing → Server Proxy Settings
   - Check "Enable proxy"

### Windows Firewall

```powershell
# Allow HTTP
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Allow HTTPS (if using SSL)
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

---

## Performance Tuning for 10 Concurrent Users

### Backend Configuration

**Gunicorn (Linux):**
```bash
gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100
```

**Waitress (Windows):**
```powershell
waitress-serve --host=127.0.0.1 --port=8000 --threads=8 main:app
```

### SQLite Optimizations

Add to `backend/database.py`:

```python
from sqlalchemy import event

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")      # Write-Ahead Logging
    cursor.execute("PRAGMA synchronous=NORMAL")    # Balanced durability
    cursor.execute("PRAGMA cache_size=-64000")     # 64MB cache
    cursor.execute("PRAGMA busy_timeout=5000")     # 5s timeout for locks
    cursor.close()
```

### Nginx Tuning (Linux)

Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;

http {
    keepalive_timeout 65;
    client_max_body_size 10M;

    # Connection pooling
    upstream backend {
        server 127.0.0.1:8000;
        keepalive 32;
    }
}
```

---

## Monitoring & Maintenance

### Health Check Endpoint

The backend provides a health check at `GET /` returning:
```json
{"message": "System Operational"}
```

### Log Locations

**Linux:**
- Backend: `/opt/annotation-system/logs/backend.out.log`
- Nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

**Windows:**
- Backend: `C:\annotation-system\logs\backend.log`
- IIS: `C:\inetpub\logs\LogFiles\`

### Backup Strategy

```bash
# Linux - Daily backup script
#!/bin/bash
BACKUP_DIR="/backup/annotation-system"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
cp /opt/annotation-system/backend/database.db $BACKUP_DIR/database_$DATE.db
```

```powershell
# Windows - Daily backup script
$backupDir = "C:\backup\annotation-system"
$date = Get-Date -Format "yyyyMMdd"
New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item "C:\annotation-system\backend\database.db" "$backupDir\database_$date.db"
```

---

## Security Considerations

### Production Checklist

- [ ] Change CORS settings in `main.py` (remove `allow_origins=["*"]`)
- [ ] Implement proper user authentication
- [ ] Use HTTPS with valid SSL certificate
- [ ] Set `echo=False` in database.py for production
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Enable access logging
- [ ] Restrict database file permissions

### SSL/TLS Setup

**Linux (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Windows:**
- Use IIS Manager to import SSL certificate
- Or use win-acme for Let's Encrypt automation

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database locked errors | Enable WAL mode, increase busy_timeout |
| API timeout | Increase proxy_read_timeout in Nginx |
| Frontend not loading | Check Nginx/IIS static file configuration |
| CORS errors | Verify backend CORS settings include frontend origin |

### Service Commands

**Linux:**
```bash
# Check backend status
sudo supervisorctl status annotation-backend

# Restart backend
sudo supervisorctl restart annotation-backend

# Restart Nginx
sudo systemctl restart nginx

# View logs
tail -f /opt/annotation-system/logs/backend.out.log
```

**Windows:**
```powershell
# Check service status
nssm status AnnotationBackend

# Restart service
nssm restart AnnotationBackend

# Restart IIS
iisreset
```

---

## Quick Start Summary

### Linux
```bash
# 1. Install prerequisites
sudo apt install python3.11 python3.11-venv nodejs nginx supervisor -y

# 2. Deploy backend
cd /opt/annotation-system/backend
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt gunicorn uvicorn[standard]

# 3. Build frontend
cd /opt/annotation-system/frontend
npm ci && npm run build

# 4. Configure Nginx & Supervisor (see above)
# 5. Start services
sudo supervisorctl start annotation-backend
sudo systemctl start nginx
```

### Windows
```powershell
# 1. Install Python 3.11+, Node.js 20, IIS with ARR & URL Rewrite

# 2. Deploy backend
cd C:\annotation-system\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt waitress

# 3. Build frontend
cd C:\annotation-system\frontend
npm ci && npm run build

# 4. Configure IIS site with web.config
# 5. Create Windows service for backend (NSSM)
# 6. Start services
```

---

## Future: PostgreSQL Migration

The system is designed with SQLModel/SQLAlchemy, making database migration straightforward. Consider migrating to PostgreSQL when:
- Concurrent users exceed 15-20
- Database size grows beyond 500 MB
- Advanced querying or full-text search is needed
- High availability/replication is required

### Additional Requirements for PostgreSQL

| Resource | Specification |
|----------|---------------|
| **RAM** | +4 GB (total: 12 GB) |
| **Storage** | +10 GB for PostgreSQL data |
| **Port** | 5432 (PostgreSQL) |

### PostgreSQL Installation

**Linux:**
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE annotation_db;
CREATE USER annotation_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE annotation_db TO annotation_user;
\q
```

**Windows:**
- Download installer from https://www.postgresql.org/download/windows/
- Run installer and configure during setup

### Backend Configuration Changes

1. **Install PostgreSQL driver:**
```bash
pip install psycopg2-binary
```

2. **Update `backend/database.py`:**
```python
# Change from:
sqlite_url = f"sqlite:///database.db"

# To:
postgres_url = "postgresql://annotation_user:secure_password@localhost:5432/annotation_db"
engine = create_engine(postgres_url, echo=False, pool_size=10, max_overflow=20)
```

3. **Remove SQLite-specific pragmas** (if added)

### PostgreSQL Performance Tuning

Edit `/etc/postgresql/16/main/postgresql.conf`:

```ini
# Memory (for 12 GB total RAM)
shared_buffers = 3GB
effective_cache_size = 9GB
work_mem = 64MB
maintenance_work_mem = 512MB

# Connections (for 10-20 users)
max_connections = 50

# Write performance
wal_buffers = 64MB
checkpoint_completion_target = 0.9
```

### Migration Script

```bash
# Export data from SQLite
sqlite3 database.db .dump > backup.sql

# Or use a migration tool
pip install pgloader
pgloader sqlite:///database.db postgresql://user:pass@localhost/annotation_db
```

### PostgreSQL Backup

```bash
# Daily backup
pg_dump -U annotation_user annotation_db > backup_$(date +%Y%m%d).sql

# Automated with cron
0 2 * * * pg_dump -U annotation_user annotation_db > /backup/db_$(date +\%Y\%m\%d).sql
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | Initial specifications |
| 1.1 | 2026-01-05 | Added PostgreSQL migration path |
