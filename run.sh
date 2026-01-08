#!/bin/bash

# COICOP Classification Validation System - Run Script
# Usage: ./run.sh [dev|prod|backend|frontend]

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default ports
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Print usage
usage() {
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev       Run both backend and frontend in development mode (default)"
    echo "  prod      Build frontend and run production server"
    echo "  backend   Run only the backend server"
    echo "  frontend  Run only the frontend dev server"
    echo "  build     Build frontend for production"
    echo "  help      Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BACKEND_PORT   Backend server port (default: 8000)"
    echo "  FRONTEND_PORT  Frontend dev server port (default: 5173)"
    echo ""
}

# Run backend server
run_backend() {
    local mode=$1
    echo -e "${BLUE}Starting backend server...${NC}"
    cd "$SCRIPT_DIR/backend"
    source venv/bin/activate

    if [ "$mode" = "prod" ]; then
        echo -e "${GREEN}Backend running at http://localhost:$BACKEND_PORT${NC}"
        uvicorn main:app --host 0.0.0.0 --port "$BACKEND_PORT"
    else
        echo -e "${GREEN}Backend running at http://localhost:$BACKEND_PORT (dev mode with auto-reload)${NC}"
        uvicorn main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT"
    fi
}

# Run frontend dev server
run_frontend_dev() {
    echo -e "${BLUE}Starting frontend dev server...${NC}"
    cd "$SCRIPT_DIR/frontend"
    echo -e "${GREEN}Frontend running at http://localhost:$FRONTEND_PORT${NC}"
    npm run dev -- --port "$FRONTEND_PORT"
}

# Build frontend for production
build_frontend() {
    echo -e "${BLUE}Building frontend for production...${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm run build
    echo -e "${GREEN}Frontend built successfully! Output in frontend/dist/${NC}"
}

# Run in development mode (both backend and frontend)
run_dev() {
    echo "========================================"
    echo -e "  ${GREEN}Development Mode${NC}"
    echo "========================================"
    echo ""
    echo -e "Backend:  http://localhost:$BACKEND_PORT"
    echo -e "Frontend: http://localhost:$FRONTEND_PORT"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
    echo ""

    # Trap to kill all background processes on exit
    trap 'echo ""; echo "Stopping servers..."; kill 0; exit' SIGINT SIGTERM

    # Start backend in background
    (
        cd "$SCRIPT_DIR/backend"
        source venv/bin/activate
        uvicorn main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT" 2>&1 | sed 's/^/[backend] /'
    ) &

    # Small delay to let backend start first
    sleep 1

    # Start frontend in background
    (
        cd "$SCRIPT_DIR/frontend"
        npm run dev -- --port "$FRONTEND_PORT" 2>&1 | sed 's/^/[frontend] /'
    ) &

    # Wait for all background processes
    wait
}

# Run in production mode
run_prod() {
    echo "========================================"
    echo -e "  ${GREEN}Production Mode${NC}"
    echo "========================================"
    echo ""

    # Build frontend first
    build_frontend
    echo ""

    echo -e "${YELLOW}Note: In production, serve frontend/dist/ using a web server (nginx, etc.)${NC}"
    echo -e "${YELLOW}      or use a reverse proxy to serve both frontend and backend.${NC}"
    echo ""
    echo -e "Starting backend server at http://localhost:$BACKEND_PORT"
    echo ""

    # Run backend in production mode
    run_backend "prod"
}

# Check if setup has been run
check_setup() {
    if [ ! -d "$SCRIPT_DIR/backend/venv" ]; then
        echo -e "${RED}[ERROR]${NC} Backend virtual environment not found."
        echo "Please run ./setup.sh first."
        exit 1
    fi

    if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
        echo -e "${RED}[ERROR]${NC} Frontend dependencies not installed."
        echo "Please run ./setup.sh first."
        exit 1
    fi
}

# Main
case "${1:-dev}" in
    dev)
        check_setup
        run_dev
        ;;
    prod)
        check_setup
        run_prod
        ;;
    backend)
        check_setup
        run_backend "${2:-dev}"
        ;;
    frontend)
        check_setup
        run_frontend_dev
        ;;
    build)
        check_setup
        build_frontend
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        usage
        exit 1
        ;;
esac
