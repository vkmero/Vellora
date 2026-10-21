# Vellora REST API Reference

Base Endpoint: `/api`

## Authentication & Identity (`/api/auth`)
- `POST /api/auth/register`: Create a new Analyst account.
- `POST /api/auth/login`: Authenticate and receive JWT Bearer token + role.
- `GET /api/auth/me`: Fetch current authenticated user profile.
- `POST /api/auth/forgot-password`: Request password reset instructions.
- `POST /api/auth/reset-password`: Set new password with security token.
- `POST /api/auth/logout`: Sign out and record audit entry.

## Datasets & Ingestion (`/api/datasets`)
- `POST /api/datasets/upload`: Upload raw CSV or XLSX file. Sanitizes names and creates database record.
- `GET /api/datasets`: List user-owned (analyst) or team (manager/admin) datasets with search, filters, pagination.
- `GET /api/datasets/{id}`: Retrieve detailed dataset metadata.
- `GET /api/datasets/{id}/preview`: Fetch first N rows of current working dataset.
- `DELETE /api/datasets/{id}`: Delete dataset and associated audit files.

## Structural Profiling & Quality Assessment
- `POST /api/datasets/{id}/profile`: Trigger profiling computation.
- `GET /api/datasets/{id}/profile`: Fetch cached structural column profile.
- `POST /api/datasets/{id}/quality`: Run statistical anomaly detection across 4 dimensions.
- `GET /api/datasets/{id}/quality`: Fetch latest quality scorecard and issues.
- `GET /api/datasets/{id}/quality/issues`: List detected quality issues.

## Data Cleansing (`/api/datasets/{id}/clean`)
- `POST /api/datasets/{id}/clean/preview`: Preview row-level impact without mutating data.
- `POST /api/datasets/{id}/clean/apply`: Apply transformation and store to cleaned dataset path.
- `GET /api/datasets/{id}/cleaning/actions`: Retrieve transformation audit history.

## Governance & Approval Gates (`/api/approvals`)
- `POST /api/datasets/{id}/submit-approval`: Submit cleaned dataset for manager review.
- `GET /api/approvals/pending`: List pending manager reviews.
- `GET /api/approvals/{id}`: Fetch approval dossier.
- `POST /api/approvals/{id}/approve`: Approve dataset for downstream analytics.
- `POST /api/approvals/{id}/reject`: Reject dataset (comments mandatory).
- `POST /api/approvals/{id}/request-changes`: Request changes (comments mandatory).

## Validation & Analytics (`/api/datasets/{id}/*`)
- `POST /api/datasets/{id}/validate`: Revalidate quality after cleaning.
- `GET /api/datasets/{id}/validation`: Fetch comparative validation summary.
- `POST /api/datasets/{id}/analytics`: Run exploratory data analysis (EDA).
- `GET /api/datasets/{id}/analytics`: Retrieve descriptive statistics & correlation matrix.
- `POST /api/datasets/{id}/visualizations`: Generate interactive chart data points.
- `GET /api/datasets/{id}/visualizations`: List saved visualizations.
- `POST /api/datasets/{id}/insights`: Synthesize automated business findings.
- `GET /api/datasets/{id}/insights`: Retrieve computed insights.
- `POST /api/datasets/{id}/predictions`: Fit Scikit-Learn regression or classification model.
- `GET /api/datasets/{id}/predictions`: List trained models and metrics.

## Executive Reports (`/api/reports`)
- `POST /api/datasets/{id}/reports`: Compile PDF, XLSX, or CSV dossier.
- `GET /api/datasets/{id}/reports`: List compiled reports for dataset.
- `GET /api/reports/{id}/download`: Download report binary file.

## Platform Administration (`/api/admin`)
- `GET /api/admin/system-stats`: Aggregate platform metrics and user volume.
- `GET /api/admin/users`: Search, filter, and paginate user directory.
- `PATCH /api/admin/users/{id}`: Modify user role or account status.
- `GET /api/admin/datasets`: Global dataset directory.
- `GET /api/admin/audit-logs`: Query tamper-evident system audit trail.

## Health Diagnostics
- `GET /api/health`: Basic service status.
- `GET /api/health/database`: Real `SELECT 1` ping verification against PostgreSQL.
