# Vellora Platform Architecture

## 1. System Overview

Vellora is an enterprise-grade intelligent data quality, analytics, and insight generation platform designed for end-to-end data stewardship.

```
React Frontend (Vite)
        ↓
Axios Interceptor API Layer (Bearer JWT)
        ↓
FastAPI Router Layer (/api/*)
        ↓
Domain Services & Statistical Engines
        ↓
SQLAlchemy ORM 2.0 (Alembic Migrations)
        ↓
PostgreSQL (Production Target: Neon Serverless)
```

## 2. Core Subsystems

### Ingestion & Validation
- **Path Traversal Shield**: Files are validated against allowed formats (`.csv`, `.xlsx`), MIME checks, and sanitized filenames.
- **Original Immutability**: Uploaded source datasets are stored in `uploads/original/` and are never mutated.

### Quality Engine
- Multidimensional score calculated mathematically across:
  - **Completeness**: Evaluates missing and null value ratios.
  - **Uniqueness**: Detects duplicate observations and unique identifier integrity.
  - **Validity**: Detects datatype discrepancies, IQR outliers, and anomalous values.
  - **Consistency**: Recognizes casing inconsistencies (e.g., `Hyderabad` vs `hyderabad`) and mixed types.

### Data Cleansing Studio
- **Preview Before Commit**: Analysts can preview the row-level impact of deduplication, IQR trimming, mean/median/mode imputation, category standardization, and column conversions.
- **Cleaned Dataset Versioning**: Transformed files are persisted separately to `uploads/cleaned/`.

### Governance & Approval Workflow
- Three distinct RBAC roles: `analyst`, `manager`, `admin`.
- Manager review gates enforce mandatory feedback comments for rejections or change requests.
- Dataset revalidation explicitly certifies quality improvement.

### Exploratory Data Analysis & Machine Learning
- Computes statistical moments, Pearson correlation matrices, and numerical distribution histograms.
- Interactive visualization builder generating Recharts graphs.
- Scikit-Learn predictive modeling supporting Regression (`LinearRegression`, `DecisionTreeRegressor`, `RandomForestRegressor`) and Classification (`LogisticRegression`, `DecisionTreeClassifier`, `RandomForestClassifier`).

### Reporting & Audit Trails
- Compiles ReportLab PDF dossiers, Excel workbooks, and CSV records.
- Immutable system audit trail capturing all authentication, transformation, and review events.
