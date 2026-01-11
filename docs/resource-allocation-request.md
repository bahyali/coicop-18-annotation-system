# Resource Allocation Request: COICOP Annotation System

## Purpose
Internal hosting of the COICOP classification validation tool for 10 concurrent users.

---

## Server Requirements

| Resource | Minimum | Recommended | Maximum (with PostgreSQL) |
|----------|---------|-------------|---------------------------|
| **CPU** | 2 cores | 4 cores | 8 cores |
| **RAM** | 4 GB | 8 GB | 16 GB |
| **Storage** | 10 GB SSD | 20 GB SSD | 50 GB SSD |
| **Network** | 100 Mbps | 1 Gbps | 1 Gbps |

**OS:** Ubuntu 22.04 LTS or Windows Server 2022

---

## Software Stack

| Component | Technology |
|-----------|------------|
| Frontend | React (served via Nginx/IIS) |
| Backend | Python FastAPI |
| Database | SQLite (file-based, no DB server required) |

**Note:** Future migration to PostgreSQL is planned for improved scalability. This would require an additional 4 GB RAM and port 5432 access.

---

## Network Requirements

| Port | Service | Access |
|------|---------|--------|
| 80 | HTTP | Internal network |
| 443 | HTTPS (optional) | Internal network |

---

## Estimated Resource Usage

- **CPU**: Low-moderate (API requests, classification searches)
- **Memory**: ~2-4 GB under normal load
- **Disk I/O**: Low (SQLite operations)
- **Bandwidth**: Minimal (~50 KB per request)

---

## Deployment Options

**Option A: Dedicated VM**
- Full isolation
- Easier maintenance

**Option B: Shared Server**
- Cost-effective
- Requires Docker or dedicated ports

---

## Timeline

| Phase | Duration |
|-------|----------|
| Server provisioning | 1-2 days |
| Application deployment | 1 day |
| Testing & validation | 1 day |

---

## Contact

For technical specifications, refer to `hosting-specifications.md` or contact the development team.
