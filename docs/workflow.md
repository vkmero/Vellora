# Vellora End-to-End Governance Workflow

## 1. Official 14-Stage Lifecycle Pipeline

```text
1. User Authentication (JWT + RBAC: Analyst, Manager, Admin)
            ↓
2. Role-Based Dashboard Routing
            ↓
3. Dataset Ingestion (Drag-and-drop CSV/XLSX, MIME & size validation)
            ↓
4. Automatic Structural Profiling (Types, unique counts, missing counts, candidate PKs)
            ↓
5. Data Quality Assessment (Completeness, Uniqueness, Validity, Consistency)
            ↓
6. Issue & Anomaly Detection (IQR outliers, null cells, case inconsistency, duplicates)
            ↓
7. Interactive Cleaning (Preview before apply, preserve original immutability)
            ↓
8. Submission for Governance Approval (Locks editing, notifies managers)
            ↓
9. Manager Review & Decision (Approve / Reject / Request Changes; self-approval forbidden)
            ↓
10. Post-Approval Revalidation (Verifies score jump; transitions state to `validated`)
            ↓
11. Exploratory Data Analysis / EDA (Descriptive statistics, correlation matrix)
            ↓
12. Visualization Builder (Interactive Recharts: Bar, Line, Pie, Area, Scatter, Histogram)
            ↓
13. Algorithmic Business Insights (Margin, revenue trends, concentration findings)
            ↓
14. Predictive Machine Learning (Scikit-Learn ColumnTransformer pipelines, multi-model benchmark)
            ↓
15. Executive Reporting Dossier (ReportLab PDF, multi-sheet XLSX, CSV exports)
            ↓
16. Tamper-Evident Audit Trail & History
```

---

## 2. Server-Enforced Dataset State Machine

Vellora implements a strict finite state machine managed by [`app.services.workflow_service`](file:///c:/Users/mithi/OneDrive/Desktop/Vellora/backend/app/services/workflow_service.py). Status strings cannot be transitioned arbitrarily:

| From State | Allowed Target States | Enforcing Trigger |
| :--- | :--- | :--- |
| `uploaded` | `profiled` | Automated structural profiling |
| `profiled` | `quality_checked` | Quality evaluation run |
| `quality_checked` | `cleaned`, `pending_approval` | Data transformation or approval submission |
| `cleaned` | `cleaned`, `pending_approval` | Additional cleaning or approval submission |
| `changes_requested` | `cleaned`, `pending_approval` | Analyst revising transformation pipeline |
| `pending_approval` | `approved`, `rejected`, `changes_requested` | Manager review determination |
| `approved` | `validated` | Post-approval revalidation |
| `validated` | `analyzed` | Exploratory data analysis (EDA) run |
| `analyzed` | `analyzed`, `archived` | Re-analysis or administrative archive |

---

## 3. Server-Side Stage Gates

Attempting to invoke an out-of-order stage returns HTTP 422 with application code `WORKFLOW_STAGE_REQUIRED`:

1. **Revalidation Gate**: Requires `dataset.status == 'approved'`. Bypassing manager sign-off is blocked.
2. **Analytics Gate**: Requires `dataset.status in {'validated', 'analyzed'}`. Raw or unvalidated datasets cannot reach EDA.
3. **Visualization Gate**: Requires dataset to be `validated`/`analyzed` and exploratory analysis to be pre-calculated.
4. **Insights Gate**: Requires dataset to be `validated`/`analyzed` and exploratory analysis to be pre-calculated.
5. **Prediction Gate**: Requires dataset to be `validated`/`analyzed` and exploratory analysis to be pre-calculated.
6. **Report Gate**:
   - `quality` reports require `quality_checked` or later.
   - `analytics` and `complete` reports require `analyzed`.
7. **Anti-Self-Approval Gate**: In `POST /api/approvals/{id}/approve`, Vellora verifies `requester_id != reviewer_id`. A manager cannot approve their own submission.
