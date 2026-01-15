#!/bin/bash

# =============================================================================
# COICOP-18 Annotation System - Docker Startup Script
# =============================================================================
# هذا السكريبت يقوم بـ:
# 1. إيقاف وحذف جميع الحاويات القديمة
# 2. حذف جميع البيانات القديمة (volumes)
# 3. سحب أحدث الصور من Docker Hub
# 4. تشغيل النظام بالكامل من جديد
#
# البورتات:
# - Backend:  http://localhost:8000
# - Frontend: http://localhost:8080
# - Dashboard: http://localhost:7896
# =============================================================================

echo "=========================================="
echo "  COICOP-18 System - Fresh Start"
echo "=========================================="
echo ""

# الانتقال إلى المجلد الصحيح
cd "$(dirname "$0")"

echo "🛑 Step 1: Stopping all containers..."
docker-compose -f docker-compose.hub.yml down

echo ""
echo "🗑️  Step 2: Removing old data (volumes)..."
docker-compose -f docker-compose.hub.yml down -v

echo ""
echo "🧹 Step 3: Cleaning up old containers..."
docker rm -f coicop-backend coicop-frontend coicop-dashboard 2>/dev/null || true

echo ""
echo "📥 Step 4: Pulling latest images from Docker Hub..."
docker pull radhyah/coicop-backend:latest
docker pull radhyah/coicop-frontend:latest
docker pull radhyah/coicop-dashboard:latest

echo ""
echo "🚀 Step 5: Starting all services..."
docker-compose -f docker-compose.hub.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ Done! System is starting up..."
echo ""
echo "=========================================="
echo "  Access URLs:"
echo "=========================================="
echo "  Backend:   http://localhost:8000"
echo "  Frontend:  http://localhost:8080"
echo "  Dashboard: http://localhost:7896"
echo "  API Docs:  http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "📊 Check status with:"
echo "  docker-compose -f docker-compose.hub.yml ps"
echo ""
echo "📜 View logs with:"
echo "  docker-compose -f docker-compose.hub.yml logs -f"
echo ""
