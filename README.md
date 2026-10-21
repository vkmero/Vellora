# Vellora — Intelligent Data Quality, Analytics & Insight Generation Platform

[![Frontend Build](https://img.shields.io/badge/Frontend-Vite%20%2B%20React-cyan.svg)](https://vitejs.dev/)
[![Backend Engine](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-blue.svg)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-00e699.svg)](https://neon.tech/)
[![ML](https://img.shields.io/badge/ML-Scikit--Learn-orange.svg)](https://scikit-learn.org/)

Vellora is an enterprise-grade platform designed to turn raw, unformatted business data into pristine intelligence. It unifies structural dataset profiling, multidimensional quality scoring, interactive cleansing previews, managerial review gates, exploratory data analysis (EDA), automated business insights, and predictive machine learning.

---

## Architecture & Workflow

```text
User Authentication (JWT + Bcrypt)
        ↓
Role-Based Dashboard (Analyst / Manager / Admin)
        ↓
Dataset Ingestion (Drag-and-drop CSV & XLSX)
        ↓
Automatic Structural Profiling & Quality Scoring
        ↓
Interactive Data Cleansing & Impact Preview
        ↓
Manager Review Gate (Approve / Reject / Changes)
        ↓
Comparative Revalidation Audit (Before vs. After)
        ↓
Exploratory Analytics (EDA, Correlations, Histograms)
        ↓
Interactive Visualizations (Dynamic Recharts)
        ↓
Algorithmic Business Insights (Evidence + Actions)
        ↓
Predictive Analytics (Scikit-Learn Regression & Classification)
        ↓
Executive Dossier Generation (ReportLab PDF, Excel, CSV)
        ↓
Tamper-Evident System Audit Trail
```

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Axios, Recharts, Lucide React, Modern Glassmorphism CSS.
- **Backend**: FastAPI, Uvicorn, Pydantic v2, Pydantic Settings, SQLAlchemy 2.0, Alembic, psycopg 3.
- **Data & Statistical Engines**: Pandas, NumPy, OpenPyXL, Scikit-Learn.
- **Reporting Engine**: ReportLab (vector PDF generation), OpenPyXL (Excel workbooks).
- **Database**: PostgreSQL (Production Target: Neon Serverless PostgreSQL with SSL).

---

## Project Structure

```text
Vellora/
├── backend/
│   ├── alembic/              # Database migration version scripts
│   ├── app/
│   │   ├── models/           # 14 SQLAlchemy ORM entities
│   │   ├── routes/           # 18 Modular FastAPI routers
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   ├── scripts/          # Database bootstrap & sample generator
│   │   ├── services/         # Domain business logic & ML estimators
│   │   ├── utils/            # Statistical helpers & quality calculators
│   │   ├── config.py         # Pydantic settings & CORS configuration
│   │   ├── database.py       # SQLAlchemy engine & session dependency
│   │   ├── dependencies.py   # RBAC & authentication dependencies
│   │   └── main.py           # FastAPI entrypoint
│   ├── reports/              # PDF & Excel compiled report storage
│   ├── tests/                # Pytest integration & unit test suite
│   ├── uploads/              # Immutable original & cleaned datasets
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── api/              # Centralized Axios API services
│   │   ├── components/       # Common reusable glassmorphism components
│   │   ├── context/          # AuthContext & ThemeContext providers
│   │   ├── layouts/          # AppLayout & AuthLayout
│   │   ├── pages/            # Analyst, Manager, Admin, and Auth pages
│   │   ├── styles/           # Global design system & theme variables
│   │   ├── App.jsx           # Master route switch with RBAC guards
│   │   └── main.jsx          # Vite React mounting point
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite build configuration
│   └── index.html            # HTML template
│
├── docs/                     # Technical specifications
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── authentication.md
│   ├── workflow.md
│   └── deployment.md
│
├── README.md
└── .gitignore
```

---

## Local Setup & Development

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL database (or free [Neon PostgreSQL](https://neon.tech) instance)

### 1. Database Configuration
Create a `.env` file inside `backend/`:
```bash
cp backend/.env.example backend/.env
```
Fill in your Neon PostgreSQL database URL:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=your-secure-random-jwt-secret-minimum-32-chars
```

Run database migrations:
```bash
cd backend
python -m alembic upgrade head
```

*(Optional)* Create default Admin account:
```bash
python -m app.scripts.bootstrap
```

### 2. Run Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at: `http://localhost:8000/api/docs`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Role-Based Access Control & Dual Usage Patterns

Vellora supports two unified usage patterns:
1. **Independent Analytics**: Normal registered users (Analysts) can ingest, profile, clean, analyze, visualize, run ML models, and generate deliverables independently without requiring administrative or managerial intervention.
2. **Controlled Collaboration**: Projects configured with mandatory manager governance require Manager review, diff inspection, and promotion sign-off before downstream delivery.

### User Roles & Permissions
- **Analyst** (`/dashboard`): Upload datasets, profile columns, detect anomalies, execute cleaning, view validated analytics, build charts, synthesize insights, train ML models, generate reports, and request Manager elevation.
- **Manager** (`/manager`): Review analyst submissions, inspect transformation diffs, approve or reject datasets (with feedback), deliver client deliverables via Gmail API, and monitor team data health.
- **Admin** (`/admin`): Root console, user role assignment, Manager access request approval/rejection, platform-wide dataset monitoring, and security audit logs.

### Manager Access Request & Governance Workflow
Analysts can apply for Manager Governance access at `/manager-request` or directly from the navbar and login screen.
- Requests record requester details, organization/team, and business justification.
- Admins inspect and approve, reject, or request changes at `/admin/users` under the "Manager Access Applications" tab.
- Anti-self-approval is strictly enforced on the server.
- Upon approval, the user's role is upgraded to `manager` and audit notifications are logged.

---

## Premium Glassmorphic Authentication & Background Image System

The authentication experience (Login, Register, Forgot Password, Reset Password) features a glassmorphic interface:
- **Design Tokens**: Deep Navy (`#10243A`), Dark Navy (`#173B57`), Cyan (`#18C6D9`), Teal (`#18B6A4`), Blue (`#3478F6`).
- **Replaceable Wallpapers**: Wallpaper assets are located in `frontend/public/images/auth/`:
  - `login-bg.jpg`
  - `register-bg.jpg`
  - `forgot-password-bg.jpg`
  - `reset-password-bg.jpg`
  *(Configured centrally in `frontend/src/config/authImages.js` — replace the image files to change backgrounds without touching code).*
- **Icon Alignment & Geometry**: Centered Lucide icons, accessible password visibility toggles (`Eye`/`EyeOff`) nested inside input boundaries without layout shifting or text overlap.
- **OAuth Providers**: Integrated Google, GitHub, and LinkedIn social buttons with server-side validation and clear setup guidance.

---

## Verification & Testing

Execute backend test suite:
```bash
cd backend
python -m pytest
```

Execute frontend production build:
```bash
cd frontend
npm run build
```

---


## Security before publishing

- Keep `backend/.env` local; it is intentionally excluded from Git. Start from `backend/.env.example` and set real values only in your local environment or hosting dashboard.
- Use a unique production `JWT_SECRET` with at least 32 random characters and a unique bootstrap-admin password.
- Uploaded original/cleaned datasets and generated reports are local runtime artifacts and must not be committed.
- Configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, and any optional mail/OAuth credentials in the backend host settings.

## Production Deployment

- **Database**: [Neon PostgreSQL](https://neon.tech)
- **Backend API**: Render, Railway, or Fly.io
- **Frontend SPA**: Vercel or Netlify

See [docs/deployment.md](docs/deployment.md) for full deployment instructions.
