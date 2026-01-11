#!/bin/bash

# COICOP Classification Validation System - Setup Script
# This script installs all dependencies for both backend and frontend

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  Annotation System - Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_requirements() {
    echo "Checking requirements..."

    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1)
        echo -e "${GREEN}[OK]${NC} $PYTHON_VERSION"
    else
        echo -e "${RED}[ERROR]${NC} Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}[OK]${NC} Node.js $NODE_VERSION"
    else
        echo -e "${RED}[ERROR]${NC} Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}[OK]${NC} npm $NPM_VERSION"
    else
        echo -e "${RED}[ERROR]${NC} npm is not installed. Please install npm."
        exit 1
    fi

    echo ""
}

# Setup backend
setup_backend() {
    echo "========================================"
    echo "  Setting up Backend"
    echo "========================================"

    cd "$SCRIPT_DIR/backend"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
        echo -e "${GREEN}[OK]${NC} Virtual environment created"
    else
        echo -e "${YELLOW}[SKIP]${NC} Virtual environment already exists"
    fi

    # Activate virtual environment and install dependencies
    echo "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    echo -e "${GREEN}[OK]${NC} Python dependencies installed"

    deactivate
    cd "$SCRIPT_DIR"
    echo ""
}

# Setup frontend
setup_frontend() {
    echo "========================================"
    echo "  Setting up Frontend"
    echo "========================================"

    cd "$SCRIPT_DIR/frontend"

    # Install npm dependencies
    echo "Installing npm dependencies..."
    npm install
    echo -e "${GREEN}[OK]${NC} npm dependencies installed"

    cd "$SCRIPT_DIR"
    echo ""
}

# Main
check_requirements
setup_backend
setup_frontend

echo "========================================"
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "========================================"
echo ""
echo "To run the application:"
echo "  Development mode:  ./run.sh dev"
echo "  Production mode:   ./run.sh prod"
echo ""
