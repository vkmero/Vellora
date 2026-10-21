# Vellora Deployment Guide

## 1. Cloud Architecture

- **Database**: Neon Serverless PostgreSQL (SSL required)
- **Backend API**: Render, Railway, or Fly.io (Python 3.11+, Uvicorn)
- **Frontend SPA**: Vercel or Netlify (Vite static build)

---

## 2. Neon PostgreSQL Setup

1. Create a project at [Neon](https://neon.tech).
2. Create database `vellora`.
3. Copy the pooled connection string with SSL:
   ```text
   postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/vellora?sslmode=require
   ```
4. Set this as `DATABASE_URL` in your backend environment variables.

---

## 3. Backend Deployment (Render / Railway)

### Environment Variables
```env
APP_NAME=Vellora
APP_ENV=production
APP_DEBUG=false
DATABASE_URL=postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/vellora?sslmode=require
JWT_SECRET=<set-a-unique-random-secret-of-at-least-32-characters>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
MAX_UPLOAD_SIZE_MB=50
FRONTEND_URL=https://vellora.vercel.app
ALLOWED_ORIGINS=https://vellora.vercel.app
BOOTSTRAP_ADMIN_NAME=Vellora Admin
BOOTSTRAP_ADMIN_EMAIL=admin@vellora.io
BOOTSTRAP_ADMIN_PASSWORD=<set-a-unique-strong-password>
```

### Build & Start Commands
- **Build Command**: `pip install -r requirements.txt && python -m alembic upgrade head`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 4. Frontend Deployment (Vercel / Netlify)

### Environment Variables
```env
VITE_API_URL=https://vellora-backend.onrender.com/api
```

### Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Rewrite Rules**: SPA fallback to `index.html` on 404.


## Secret safety

- Never commit `backend/.env` or paste production secrets into source files.
- Set `JWT_SECRET` and `BOOTSTRAP_ADMIN_PASSWORD` through the hosting provider's environment-variable settings, not in Git.
- Generate a unique JWT secret (at least 32 characters) for production. Do not reuse the example value or a local development secret.
- Do not commit uploaded datasets or generated reports; the repository keeps only `.gitkeep` placeholders in those folders.
