# COICOP Classification Validation System

A full-stack annotation platform for validating and reviewing COICOP (Classification of Individual Consumption by Purpose) classifications with AI assistance.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker Hub](#quick-start-with-docker-hub)
- [Installation](#installation)
  - [Using Setup Scripts](#using-setup-scripts)
  - [Manual Setup](#manual-setup)
  - [Using Docker (Build Locally)](#using-docker-build-locally)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [User Workflow](#user-workflow)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Contributing](#contributing)
- [License](#license)

## Overview

This system enables reviewers to validate COICOP classifications by comparing existing codes with AI model predictions. Items are presented in a queue-based workflow where reviewers can accept, fix, or escalate classifications.

**Key Use Case:** Quality assurance for automated classification systems, ensuring accurate categorization of consumer goods and services.

## Features

- **Queue-Based Validation**: Items with model predictions are presented to reviewers one at a time
- **Conflict Resolution**: Compare existing and model-predicted codes side by side
- **Classification Search**: Full-text search through COICOP classifications by code, title, or description
- **Hierarchy Browsing**: View complete classification hierarchy (Division > Group > Class > Detail)
- **Multiple Actions**: Accept, Fix (manual selection), or Escalate decisions
- **Keyboard Navigation**: Fast keyboard shortcuts for experienced reviewers
- **Item Locking**: Prevents duplicate work by locking items to active users
- **Confidence Filtering**: Separate queues for high and low confidence predictions

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLModel** - SQL database ORM with Pydantic integration
- **SQLite** - Lightweight file-based database
- **Pandas** - Data processing and CSV handling
- **Uvicorn** - ASGI server

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Project Structure

```
annotation_system/
├── backend/
│   ├── main.py              # FastAPI app setup and lifespan
│   ├── api.py               # API route definitions
│   ├── models.py            # SQLModel data models
│   ├── services.py          # Business logic and queries
│   ├── database.py          # SQLite database setup
│   ├── requirements.txt     # Python dependencies
│   ├── database.db          # SQLite database file
│   ├── dataset.csv          # Items to validate
│   ├── raw_coicop.json      # COICOP classification data
│   ├── Dockerfile           # Production Docker image
│   └── Dockerfile.dev       # Development Docker image
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx         # Application entry point
│   │   ├── App.tsx          # Root component
│   │   ├── AnnotationView.tsx   # Main validation view
│   │   ├── api.ts           # API client and TypeScript types
│   │   └── components/
│   │       ├── ItemDisplay.tsx  # Current item details
│   │       ├── ActionPanel.tsx  # Action buttons
│   │       └── FixPanel.tsx     # Classification search modal
│   ├── package.json         # npm dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── nginx.conf           # Production nginx config
│   ├── Dockerfile           # Production Docker image
│   └── Dockerfile.dev       # Development Docker image
│
├── docker-compose.yml       # Production Docker orchestration (build locally)
├── docker-compose.dev.yml   # Development Docker orchestration
├── docker-compose.hub.yml   # Docker Hub pre-built images
├── setup.sh                 # Unix/macOS setup script
├── setup.bat                # Windows setup script
├── run.sh                   # Unix/macOS run script
├── run.bat                  # Windows run script
├── run-docker.sh            # Unix/macOS Docker Hub runner
├── run-docker.bat           # Windows Docker Hub runner
└── README.md
```

## Prerequisites

- **Python** 3.8 or higher (for local development)
- **Node.js** 18 or higher (for local development)
- **npm** 8 or higher (for local development)
- **Docker** (for containerized deployment)

## Quick Start with Docker Hub

The fastest way to run the application using pre-built images from Docker Hub.

### Docker Hub Images

| Image | Description |
|-------|-------------|
| `bahyali/coicop-validation-backend:latest` | FastAPI backend server |
| `bahyali/coicop-validation-frontend:latest` | React frontend with nginx |

### Using Runner Scripts (Recommended)

**Unix/macOS:**
```bash
# Download and run
curl -fsSL https://raw.githubusercontent.com/bahyali/coicop-validation-system/main/run-docker.sh -o run-docker.sh
chmod +x run-docker.sh
./run-docker.sh up
```

**Windows (PowerShell):**
```powershell
# Download and run
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/bahyali/coicop-validation-system/main/run-docker.bat" -OutFile "run-docker.bat"
.\run-docker.bat up
```

### Runner Script Commands

| Command | Description |
|---------|-------------|
| `up` | Start the application (default) |
| `down` | Stop the application |
| `pull` | Pull latest images from Docker Hub |
| `logs` | View application logs |
| `restart` | Restart the application |
| `status` | Show container status |

### Using Docker Compose Directly

```bash
# Using the hub compose file
docker compose -f docker-compose.hub.yml up -d

# Or pull and run manually
docker pull bahyali/coicop-validation-backend:latest
docker pull bahyali/coicop-validation-frontend:latest
docker compose -f docker-compose.hub.yml up -d
```

### Custom Ports

```bash
# Unix/macOS
FRONTEND_PORT=8080 BACKEND_PORT=3000 ./run-docker.sh up

# Windows
set FRONTEND_PORT=8080 && set BACKEND_PORT=3000 && run-docker.bat up
```

### Access
- **Frontend:** http://localhost (port 80)
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Installation

### Using Setup Scripts

**Unix/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

The setup script will:
1. Check for required tools (Python, Node.js, npm)
2. Create a Python virtual environment
3. Install Python dependencies
4. Install npm dependencies

### Manual Setup

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Using Docker (Build Locally)

Build images locally from source code. No Python/Node.js setup required.

```bash
# Production (builds and runs)
docker compose up --build

# Development (with hot reload)
docker compose -f docker-compose.dev.yml up --build
```

> **Note:** For pre-built images from Docker Hub, see [Quick Start with Docker Hub](#quick-start-with-docker-hub).

## Running the Application

### Development Mode

Development mode enables hot reloading for both backend and frontend.

**Unix/macOS:**
```bash
./run.sh dev
```

**Windows:**
```cmd
run.bat dev
```

**Docker:**
```bash
docker compose -f docker-compose.dev.yml up
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production Mode

**Unix/macOS:**
```bash
./run.sh prod
```

**Windows:**
```cmd
run.bat prod
```

**Docker:**
```bash
docker compose up -d
```

**Access:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:8000

### Additional Commands

| Command | Description |
|---------|-------------|
| `./run.sh backend` | Run only backend server |
| `./run.sh frontend` | Run only frontend dev server |
| `./run.sh build` | Build frontend for production |
| `./run.sh help` | Show all available commands |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | 8000 | Backend server port |
| `FRONTEND_PORT` | 5173 (dev) / 80 (prod) | Frontend server port |

**Example:**
```bash
BACKEND_PORT=3000 FRONTEND_PORT=8080 ./run.sh dev
```

### Data Files

| File | Location | Description |
|------|----------|-------------|
| `database.db` | backend/ | SQLite database (auto-created) |
| `dataset.csv` | backend/ | Items to validate |
| `raw_coicop.json` | backend/ | COICOP classification definitions |

### Dataset CSV Format

```csv
id,description,code,model_code,confidence
item_001,"Product description",01.1.1,01.1.2,0.85
```

| Column | Description |
|--------|-------------|
| `id` | Unique item identifier |
| `description` | Item description text |
| `code` | Existing classification code (optional) |
| `model_code` | AI model's predicted code |
| `confidence` | Model confidence score (0-1) |

## API Reference

**Base URL:** `http://localhost:8000/api`

### Endpoints

#### Get Next Item
```http
GET /items/next?user_id={user_id}&queue={queue}
```
Fetches the next pending item and locks it for the user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | Reviewer's user ID |
| `queue` | string | No | Queue name (high_confidence, low_confidence) |

**Response:** `Item` object or `null`

#### Submit Decision
```http
POST /decisions
Content-Type: application/json
```

**Request Body:**
```json
{
  "item_id": "item_001",
  "reviewer_id": "user123",
  "action": "accept",
  "final_code": "01.1.1",
  "escalation_reason": null,
  "time_spent_ms": 5000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item_id` | string | Yes | Item being reviewed |
| `reviewer_id` | string | Yes | Reviewer's user ID |
| `action` | string | Yes | accept, fix, or escalate |
| `final_code` | string | Yes | Selected classification code |
| `escalation_reason` | string | No | Reason for escalation |
| `time_spent_ms` | integer | No | Time spent reviewing |

#### Search Classifications
```http
GET /classifications?query={query}&limit={limit}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | Required | Search term |
| `limit` | integer | 10 | Max results (max: 50) |

**Response:** Array of `Classification` objects

#### Get Classification by Code
```http
GET /classifications/{code}
```

**Response:** `Classification` object or 404

#### Get Statistics
```http
GET /stats
```

**Response:** System statistics (placeholder)

## Data Models

### Item
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `description` | string | Item description |
| `meta_data` | object | Additional metadata |
| `existing_code` | string | Pre-existing classification |
| `existing_label` | string | Existing classification title |
| `model_code` | string | AI predicted code |
| `model_label` | string | Predicted classification title |
| `confidence_score` | float | Model confidence (0-1) |
| `status` | string | pending, locked, completed, escalated |
| `queue` | string | high_confidence, low_confidence |
| `locked_by` | string | User ID holding lock |
| `locked_at` | datetime | Lock timestamp |

### Classification
| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Classification code (e.g., "01.1.2") |
| `title` | string | Classification name |
| `intro` | string | Introductory description |
| `includes` | string | Items included |
| `also_includes` | string | Also included items |
| `excludes` | string | Excluded items |

### Decision
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Auto-increment ID |
| `item_id` | string | Reference to Item |
| `reviewer_id` | string | Reviewer user ID |
| `action` | string | accept, fix, escalate |
| `final_code` | string | Final classification |
| `escalation_reason` | string | Escalation reason |
| `time_spent_ms` | integer | Time spent (ms) |
| `timestamp` | datetime | Decision timestamp |

## User Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Application                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Fetch Next Pending Item                         │
│         (Item locked to prevent duplicates)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Review Item                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Existing Code   │  │ Model Predicted │                   │
│  │ + Label         │  │ Code + Label    │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Accept  │   │   Fix    │   │ Escalate │
        │          │   │ (Search) │   │          │
        └──────────┘   └──────────┘   └──────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Submit Decision to Backend                      │
│            (Item marked as completed)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Load Next Item...
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` | Accept current classification |
| `M` | Select model's predicted code |
| `X` | Select existing code |
| `F` | Open Fix panel (search) |
| `E` | Escalate item |
| `↑` / `↓` | Navigate search results |
| `Enter` | Select highlighted result |
| `Esc` | Close Fix panel |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add TypeScript types for new components
- Test changes in both development and production modes
- Update documentation for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
