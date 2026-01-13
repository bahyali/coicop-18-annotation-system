# COICOP-18 Annotation System

A comprehensive web-based annotation system for validating and classifying items according to the COICOP-18 (Classification of Individual Consumption According to Purpose) standard.

## 🌟 Features

### Core Features
- **Multi-User Annotation**: Support for multiple reviewers working simultaneously
- **Model-Assisted Classification**: AI model provides initial classifications with confidence scores
- **Three-Action Workflow**: Accept, Fix, or Escalate classifications
- **Real-time Statistics**: Live dashboard showing progress and team performance
- **Personal Progress Tracking**: Each user can view their own statistics and progress
- **Queue Management**: Automatic item distribution based on confidence levels
- **Lock Management**: Prevents concurrent editing conflicts

### Dashboard Features
- Real-time statistics with 30-second auto-refresh
- Per-user daily and total statistics
- Leaderboard showing top performers
- Agreement rate tracking between manual verification and model predictions
- Active time tracking (days and hours)
- Estimated completion time calculations
- Action breakdown visualization (Accept/Fix/Escalate)

### Security & Data Management
- User-specific data visibility
- Item locking mechanism
- Decision history tracking
- Time tracking for each annotation

## 🏗️ Architecture

### Backend (FastAPI + SQLModel)
- FastAPI for REST API
- SQLModel for ORM and database management
- SQLite for data storage
- Real-time statistics calculation
- Comprehensive API endpoints

### Frontend (React + TypeScript + Vite)
- Modern React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Lucide React for icons
- Responsive design

### Dashboard (Python HTTP Server)
- Standalone dashboard on port 7896
- Pure HTML/CSS/JavaScript
- Professional Lucide icons
- White clean interface
- Auto-refresh every 30 seconds

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### Quick Start (Development)

#### Linux/Mac:
```bash
# Setup
./setup.sh

# Run in development mode
./run.sh dev
```

#### Windows:
```cmd
# Setup
setup.bat

# Run in development mode
run.bat dev
```

### Quick Start (Docker)

#### Using Docker Compose:
```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

#### Using Pre-built Images from Docker Hub:
```bash
# Pull and run
docker-compose -f docker-compose.hub.yml up
```

## 🚀 Deployment

### Environment Variables

Create a `.env` file:
```env
BACKEND_PORT=8001
FRONTEND_PORT=8080
DASHBOARD_PORT=7896
```

### Docker Hub Images

Official images are available on Docker Hub:
- Backend: `radhyah/coicop-backend:latest`
- Frontend: `radhyah/coicop-frontend:latest`
- Dashboard: `radhyah/coicop-dashboard:latest`

### Deployment Scripts

#### Linux/Mac:
```bash
# Deploy from Docker Hub
./deploy.sh
```

#### Windows:
```cmd
# Deploy from Docker Hub
deploy.bat
```

## 🌐 Access Points

After starting the services:

- **Frontend**: http://localhost:8080 (or port 5173 in dev mode)
- **Backend API**: http://localhost:8001
- **Dashboard**: http://localhost:7896
- **API Docs**: http://localhost:8001/docs

## 📊 Dashboard

The dashboard provides comprehensive insights:

### Statistics Cards
1. **Total Data**: Total number of items
2. **Completed**: Completed items with completion percentage
3. **Remaining**: Pending and escalated items
4. **Agreement Rate**: Manual verification vs model prediction match rate
5. **Average Time**: Average time spent per item (seconds)
6. **Active Days**: Number of days and hours used in the system
7. **Estimated Time**: Estimated days to completion
8. **Total Decisions**: Total number of reviewer decisions

### Leaderboard
- Top 10 reviewers by performance
- Daily and total statistics for each reviewer
- Agreement rates
- Average time per decision
- Gold/Silver/Bronze ranking badges

### Action Breakdown
- Visual representation of Accept/Fix/Escalate actions
- Progress bars showing distribution
- Real-time counts

## 🔧 API Endpoints

### Item Management
- `GET /api/items/next?user_id={id}` - Get next item to review
- `POST /api/decisions` - Submit a decision

### Statistics
- `GET /api/stats?user_id={id}` - Get statistics (user-specific or global)
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/user-stats` - Get per-user statistics
- `GET /api/dashboard/action-breakdown` - Get action distribution
- `GET /api/dashboard/timeline` - Get daily timeline

### Classifications
- `GET /api/classifications/{code}` - Get classification details
- `GET /api/classifications?query={q}&limit={n}` - Search classifications

### Admin Operations
- `POST /api/unlock/{item_id}` - Unlock specific item
- `POST /api/unlock-all` - Unlock all locked items
- `POST /api/requeue-escalated` - Requeue escalated items
- `POST /api/reset-stale-locks?max_age_minutes={n}` - Reset stale locks

## 📁 Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── api.py           # Main API routes
│   ├── dashboard_api.py # Dashboard-specific routes
│   ├── models.py        # SQLModel database models
│   ├── services.py      # Business logic
│   ├── database.py      # Database connection
│   ├── dataset.csv      # Initial dataset
│   └── Dockerfile       # Backend container
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api.ts      # API client
│   │   └── AnnotationView.tsx  # Main view
│   ├── Dockerfile       # Frontend container
│   └── nginx.conf       # Nginx configuration
│
├── dashboard/           # Standalone dashboard
│   ├── index.html      # Dashboard UI
│   ├── server.py       # Python HTTP server
│   ├── Dockerfile      # Dashboard container
│   └── README.md       # Dashboard documentation
│
├── docker-compose.yml       # Main Docker Compose config
├── docker-compose.hub.yml   # Docker Hub deployment config
├── run.sh / run.bat        # Development run scripts
├── setup.sh / setup.bat    # Setup scripts
└── README.md               # This file
```

## 🛠️ Development

### Backend Development
```bash
cd backend
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Run with auto-reload
uvicorn main:app --reload --port 8001
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Dashboard Development
```bash
cd dashboard
python3 server.py
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 Usage

1. **Login**: Enter your name when prompted
2. **Review Items**: The system presents items one by one
3. **Three Actions**:
   - **Accept ✅**: Agree with model's classification
   - **Fix ✏️**: Correct the classification
   - **Escalate ⚠️**: Mark for senior review
4. **Track Progress**: Click the settings icon to view your personal statistics
5. **View Dashboard**: Open http://localhost:7896 to see team statistics

## 🔒 User Privacy

- Each user only sees their own progress in "My Progress" panel
- Statistics are user-specific when accessed with user_id parameter
- Users cannot see or modify other users' locked items
- Full audit trail of all decisions

## 📚 Documentation

- [Dashboard Guide](./DASHBOARD_GUIDE.md) - Detailed dashboard documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Quick Start](./QUICK_START.txt) - Quick reference guide
- [Windows Setup](./WINDOWS_SETUP.txt) - Windows-specific instructions

## 🐳 Docker

### Build Images
```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
```

### Push to Docker Hub
```bash
# Login
docker login

# Build and tag
docker build -t your-username/coicop-backend:latest ./backend
docker build -t your-username/coicop-frontend:latest ./frontend
docker build -t your-username/coicop-dashboard:latest ./dashboard

# Push
docker push your-username/coicop-backend:latest
docker push your-username/coicop-frontend:latest
docker push your-username/coicop-dashboard:latest
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Radyah - Initial work

## 🙏 Acknowledgments

- COICOP-18 Classification Standard
- FastAPI Community
- React Community
- Lucide Icons

## 📞 Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ for COICOP Classification**
