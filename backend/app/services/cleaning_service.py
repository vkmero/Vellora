import pandas as pd

from app.exceptions import BadRequestError
from app.models.cleaning_action import CleaningAction
from app.models.dataset import Dataset
from app.services.file_service import cleaned_path_for
from app.services.ingestion_service import load_dataset_frame, save_frame
from app.utils.statistics import iqr_outlier_mask

DESTRUCTIVE = {"drop_missing_rows", "remove_outliers", "remove_column", "remove_duplicates"}


def apply_cleaning(df: pd.DataFrame, action_type: str, column_name: str | None, value: str | None):
    before = len(df)
    working = df.copy()
    description = ""

    if action_type == "remove_duplicates":
        working = working.drop_duplicates()
        description = "Removed exact duplicate rows."
    elif action_type == "drop_missing_rows":
        subset = [column_name] if column_name else None
        working = working.dropna(subset=subset)
        description = f"Dropped rows with missing values{' in ' + column_name if column_name else ''}."
    elif action_type in {"fill_missing", "mean_imputation", "median_imputation", "mode_imputation"}:
        if not column_name:
            raise BadRequestError("A column is required for imputation.")
        series = working[column_name]
        if action_type == "mean_imputation":
            fill = pd.to_numeric(series, errors="coerce").mean()
        elif action_type == "median_imputation":
            fill = pd.to_numeric(series, errors="coerce").median()
        elif action_type == "mode_imputation":
            mode = series.mode(dropna=True)
            fill = mode.iloc[0] if not mode.empty else None
        else:
            fill = value
        if fill is None or (isinstance(fill, float) and pd.isna(fill)):
            raise BadRequestError("Could not compute a fill value for this column.")
        working[column_name] = series.fillna(fill)
        description = f"Filled missing values in {column_name} using {action_type.replace('_', ' ')}."
    elif action_type == "remove_outliers":
        if not column_name:
            raise BadRequestError("A column is required to remove outliers.")
        mask = iqr_outlier_mask(working[column_name])
        working = working.loc[~mask]
        description = f"Removed IQR outliers from {column_name}."
    elif action_type == "standardize_categories":
        if not column_name:
            raise BadRequestError("A column is required to standardize categories.")
        working[column_name] = working[column_name].astype(str).str.strip().str.title()
        working.loc[df[column_name].isna(), column_name] = pd.NA
        description = f"Standardized category casing in {column_name}."
    elif action_type == "convert_datatype":
        if not column_name or not value:
            raise BadRequestError("Column and target datatype are required.")
        if value == "numeric":
            working[column_name] = pd.to_numeric(working[column_name], errors="coerce")
        elif value == "datetime":
            working[column_name] = pd.to_datetime(working[column_name], errors="coerce")
        elif value == "string":
            working[column_name] = working[column_name].astype(str)
        else:
            raise BadRequestError("Supported datatypes: numeric, datetime, string.")
        description = f"Converted {column_name} to {value}."
    elif action_type == "rename_column":
        if not column_name or not value:
            raise BadRequestError("Current column name and new name are required.")
        if value in working.columns:
            raise BadRequestError("A column with that name already exists.")
        working = working.rename(columns={column_name: value})
        description = f"Renamed column {column_name} to {value}."
    elif action_type == "remove_column":
        if not column_name:
            raise BadRequestError("A column is required to remove.")
        working = working.drop(columns=[column_name])
        description = f"Removed column {column_name}."
    else:
        raise BadRequestError("Unsupported cleaning action.")

    after = len(working)
    affected = abs(before - after)
    if action_type in {"fill_missing", "mean_imputation", "median_imputation", "mode_imputation"} and column_name:
        affected = int(df[column_name].isna().sum())
    if action_type == "standardize_categories" and column_name:
        affected = int((df[column_name].astype(str) != working[column_name].astype(str)).sum())
    return working, before, after, affected, description


def preview_or_apply(db, dataset: Dataset, user_id: int, action_type: str, column_name: str | None, value: str | None, preview: bool):
    df = load_dataset_frame(dataset)
    working, before, after, affected, description = apply_cleaning(df, action_type, column_name, value)
    if preview:
        return {
            "action_type": action_type,
            "column_name": column_name,
            "before_count": before,
            "after_count": after,
            "affected_rows": affected,
            "description": description,
            "destructive": action_type in DESTRUCTIVE,
        }
    dest = dataset.cleaned_file_path or cleaned_path_for(dataset.original_file_path)
    save_frame(working, dest, dataset.file_type)
    dataset.cleaned_file_path = dest
    dataset.row_count = after
    dataset.column_count = len(working.columns)
    dataset.status = "cleaned"
    action = CleaningAction(
        dataset_id=dataset.id,
        column_name=column_name,
        action_type=action_type,
        before_count=before,
        after_count=after,
        affected_rows=affected,
        description=description,
        performed_by=user_id,
    )
    db.add(action)
    db.flush()
    return action
