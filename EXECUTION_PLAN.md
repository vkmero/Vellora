# VELLORA — COMPLETE EXECUTION PLAN & USER RUNBOOK

> **Platform**: Vellora — Intelligent Data Quality, Analytics & Insight Generation Platform  
> **Workspace**: `C:\Users\mithi\OneDrive\Desktop\Vellora`  
> **Target Stack**: FastAPI (Python 3.11+) + PostgreSQL (Neon Cloud) + React 18 (Vite & Tailwind CSS) + Scikit-Learn

---

## 1. Quick Start & Credentials

The database has already been seeded with three pre-configured accounts corresponding to each role in the governance model:

| Role | Email | Password | Primary Workspace Route | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Data Analyst** | `analyst@vellora.io` | `Password@123` | `/dashboard` | Dataset ingestion, profiling, cleaning, EDA, insights, ML |
| **Governance Manager** | `manager@vellora.io` | `Password@123` | `/manager` | Decision gate, diff inspection, approval / rejection sign-off |
| **System Administrator** | `admin@vellora.io` | `Password@123` | `/admin` | Root console, user role management, system audit trail |

*(Note: You can also register a new analyst account at any time via `/register`.)*

A sample messy test dataset has been generated and placed in the project root:
- **Sample File**: `C:\Users\mithi\OneDrive\Desktop\Vellora\sample_sales.csv` (contains missing cells, duplicate IDs, casing inconsistencies, and numeric outliers).

---

## 2. Starting the Application

Open two separate terminal windows (PowerShell or Bash) inside `C:\Users\mithi\OneDrive\Desktop\Vellora`:

### Terminal 1: Start Backend API (Port 8000)
```powershell
cd C:\Users\mithi\OneDrive\Desktop\Vellora\backend
python -m uvicorn app.main:app --reload --port 8000
```
- **Backend API URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/api/docs`
- **ReDoc Technical Specs**: `http://localhost:8000/api/redoc`

### Terminal 2: Start Frontend Application (Port 5173)
```powershell
cd C:\Users\mithi\OneDrive\Desktop\Vellora\frontend
npm run dev
```
- **Web Interface URL**: `http://localhost:5173`

---

## 3. End-to-End Walkthrough (Step-by-Step)

The platform follows a strict, server-enforced lifecycle. Follow these steps to experience the complete workflow:

```text
Ingestion → Profiling → Quality Audit → Cleaning → Manager Approval → Revalidation → Analytics → Visuals → Insights → ML → Reports
```

---

### Step 1: Ingestion & Structural Profiling
1. Open your browser at `http://localhost:5173/login`.
2. Sign in with the **Analyst** credentials:
   - **Email**: `analyst@vellora.io`
   - **Password**: `Password@123`
3. Click **"Ingest Dataset"** or navigate to `http://localhost:5173/upload`.
4. Drag and drop `sample_sales.csv` (located in the project root) into the upload dropzone.
5. Click **"Upload & Run Audit"**.
6. **What happens**: The file is streamed, MIME-validated, stored securely, and automatically profiled. You will be redirected to the **Dataset Observatory** (`/datasets/:id`).
7. Inspect the **"Data Records Preview"** and **"Structural Profile"** tabs to view inferred data types, null counts, and candidate primary keys.

---

### Step 2: Dimensional Data Quality Audit
1. Click **"Quality Issues"** or navigate to `/datasets/:id/quality`.
2. Inspect the **Data Health Center**:
   - **Quality Score**: View the composite score (0–100) calculated from four dimensions.
   - **4 Dimension Cards**: Completeness, Uniqueness, Validity, and Consistency with backend explainability strings.
   - **Detected Anomalies**: View granular issue diagnoses (e.g., missing values in `quantity`, duplicate `order_id` records).

---

