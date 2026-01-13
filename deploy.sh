#!/bin/bash

# أوامر تشغيل COICOP Classification System على جهاز جديد

echo "═══════════════════════════════════════════════════"
echo "  COICOP Classification System - Docker Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# 1. تسجيل الدخول
echo "📝 خطوة 1: تسجيل الدخول إلى Docker Hub..."
echo "YOUR_DOCKER_TOKEN_HERE" | docker login -u radhyah --password-stdin

if [ $? -eq 0 ]; then
    echo "✅ تم تسجيل الدخول بنجاح"
else
    echo "❌ فشل تسجيل الدخول"
    exit 1
fi

echo ""
echo "📦 خطوة 2: سحب الصور من Docker Hub..."
docker pull radhyah/coicop-backend:latest
docker pull radhyah/coicop-frontend:latest

echo ""
echo "🚀 خطوة 3: تشغيل المشروع..."
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ تم تشغيل المشروع بنجاح!"
echo ""
echo "🌐 الروابط:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "═══════════════════════════════════════════════════"
