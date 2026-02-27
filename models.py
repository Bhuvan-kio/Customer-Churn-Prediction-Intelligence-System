"""
Standalone churn-capture evaluator (no app dependency).

Runs 3 models on a labeled CSV dataset and reports whether
Top 10% customer targeting captures at least 40% of actual churners.

Usage:
    python models.py
    python models.py --data data/data.csv
    python models.py --target churn
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Top-10% churn capture evaluator")
    parser.add_argument("--data", default="data/data.csv", help="Path to labeled CSV dataset")
    parser.add_argument("--target", default=None, help="Target column name (auto-detect if omitted)")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split ratio")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    return parser.parse_args()


def detect_target_column(df: pd.DataFrame, explicit_target: str | None) -> str:
    if explicit_target:
        if explicit_target not in df.columns:
            raise ValueError(f"Target column '{explicit_target}' not found in dataset")
        return explicit_target

    lower_to_orig = {column.lower(): column for column in df.columns}
    candidate_names = [
        "churn",
        "churn_flag",
        "is_churn",
        "churned",
        "target",
        "label",
        "y",
        "exited",
    ]

    for candidate in candidate_names:
        if candidate in lower_to_orig:
            return lower_to_orig[candidate]

    contains_churn = [column for column in df.columns if "churn" in column.lower()]
    if contains_churn:
        return contains_churn[0]

    raise ValueError("Could not detect target column. Pass --target explicitly.")


def normalize_target(target: pd.Series) -> pd.Series:
    if target.dtype == bool:
        return target.astype(int)

    if target.dtype == object:
        label_map = {
            "yes": 1,
            "no": 0,
            "true": 1,
            "false": 0,
            "1": 1,
            "0": 0,
            "churn": 1,
            "retained": 0,
            "churned": 1,
            "not churned": 0,
        }
        mapped = target.astype(str).str.strip().str.lower().map(label_map)
        if mapped.isna().any():
            unique_values = sorted(target.astype(str).str.strip().str.lower().unique().tolist())
            raise ValueError(f"Unmapped target labels found: {unique_values}")
        return mapped.astype(int)

    numeric_target = pd.to_numeric(target, errors="coerce")
    if numeric_target.isna().any():
        raise ValueError("Target contains non-numeric values that cannot be converted")

    unique_values = set(numeric_target.dropna().unique().tolist())
    if unique_values.issubset({0, 1}):
        return numeric_target.astype(int)

    return (numeric_target > 0).astype(int)


def preprocess_features(features: pd.DataFrame) -> pd.DataFrame:
    out = features.copy()

    id_like_columns = [
        "customer_id",
        "customerid",
        "CustomerID",
        "account_id",
        "subscription_id",
        "id",
        "ID",
        "RowNumber",
        "row_number",
        "phone number",
        "account_name",
    ]
    for column in id_like_columns:
        if column in out.columns:
            out = out.drop(columns=[column])

    bool_map = {
        "yes": 1,
        "no": 0,
        "true": 1,
        "false": 0,
        "male": 1,
        "female": 0,
        "m": 1,
        "f": 0,
    }
    for column in out.columns:
        if out[column].dtype == object:
            lowered = out[column].astype(str).str.strip().str.lower()
            if lowered.isin(bool_map.keys()).all():
                out[column] = lowered.map(bool_map).astype(int)

    numeric_columns = out.select_dtypes(include=[np.number]).columns.tolist()
    for column in numeric_columns:
        out[column] = out[column].fillna(out[column].median())

    categorical_columns = out.select_dtypes(include=["object", "category"]).columns.tolist()
    for column in categorical_columns:
        mode_values = out[column].mode(dropna=True)
        out[column] = out[column].fillna(mode_values.iloc[0] if not mode_values.empty else "Unknown")

    if categorical_columns:
        out = pd.get_dummies(out, columns=categorical_columns, drop_first=False, dtype=int)

    out = out.apply(pd.to_numeric, errors="coerce").fillna(0)
    return out


def top10_capture(y_true: pd.Series, scores: np.ndarray) -> tuple[float, int, int, int]:
    order = np.argsort(-np.asarray(scores))
    y_sorted = np.asarray(y_true)[order]

    n10 = max(1, int(0.10 * len(y_sorted)))
    total_churners = int(y_sorted.sum())
    captured_churners = int(y_sorted[:n10].sum())

    capture_rate = (captured_churners / total_churners) if total_churners > 0 else 0.0
    return capture_rate, n10, captured_churners, total_churners


def run_evaluation(data_path: Path, target_arg: str | None, test_size: float, seed: int) -> None:
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found: {data_path}")

    raw = pd.read_csv(data_path)
    target_column = detect_target_column(raw, target_arg)

    y = normalize_target(raw[target_column])
    x = preprocess_features(raw.drop(columns=[target_column]))

    if y.nunique() < 2:
        raise ValueError("Target has only one class; classification is not possible")

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=test_size,
        random_state=seed,
        stratify=y,
    )

    results: list[tuple[str, float, float, int, int, int]] = []

    linear = LinearRegression()
    linear.fit(x_train, y_train)
    linear_scores = linear.predict(x_test)
    linear_auc = roc_auc_score(y_test, linear_scores)
    linear_capture, linear_n10, linear_captured, linear_total = top10_capture(y_test, linear_scores)
    results.append(("Linear Regression", linear_auc, linear_capture, linear_n10, linear_captured, linear_total))

    random_forest = RandomForestClassifier(
        n_estimators=700,
        max_depth=None,
        random_state=seed,
        class_weight="balanced",
        n_jobs=-1,
    )
    random_forest.fit(x_train, y_train)
    random_forest_scores = random_forest.predict_proba(x_test)[:, 1]
    rf_auc = roc_auc_score(y_test, random_forest_scores)
    rf_capture, rf_n10, rf_captured, rf_total = top10_capture(y_test, random_forest_scores)
    results.append(("Random Forest", rf_auc, rf_capture, rf_n10, rf_captured, rf_total))

    negatives = int((y_train == 0).sum())
    positives = int((y_train == 1).sum())
    scale_pos_weight = (negatives / positives) if positives > 0 else 1

    xgb = XGBClassifier(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        scale_pos_weight=scale_pos_weight,
        random_state=seed,
        n_jobs=-1,
    )
    xgb.fit(x_train, y_train)
    xgb_scores = xgb.predict_proba(x_test)[:, 1]
    xgb_auc = roc_auc_score(y_test, xgb_scores)
    xgb_capture, xgb_n10, xgb_captured, xgb_total = top10_capture(y_test, xgb_scores)
    results.append(("XGBoost", xgb_auc, xgb_capture, xgb_n10, xgb_captured, xgb_total))

    print(f"dataset: {data_path.name}")
    print(f"shape: {raw.shape}")
    print(f"target_col: {target_column}")
    print(f"churn_rate_pct: {y.mean() * 100:.2f}")
    print()
    print("Model results (sorted by Top10Capture):")

    sorted_results = sorted(results, key=lambda row: row[2], reverse=True)
    for name, auc, capture, n10, captured, total in sorted_results:
        print(
            f"{name}: AUC={auc:.4f}, Top10Capture={capture * 100:.2f}% "
            f"(captured {captured}/{total} churners in top {n10})"
        )

    best_model, _, best_capture, _, _, _ = sorted_results[0]
    print()
    print(f"BEST_MODEL: {best_model}")
    print(f"BEST_CAPTURE_PCT: {best_capture * 100:.2f}")
    print(f"TARGET_MET_40PCT: {best_capture >= 0.40}")


if __name__ == "__main__":
    arguments = parse_args()
    run_evaluation(
        data_path=Path(arguments.data),
        target_arg=arguments.target,
        test_size=arguments.test_size,
        seed=arguments.seed,
    )