### Step 3: Interactive Data Cleaning & Sandbox Diffs
1. Click **"Launch Cleaning Studio"** or navigate to `/datasets/:id/clean`.
2. Under **"Configure Remediation Operation"**:
   - Select operation: **"Remove Exact Duplicates"**.
   - Click **"Preview Impact"** — view the **Pre-Execution Diff Simulation** (`Rows Before`, `Rows After`, `Affected Rows`).
   - Click **"Confirm & Execute"** — the dataset is transformed in place, preserving raw isolation.
3. Apply a second transformation:
   - Select operation: **"Mean Imputation (Numeric)"**.
   - Target Column: Select `quantity` or `revenue`.
   - Click **"Preview Impact"** $\rightarrow$ **"Confirm & Execute"**.
4. View the **Applied Cleansing Log** on the right sidebar.

---

### Step 4: Submission to Manager Governance Gate
1. On the right sidebar of the Cleaning Studio, find the **"Manager Governance Gate"** card.
2. Click **"Submit for Manager Approval"**.
3. **What happens**: The dataset status transitions to `pending_approval`. The backend enforces that unapproved datasets cannot skip ahead to downstream analytics.

---

### Step 5: Manager Review & Authorization
1. Click **Sign Out** from the top right user menu.
2. Sign in with the **Manager** credentials:
   - **Email**: `manager@vellora.io`
   - **Password**: `Password@123`
3. You will land on the **Manager Governance Console** (`/manager`).
4. Click **"Pending Approvals"** or navigate to `/manager/approvals`.
5. Click **"Audit & Decide"** on the newly submitted dataset case.
6. In the **Governance Review Chamber** (`/manager/approvals/:id`):
   - Review the applied cleaning transformations and detected issues.
   - Type an optional review comment in the textarea.
   - Click **"Approve & Authorize Promotion"** (Emerald button).
7. The dataset status is now officially `approved`.

---

### Step 6: Trust Verification & Revalidation Checkpoint
1. Sign out and log back in as **Analyst** (`analyst@vellora.io`).
2. Navigate to **Revalidation** (`/datasets/:id/validate` or `/validation`).
3. Click **"Revalidate Now"**:
   - Inspect the **Before $\rightarrow$ Remediation $\rightarrow$ After** score improvement banner (e.g., Quality 68 $\rightarrow$ Quality 94).
   - Review the comparison cards for **Missing Values Remediated**, **Duplicates Removed**, and **Outliers Handled**.
4. Click **"Unlock Analytics & EDA"**.

---

### Step 7: Exploratory Data Analysis (EDA)
1. In the **Analytical Observatory** (`/datasets/:id/analytics`):
   - Click **"Compute EDA"**.
   - **Descriptive Statistical Moments & Dispersion**: Inspect the table showing Mean, Median, Standard Deviation, Min, Max, Interquartile Range (IQR), Skewness, and Outlier Counts.
   - **Histogram Distributions**: Switch between columns using the dropdown to inspect frequency binning charts.
   - **Correlation Matrix**: Examine pairwise correlation coefficients with color-coded strengths, switchable between **Pearson (Linear)** and **Spearman (Rank)** correlation.

---

### Step 8: Visual Intelligence Studio (Interactive Chart Explorer)
1. Navigate to **Visualizations** (`/visualizations` or `/datasets/:id/visualize`).
2. **1-Click Chart Recommendations**:
   - Inspect the **Intelligent Recommendations** cards automatically generated for your dataset columns (e.g., Temporal Trajectory, Category Concentration, Bivariate Scatter, Heatmap).
   - Click **"Load Chart"** on any recommendation to render it immediately.
3. **Interactive Chart Configuration**:
   - **Chart Archetype**: Choose between `Bar`, `Horizontal Bar`, `Line`, `Area`, `Donut/Pie`, `Scatter Plot`, `Histogram`, `Box Plot`, or `Correlation Heatmap`.
   - **Axes**: Select X and Y columns with automatic data type indicators (`[NUM]`, `[CAT]`, `[DAT]`).
   - **Aggregation**: Choose `SUM`, `MEAN`, `MEDIAN`, `COUNT`, `MIN`, `MAX`, or `STD DEV`.
   - **Group By**: Split series by a secondary categorical dimension.
   - **Filters & Sorting**: Filter records on the fly and order by value or category labels.
