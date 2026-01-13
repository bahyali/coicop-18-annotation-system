#!/bin/bash
# COICOP Dashboard Launcher

cd "$(dirname "$0")"

echo "======================================"
echo "  COICOP Dashboard"
echo "======================================"
echo ""
echo "Starting dashboard server on port 7896..."
echo ""

python3 server.py
