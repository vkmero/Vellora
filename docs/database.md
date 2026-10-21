# Vellora Database Architecture & Schemas

## 1. Engine & Connectivity

- **Dialect**: PostgreSQL 15+ (Production Target: Neon Serverless PostgreSQL with SSL)
- **ORM**: SQLAlchemy 2.0 (`DeclarativeBase`, `Mapped`, `mapped_column`)
- **Driver**: `psycopg` (psycopg 3 binary)
- **Migration Tool**: Alembic

## 2. Entity Relational Architecture

### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto | Unique user ID |
| `name` | String(120) | Not Null | Display name |
| `email` | String(255) | Unique, Indexed, Not Null | Work email |
| `password_hash` | String(255) | Not Null | Bcrypt hashed password |
| `role` | String(32) | Default 'analyst', Not Null | `analyst`, `manager`, `admin` |
| `is_active` | Boolean | Default True, Not Null | Account active status |
| `created_at` | DateTime(tz) | Not Null | Creation timestamp |
| `last_login` | DateTime(tz) | Nullable | Last authenticated timestamp |

### `datasets`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Auto | Unique dataset identifier |
| `name` | String(255) | Not Null | User-defined title |
| `original_filename` | String(255) | Not Null | Original client filename |
| `original_file_path` | String(500) | Not Null | Safe filesystem storage path |
| `cleaned_file_path` | String(500) | Nullable | Cleaned version path |
| `file_type` | String(16) | Not Null | `csv` or `xlsx` |
| `file_size` | Integer | Not Null | File size in bytes |
| `owner_id` | Integer | FK(`users.id`), Indexed | Dataset creator |
| `status` | String(40) | Default 'uploaded', Indexed | Pipeline status |
| `row_count` | Integer | Nullable | Total rows |
| `column_count` | Integer | Nullable | Total columns |
| `quality_score` | Float | Nullable | Composite quality score (0-100) |

### `data_profiles`
Stores dataset-level statistics (`missing_cells_count`, `duplicate_rows_count`, `memory_usage_bytes`) and JSON structured `column_profiles` (cardinality, datatypes, min/max/mean/std).

### `quality_issues`
Granular anomaly records specifying `column_name`, `issue_type`, `severity` (Critical, High, Medium, Low), `description`, `recommendation`, `affected_rows`, and `percentage`.

### `cleaning_actions`
Immutable log of transformations: `action_type`, `column_name`, `before_count`, `after_count`, `affected_rows`, `description`, `performed_by`.

### `approvals`
Manager review lifecycle: `dataset_id`, `requested_by`, `status` (`pending`, `approved`, `rejected`, `changes_requested`), `comments`, `reviewed_by`, `reviewed_at`.

### `validations`
Before-and-after audit comparing `previous_quality_score` with `new_quality_score`, `issues_before`, `issues_after`, and `validation_summary`.

### Additional Analytics Entities:
- `analyses`: Stores EDA summary statistics, histograms, and Pearson correlation matrices.
- `visualizations`: Stores chart specifications (bar, line, area, pie, scatter) and aggregated plotting points.
- `insights`: Stores algorithmic business findings with evidence JSON and recommendations.
- `predictions`: Stores Scikit-Learn training artifacts, test split metrics (MAE, RMSE, R² or Accuracy, F1), and sample predictions.
- `reports`: Tracks compiled PDF, Excel, and CSV artifacts.
- `audit_logs`: Tamper-evident activity stream.