4. Click **"Render Chart Canvas"**.
5. Inspect the **Statistical Interpretation** card below the chart explaining findings, dominant shares, and correlation strength.
6. **Data & Image Export**: Use the top-right toolbar buttons to export chart data as **CSV** or **JSON**, or toggle **Fullscreen View**.
7. Click **"Save to Dossier History"** to archive the chart snapshot.

---

### Step 9: Decision Intelligence & Algorithmic Business Insights
1. Navigate to **Business Insights** (`/insights` or `/datasets/:id/insights`).
2. Click **"Synthesize Insights"** to trigger deterministic Python analysis.
3. Inspect the resulting **Decision Intelligence Dashboard**:
   - **Executive Summary KPIs**: Total findings, Critical/High risks, Strategic opportunities, and robust sample confidence percentage.
   - **Category Filters**: Filter across `Performance`, `Trend`, `Distribution`, `Relationship`, `Quality`, and `Opportunity`.
   - **Insight Cards**: Each card displays the finding title, severity pill, confidence badge, supporting metric pill, and inline empirical chart previews.
   - **Strategic Recommendations**: Prescriptive operational actions for decision makers.
   - **Statistical Evidence Drawer**: Expand to inspect exact calculated values ($N$, variances, skewness, bounds) and plain-language interpretations.
4. **Dossier Export**: Click **"PDF Dossier"** to compile and download a ReportLab PDF executive report, or click **"CSV"** to export raw findings.

---

### Step 10: Predictive Intelligence Lab (Scikit-Learn ML)
1. Navigate to **Predictions (ML)** (`/predictions` or `/datasets/:id/predict`).
2. Configure model architecture:
   - **Problem Type**: Choose `Regression` (or `Classification`).
   - **Estimator Algorithm**: Select `Random Forest Regressor (Ensemble)` or `Linear Regression`.
   - **Target Column (y)**: Select `revenue` (or `profit`).
   - **Predictor Features (X)**: Check `price`, `quantity`, `discount`, `cost`.
3. Click **"Fit & Benchmark Estimator"**.
4. Inspect results:
   - **Test Metrics**: Holdout MAE, RMSE, and $R^2$ Score (or Accuracy / Precision / Recall / F1).
   - **Algorithm Benchmark & Evaluation Table**: Live ranking comparison between Linear, Decision Tree, and Random Forest models.
   - **Out-of-Sample Predictions Table**: Actual vs predicted sample values with variance deltas.

---

### Step 11: Executive Dossier & Report Generation
1. Navigate to **Reports Dossier** (`/reports`).
2. Under **"Compile New Executive Dossier"**:
   - Select Scope: `Complete Vellora Dossier (Quality + Insights)`.
   - Select Export Format: `PDF Document (ReportLab Engine)` or `Excel Workbook (.XLSX)`.
3. Click **"Compile & Save Report"**.
4. Find the generated report in the **Generated Dossier Archive** table below.
5. Click **"Download"** — the authenticated file download triggers directly in your browser.

---

### Step 12: System Observatory & Administration
1. Sign out and log in as **Admin**:
   - **Email**: `admin@vellora.io`
   - **Password**: `Password@123`
2. **Vellora Control Center** (`/admin`):
   - View global statistics: Total Users, Total Datasets, EDA Analyses Run, Average Quality, and Audit Events.
3. **User Directory** (`/admin/users`):
   - View the directory of all users.
   - Promote/demote any user's role (Analyst $\leftrightarrow$ Manager $\leftrightarrow$ Admin) using the live dropdown.
   - Activate/deactivate accounts.
