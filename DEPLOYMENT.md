# تعليمات تشغيل المشروع من Docker Hub

## المتطلبات
- Docker و Docker Compose مثبتان على الجهاز
- حساب Docker Hub (radhyah)

## خطوات التشغيل على جهاز جديد

### 1. تسجيل الدخول إلى Docker Hub

قبل سحب الصور الخاصة، يجب تسجيل الدخول:

```bash
docker login -u radhyah
```

سيطلب منك إدخال Password أو Access Token. استخدم:
```
YOUR_DOCKER_TOKEN_HERE
```

### 2. إنشاء ملف docker-compose.yml

أنشئ مجلد جديد وأنشئ بداخله ملف `docker-compose.yml` بالمحتوى التالي:

```yaml
services:
  backend:
    image: radhyah/coicop-backend:latest
    ports:
      - "8000:8000"
    volumes:
      - ./database.db:/app/database.db
      - ./dataset.csv:/app/dataset.csv
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped

  frontend:
    image: radhyah/coicop-frontend:latest
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 3. تحضير الملفات المطلوبة

تأكد من وجود الملفات التالية في نفس المجلد:
- `database.db` - قاعدة البيانات (أو سيتم إنشاؤها تلقائياً)
- `dataset.csv` - ملف البيانات

إذا لم تكن موجودة، يمكن نسخها من المشروع الأصلي.

### 4. تشغيل المشروع

```bash
docker-compose up -d
```

### 5. الوصول إلى التطبيق

- **الواجهة الأمامية:** http://localhost:8080
- **API الخلفية:** http://localhost:8000
- **وثائق API:** http://localhost:8000/docs

## الأوامر المفيدة

### إيقاف المشروع
```bash
docker-compose down
```

### عرض السجلات (Logs)
```bash
docker-compose logs -f
```

### عرض سجلات خدمة معينة
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### إعادة تشغيل الخدمات
```bash
docker-compose restart
```

### تحديث الصور إلى أحدث إصدار
```bash
docker-compose pull
docker-compose up -d
```

## ملاحظات مهمة

1. **الصور خاصة (Private):** تحتاج لتسجيل دخول بحساب radhyah لسحب الصور
2. **البيانات المستمرة:** البيانات محفوظة في `database.db` على الجهاز المضيف
3. **المنافذ:** تأكد من أن المنفذين 8080 و 8000 غير مستخدمين

## تغيير المنافذ (اختياري)

إذا أردت استخدام منافذ مختلفة، عدّل في `docker-compose.yml`:

```yaml
ports:
  - "8080:80"      # استخدام منفذ 8080 بدلاً من 80
  - "8001:8000"    # استخدام منفذ 8001 بدلاً من 8000
```

## استكشاف الأخطاء

### خطأ في الاتصال بـ Backend
تأكد من أن Backend يعمل:
```bash
curl http://localhost:8000/api/stats
```

### خطأ في تسجيل الدخول
تأكد من صحة Access Token أو كلمة المرور.

### الصور لا تُسحب
تحقق من تسجيل الدخول:
```bash
docker logout
docker login -u radhyah
```
