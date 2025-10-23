# نشر التطبيق على Render

## خطوات النشر:

### 1. إعداد Repository
```bash
git add .
git commit -m "Prepare for Render deployment"
git push
```

### 2. إعداد Render Service
1. اذهب إلى [Render Dashboard](https://dashboard.render.com/)
2. اضغط "New Web Service"
3. اربط GitHub repository
4. استخدم الإعدادات التالية:

**Build Settings:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

### 3. Environment Variables في Render
```env
NODE_ENV=production
FIREBASE_PROJECT_ID=bibleverseapp-d43ac
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"bibleverseapp-d43ac",...}
```

### 4. الحصول على Firebase Service Account
1. Firebase Console → Project Settings → Service Accounts
2. "Generate new private key"
3. انسخ محتوى الملف كله كـ JSON في سطر واحد
4. ضعه في `FIREBASE_SERVICE_ACCOUNT`

### 5. اختبار النشر
- الرابط سيكون: `https://your-app-name.onrender.com`
- تحقق من logs في Render dashboard

## ملاحظات مهمة:
- Render يستخدم `PORT` environment variable تلقائياً
- Firebase Service Account يجب أن يكون JSON صحيح
- التطبيق يدعم العمل بدون database إذا لم يوجد
- Free tier على Render قد يكون بطيء في البداية

## تشغيل محلي للاختبار:
```bash
npm run build
npm run start
```