4. **Audit Observatory** (`/admin/audit-logs`):
   - Filter and inspect tamper-evident audit records by security action (e.g., `LOGIN`, `UPLOAD_DATASET`, `CLEAN_DATASET`, `APPROVE_DATASET`).

---

### Step 1b: Manager Access Request & Promotion Workflow
1. If an Analyst requires managerial governance capabilities (to inspect diffs, approve audit workflows, or communicate with clients), they can request promotion:
   - Option A: Click **"Submit Access Request"** directly on the `/login` page modal.
   - Option B: Click **"Request Manager Access"** in the top navigation bar when logged in as an Analyst.
   - Option C: Navigate directly to `/manager-request` or click **"Manager Promotion"** in the sidebar.
2. Fill in the organization or team name (optional) and the business justification (minimum 10 characters).
3. Click **"Submit Access Request"**.
4. The request status is set to `pending`. Analysts can check status and administrator notes at any time on `/manager-request`.
5. An Administrator reviews and approves the request at `/admin/users` (Applications tab). Upon approval, the user's role is automatically upgraded to `manager`. Anti-self-approval is strictly enforced on the backend.

---

## 4. Verification & Testing Commands

To independently verify backend security gates, manager request workflows, and frontend production builds:

### Run Full Backend Test Suite (Pytest - 24 Tests)
```powershell
cd C:\Users\mithi\OneDrive\Desktop\Vellora
python -m pytest backend/tests
```
*(All 24 tests pass, verifying authentication, OAuth endpoints, manager access requests, anti-self-approval, data profiling, quality scoring, interactive cleaning, optional/mandatory project governance, EDA, visual intelligence, ML models, PowerPoint PPTX generation, ReportLab PDF generation, and client email communication).*

### Run Backend Security Gate & Negative Tests
```powershell
cd C:\Users\mithi\OneDrive\Desktop\Vellora
python -m pytest backend/tests/test_workflow_gates_and_security.py
```
*(Tests anti-self-approval, blocks on unapproved datasets reaching validation, and checks 409 conflict on duplicate submissions).*

### Run Manager Access Request Tests
```powershell
cd C:\Users\mithi\OneDrive\Desktop\Vellora
python -m pytest backend/tests/test_manager_access_requests.py
```
*(Tests request submission, duplicate prevention, anti-self-approval by administrators, role upgrade, and notification generation).*

### Run Frontend Production Build (Vite)
```powershell
cd C:\Users\mithi\OneDrive\Desktop\Vellora\frontend
npm run build
```
*(Verifies that all 2,300+ modules bundle cleanly with zero compile errors).*

---

## 5. Section 40 Design System & Background Customization

The platform features a Section 40 frosted glassmorphic authentication experience over full-viewport background images with coordinated palette tokens:
- **Deep Navy Base**: `#10243A`
- **Dark Navy**: `#173B57`
- **Vibrant Cyan Accent**: `#18C6D9`
- **Teal Accent**: `#18B6A4`
- **Blue Brand**: `#3478F6`

### Customizable Wallpaper Backgrounds
Place your high-resolution photography into `frontend/public/images/auth/`:
- **Sign In**: `frontend/public/images/auth/login-bg.jpg`
- **Registration**: `frontend/public/images/auth/register-bg.jpg`
- **Forgot Password**: `frontend/public/images/auth/forgot-password-bg.jpg`
- **Reset Password**: `frontend/public/images/auth/reset-password-bg.jpg`

Asset mappings can be adjusted in [authImages.js](file:///frontend/src/config/authImages.js).

---

## 6. Social OAuth Configuration (Google, GitHub, LinkedIn)

OAuth endpoints are implemented with PKCE and state protection on the backend:
- Status check: `GET /api/auth/oauth/providers`
- Authorization URL: `GET /api/auth/oauth/{provider}/url`
- Token exchange & account provisioning: `POST /api/auth/oauth/{provider}/callback`

To activate live provider sign-in, add your developer credentials to `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```
If credentials are not yet configured, the UI cleanly informs the user with setup instructions without crashing.
