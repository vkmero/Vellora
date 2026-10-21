from pathlib import Path

import pandas as pd

from app.exceptions import UnprocessableError
from app.models.dataset import Dataset


def load_dataframe(path: str) -> pd.DataFrame:
    file_path = Path(path)
    if not file_path.exists():
        raise UnprocessableError("The dataset file could not be found on disk.")
    try:
        if file_path.suffix.lower() == ".csv":
            return pd.read_csv(file_path)
        if file_path.suffix.lower() in {".xlsx", ".xls"}:
            return pd.read_excel(file_path)
    except Exception as exc:
        raise UnprocessableError("The file could not be parsed. Confirm it is a valid CSV or Excel file.") from exc
    raise UnprocessableError("Unsupported file type.")


def working_path(dataset: Dataset) -> str:
    if dataset.cleaned_file_path and Path(dataset.cleaned_file_path).exists():
        return dataset.cleaned_file_path
    return dataset.original_file_path


def load_dataset_frame(dataset: Dataset, original: bool = False) -> pd.DataFrame:
    path = dataset.original_file_path if original else working_path(dataset)
    return load_dataframe(path)


def save_frame(df: pd.DataFrame, path: str, file_type: str) -> None:
    dest = Path(path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if file_type == "csv" or dest.suffix.lower() == ".csv":
        df.to_csv(dest, index=False)
    else:
        df.to_excel(dest, index=False)
