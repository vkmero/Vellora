# Vellora Authentication & Authorization

## 1. Single Shared Authentication Architecture

Vellora implements a unified, role-based authentication model:
- All users log in via `/login`.
- Registration via `/register` strictly issues the `analyst` role. Self-registration as Manager or Admin is strictly prevented.
- Promotion to `manager` or `admin` is managed through the Admin Console or secure bootstrap scripts.

## 2. Token Specification & Security
- **Algorithm**: HMAC SHA-256 (`HS256`)
- **Format**: Standard JWT (`sub` contains user ID, `exp` sets expiration)
- **Token Expiry**: Default 60 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Password Encryption**: Bcrypt hashing with salted iterations.

## 3. Role-Based Access Control Matrix

| Capability | Analyst | Manager | Admin |
|---|:---:|:---:|:---:|
| Ingest Datasets (CSV/XLSX) | Yes | Yes | Yes |
| Run Profiling & Quality Scoring | Yes | Yes | Yes |
| Execute Data Cleansing | Yes | Yes | Yes |
| Submit for Manager Approval | Yes | — | — |
| Approve / Reject Datasets | — | Yes | Yes |
| Revalidate Quality Scores | Yes | Yes | Yes |
| Run Analytics & EDA | Yes* | Yes | Yes |
| Interactive Visualizations | Yes* | Yes | Yes |
| Algorithmic Insights | Yes* | Yes | Yes |
| Train ML Predictors | Yes* | Yes | Yes |
| Compile Reports (PDF/Excel) | Yes | Yes | Yes |
| Modify User Roles & Status | — | — | Yes |
| Access Global Audit Logs | — | — | Yes |

*\* Prerequisite: Dataset must be validated or approved prior to unlocking analytics and predictive ML.*

## 4. Frontend Route Guards
Frontend React routes are guarded via `<ProtectedRoute allowedRoles={[...]}>`. Unauthenticated requests redirect to `/login?expired=1`. Role escalations attempt without authorization will redirect users to their respective dashboards. Backend FastAPI endpoints independently enforce security dependencies (`get_current_user`, `require_manager`, `require_admin`).
