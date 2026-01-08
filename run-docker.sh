#!/bin/bash

# COICOP Classification Validation System - Docker Hub Runner
# Usage: ./run-docker.sh [up|down|pull|logs|help]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default ports
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-80}

# Compose file
COMPOSE_FILE="docker-compose.hub.yml"

# Check if running from script directory or use URL
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [ -f "$SCRIPT_DIR/$COMPOSE_FILE" ]; then
    COMPOSE_PATH="$SCRIPT_DIR/$COMPOSE_FILE"
else
    # Download compose file if not present
    COMPOSE_PATH="$COMPOSE_FILE"
    if [ ! -f "$COMPOSE_PATH" ]; then
        echo -e "${BLUE}Downloading docker-compose.hub.yml...${NC}"
        curl -fsSL "https://raw.githubusercontent.com/bahyali/coicop-validation-system/main/docker-compose.hub.yml" -o "$COMPOSE_PATH" 2>/dev/null || {
            echo -e "${YELLOW}Could not download compose file. Creating inline...${NC}"
            cat > "$COMPOSE_PATH" << 'EOF'
services:
  backend:
    image: bahyali/coicop-validation-backend:latest
    ports:
      - "${BACKEND_PORT:-8000}:8000"
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped

  frontend:
    image: bahyali/coicop-validation-frontend:latest
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend
    restart: unless-stopped
EOF
        }
    fi
fi

usage() {
    echo "COICOP Classification Validation System - Docker Runner"
    echo ""
    echo "Usage: ./run-docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up        Start the application (default)"
    echo "  down      Stop the application"
    echo "  pull      Pull latest images from Docker Hub"
    echo "  logs      View application logs"
    echo "  restart   Restart the application"
    echo "  status    Show container status"
    echo "  help      Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BACKEND_PORT   Backend server port (default: 8000)"
    echo "  FRONTEND_PORT  Frontend server port (default: 80)"
    echo ""
    echo "Examples:"
    echo "  ./run-docker.sh up"
    echo "  FRONTEND_PORT=8080 ./run-docker.sh up"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Docker daemon is not running. Please start Docker."
        exit 1
    fi
}

start_app() {
    echo -e "${BLUE}Starting COICOP Validation System...${NC}"
    echo ""
    BACKEND_PORT=$BACKEND_PORT FRONTEND_PORT=$FRONTEND_PORT docker compose -f "$COMPOSE_PATH" up -d
    echo ""
    echo -e "${GREEN}Application started!${NC}"
    echo ""
    echo "Access the application at:"
    echo -e "  Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo ""
    echo "Run './run-docker.sh logs' to view logs"
    echo "Run './run-docker.sh down' to stop"
}

stop_app() {
    echo -e "${BLUE}Stopping COICOP Validation System...${NC}"
    docker compose -f "$COMPOSE_PATH" down
    echo -e "${GREEN}Application stopped.${NC}"
}

pull_images() {
    echo -e "${BLUE}Pulling latest images from Docker Hub...${NC}"
    docker compose -f "$COMPOSE_PATH" pull
    echo -e "${GREEN}Images updated.${NC}"
}

show_logs() {
    docker compose -f "$COMPOSE_PATH" logs -f
}

restart_app() {
    echo -e "${BLUE}Restarting COICOP Validation System...${NC}"
    docker compose -f "$COMPOSE_PATH" restart
    echo -e "${GREEN}Application restarted.${NC}"
}

show_status() {
    docker compose -f "$COMPOSE_PATH" ps
}

# Main
check_docker

case "${1:-up}" in
    up|start)
        start_app
        ;;
    down|stop)
        stop_app
        ;;
    pull|update)
        pull_images
        ;;
    logs)
        show_logs
        ;;
    restart)
        restart_app
        ;;
    status|ps)
        show_status
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
