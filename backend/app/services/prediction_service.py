import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sqlalchemy.orm import Session

from app.exceptions import UnprocessableError
from app.models.dataset import Dataset
from app.models.prediction import Prediction
from app.services.ingestion_service import load_dataset_frame
from app.services.workflow_service import require_analytics_ready
from app.utils.data_types import infer_column_kind
from app.utils.helpers import json_safe


def _looks_like_id(name: str, series: pd.Series) -> bool:
    n = name.lower()
    if n in {"id", "uuid"} or n.endswith("_id") or n.endswith("id"):
        if series.nunique(dropna=True) == series.notna().sum():
            return True
    return False


def train_model(db: Session, dataset: Dataset, user_id: int, payload: dict) -> Prediction:
    require_analytics_ready(dataset)
    df = load_dataset_frame(dataset)
    target = payload.get("target_column")
    if not target or target not in df.columns:
        raise UnprocessableError("A valid target column is required.")
    y_raw = df[target]
    if y_raw.isna().all():
        raise UnprocessableError("The selected target column has no usable values.")
    if _looks_like_id(target, y_raw):
        raise UnprocessableError("The selected target looks like an identifier and is not suitable for prediction.")
    if y_raw.nunique(dropna=True) < 2:
        raise UnprocessableError("The target does not have enough variation to train a model.")
    if len(df.dropna(subset=[target])) < 20:
        raise UnprocessableError("The dataset is too small for a reliable train/test split.")

    problem = payload.get("problem_type", "regression")
    requested_model = payload.get("model_type", "linear_regression")
    requested_features = payload.get("features") or [c for c in df.columns if c != target]
    features = [c for c in requested_features if c in df.columns and c != target]
    if not features:
        raise UnprocessableError("Required features are unavailable.")

    # Data hygiene & feature preparation
    work = df[features + [target]].copy()
    if problem == "regression":
        work[target] = pd.to_numeric(work[target], errors="coerce")
    else:
        work[target] = work[target].astype(str)
    work = work.dropna(subset=[target])
    if len(work) < 20:
        raise UnprocessableError("Too many missing values in target for reliable modeling.")

    # Classify feature types for Sklearn ColumnTransformer
    num_cols = [c for c in features if infer_column_kind(work[c]) == "numeric"]
    cat_cols = [c for c in features if c not in num_cols]

    for c in num_cols:
        work[c] = pd.to_numeric(work[c], errors="coerce")
    for c in cat_cols:
        work[c] = work[c].fillna("Missing").astype(str)

    X = work[features]
    y = work[target]

    stratify = y if problem == "classification" and y.nunique() < 12 and y.value_counts().min() >= 2 else None
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=stratify
        )
    except ValueError as exc:
        raise UnprocessableError("The target distribution is not suitable for a stratified split.") from exc

    # ColumnTransformer with OneHotEncoder and Imputation/Scaling
    transformers = []
    if num_cols:
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])
        transformers.append(("num", num_pipeline, num_cols))

    if cat_cols:
        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])
        transformers.append(("cat", cat_pipeline, cat_cols))

    if not transformers:
        raise UnprocessableError("No valid numeric or categorical features available.")

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

    model_comparison = []
    selected_metrics = {}
    selected_pred = None
    conf_matrix = None

    if problem == "regression":
        candidates = {
            "linear_regression": LinearRegression(),
            "decision_tree": DecisionTreeRegressor(random_state=42, max_depth=6),
            "random_forest": RandomForestRegressor(random_state=42, n_estimators=60, max_depth=8),
        }
        if requested_model not in candidates:
            requested_model = "linear_regression"

        for m_name, estimator in candidates.items():
            pipe = Pipeline([("preprocessor", preprocessor), ("estimator", estimator)])
            pipe.fit(X_train, y_train)
            pred = pipe.predict(X_test)

            m_metrics = {
                "mae": json_safe(float(mean_absolute_error(y_test, pred))),
                "rmse": json_safe(float(mean_squared_error(y_test, pred) ** 0.5)),
                "r2": json_safe(float(r2_score(y_test, pred))),
            }
            model_comparison.append({
                "model": m_name,
                "label": m_name.replace("_", " ").title(),
                "metrics": m_metrics,
            })
            if m_name == requested_model:
                selected_metrics = m_metrics
                selected_pred = pred

    elif problem == "classification":
        candidates = {
            "logistic_regression": LogisticRegression(max_iter=400),
            "decision_tree": DecisionTreeClassifier(random_state=42, max_depth=6),
            "random_forest": RandomForestClassifier(random_state=42, n_estimators=60, max_depth=8),
        }
        if requested_model not in candidates:
            requested_model = "logistic_regression"

        avg = "binary" if y.nunique() == 2 else "weighted"

        for m_name, estimator in candidates.items():
            pipe = Pipeline([("preprocessor", preprocessor), ("estimator", estimator)])
            pipe.fit(X_train, y_train)
            pred = pipe.predict(X_test)

            m_metrics = {
                "accuracy": json_safe(float(accuracy_score(y_test, pred))),
                "precision": json_safe(float(precision_score(y_test, pred, average=avg, zero_division=0))),
                "recall": json_safe(float(recall_score(y_test, pred, average=avg, zero_division=0))),
                "f1": json_safe(float(f1_score(y_test, pred, average=avg, zero_division=0))),
            }
            model_comparison.append({
                "model": m_name,
                "label": m_name.replace("_", " ").title(),
                "metrics": m_metrics,
            })
            if m_name == requested_model:
                selected_metrics = m_metrics
                selected_pred = pred
                conf_matrix = confusion_matrix(y_test, pred).tolist()
    else:
        raise UnprocessableError("Problem type must be regression or classification.")

    record = Prediction(
        dataset_id=dataset.id,
        model_type=requested_model,
        target_column=target,
        features=features,
        metrics=selected_metrics,
        predictions={
            "training_rows": int(len(X_train)),
            "testing_rows": int(len(X_test)),
            "selected_model": requested_model,
            "confusion_matrix": conf_matrix,
            "model_comparison": model_comparison,
            "sample": [
                {"actual": json_safe(a), "predicted": json_safe(p)}
                for a, p in list(zip(y_test.tolist(), selected_pred.tolist()))[:40]
            ],
        },
        created_by=user_id,
    )
    db.add(record)
    db.flush()
    return record
