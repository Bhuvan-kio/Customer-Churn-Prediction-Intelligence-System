"""
Shared ML utilities for all churn-prediction domains.

Provides:
  - detect_target_column   : auto-detect binary churn column
  - normalize_target       : coerce various label formats to 0/1 int
  - preprocess_features    : encode, impute, one-hot
  - compute_capture        : top-10% capture metric
  - train_domain           : full train/evaluate pipeline for one domain
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# ─── Column detection ────────────────────────────────────────────────────────

_COMMON_ID_COLS = {
    "customer_id", "customerid", "CustomerID", "account_id",
    "subscription_id", "id", "ID", "RowNumber", "row_number",
    "phone number", "account_name",
}

_TARGET_CANDIDATES = [
    "churn", "churn_flag", "is_churn", "churned",
    "target", "label", "y", "exited",
]


def detect_target_column(df: pd.DataFrame) -> str:
    lower_to_orig = {c.lower(): c for c in df.columns}
    for candidate in _TARGET_CANDIDATES:
        if candidate in lower_to_orig:
            return lower_to_orig[candidate]
    contains = [c for c in df.columns if "churn" in c.lower()]
    if contains:
        return contains[0]
    raise ValueError(
        "Could not auto-detect a churn target column. "
        "Set TARGET_COLUMN explicitly in the pipeline module."
    )


# ─── Target normalisation ─────────────────────────────────────────────────────

def normalize_target(target: pd.Series) -> pd.Series:
    if target.dtype == bool:
        return target.astype(int)
    if target.dtype == object:
        label_map = {
            "yes": 1, "no": 0, "true": 1, "false": 0,
            "1": 1, "0": 0, "churn": 1, "retained": 0,
            "churned": 1, "not churned": 0,
        }
        mapped = target.astype(str).str.strip().str.lower().map(label_map)
        if mapped.isna().any():
            unique_vals = sorted(target.astype(str).str.strip().str.lower().unique())
            raise ValueError(f"Unmapped target labels: {unique_vals}")
        return mapped.astype(int)
    numeric = pd.to_numeric(target, errors="coerce")
    if numeric.isna().any():
        raise ValueError("Target contains non-numeric, non-mappable values.")
    if set(numeric.dropna().unique()).issubset({0, 1}):
        return numeric.astype(int)
    return (numeric > 0).astype(int)


# ─── Feature preprocessing ───────────────────────────────────────────────────

def preprocess_features(
    features: pd.DataFrame,
    extra_drop_cols: list[str] | None = None,
) -> pd.DataFrame:
    out = features.copy()

    # drop standard ID columns + any domain-specific extras
    all_drops = _COMMON_ID_COLS | set(extra_drop_cols or [])
    out = out.drop(columns=[c for c in all_drops if c in out.columns])

    # encode simple boolean-looking string columns
    bool_map = {
        "yes": 1, "no": 0, "true": 1, "false": 0,
        "male": 1, "female": 0, "m": 1, "f": 0,
    }
    for col in out.columns:
        if out[col].dtype == object:
            lowered = out[col].astype(str).str.strip().str.lower()
            if lowered.isin(bool_map).all():
                out[col] = lowered.map(bool_map).astype(int)

    # numeric imputation (median)
    for col in out.select_dtypes(include=[np.number]).columns:
        out[col] = out[col].fillna(out[col].median())

    # categorical imputation + one-hot encoding
    cat_cols = out.select_dtypes(include=["object", "category"]).columns.tolist()
    for col in cat_cols:
        mode_vals = out[col].mode(dropna=True)
        out[col] = out[col].fillna(mode_vals.iloc[0] if not mode_vals.empty else "Unknown")
    if cat_cols:
        out = pd.get_dummies(out, columns=cat_cols, drop_first=False, dtype=int)

    return out.apply(pd.to_numeric, errors="coerce").fillna(0)


# ─── Capture metric ──────────────────────────────────────────────────────────

def compute_capture(
    scores: np.ndarray,
    y_true: pd.Series,
) -> tuple[float, int, int, int, np.ndarray]:
    order = np.argsort(-scores)
    sorted_y = y_true.values[order]
    n10 = max(1, int(0.10 * len(sorted_y)))
    total_churners = int(sorted_y.sum())
    captured = int(sorted_y[:n10].sum())
    capture = float(captured / total_churners) if total_churners > 0 else 0.0
    return capture, n10, captured, total_churners, order


# ─── Full domain training pipeline ───────────────────────────────────────────

def train_domain(
    source_df: pd.DataFrame,
    target_column: str,
    extra_drop_cols: list[str] | None = None,
) -> dict:
    """
    Train Linear Regression + XGBoost + Random Forest on a single domain dataset.
    Returns a flat store dict consumed by the API endpoints.
    """
    y = normalize_target(source_df[target_column])
    raw_features = source_df.drop(columns=[target_column]).copy()
    X = preprocess_features(raw_features, extra_drop_cols=extra_drop_cols)

    indices = np.arange(len(source_df))
    train_idx, test_idx = train_test_split(
        indices, test_size=0.2, random_state=42, stratify=y,
    )

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    raw_test = raw_features.iloc[test_idx].reset_index(drop=True)

    # ── Linear Regression ──────────────────────────────────────────────────
    linear = LinearRegression()
    linear.fit(X_train, y_train)
    lin_scores = linear.predict(X_test)
    lin_auc = roc_auc_score(y_test, lin_scores)
    lin_capture, _, _, _, _ = compute_capture(lin_scores, y_test)

    # ── XGBoost ────────────────────────────────────────────────────────────
    neg = int((y_train == 0).sum())
    pos = int((y_train == 1).sum())
    scale_pos_weight = (neg / pos) if pos > 0 else 1

    xgb = XGBClassifier(
        n_estimators=500, max_depth=5, learning_rate=0.05,
        subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
        scale_pos_weight=scale_pos_weight, random_state=42, n_jobs=-1,
    )
    xgb.fit(X_train, y_train)
    xgb_scores = xgb.predict_proba(X_test)[:, 1]
    xgb_auc = roc_auc_score(y_test, xgb_scores)
    xgb_capture, _, _, _, _ = compute_capture(xgb_scores, y_test)

    # ── Random Forest ──────────────────────────────────────────────────────
    rf = RandomForestClassifier(
        n_estimators=700, max_depth=None, random_state=42,
        class_weight="balanced", n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    rf_scores = rf.predict_proba(X_test)[:, 1]
    rf_auc = roc_auc_score(y_test, rf_scores)
    rf_capture, _, _, _, _ = compute_capture(rf_scores, y_test)

    # ── Select best model ──────────────────────────────────────────────────
    model_scores = {
        "Linear Regression": (lin_auc, lin_capture, lin_scores),
        "XGBoost":           (xgb_auc, xgb_capture, xgb_scores),
        "Random Forest":     (rf_auc, rf_capture, rf_scores),
    }
    fitted_models = {
        "Linear Regression": linear,
        "XGBoost":           xgb,
        "Random Forest":     rf,
    }
    best_name = max(model_scores, key=lambda m: model_scores[m][1])
    best_model = fitted_models[best_name]
    best_auc, best_capture, best_prob = model_scores[best_name]

    capture_rate, top10_n, captured_top10, total_churners, order = compute_capture(
        best_prob, y_test,
    )

    # ── ROC curves ────────────────────────────────────────────────────────
    lr_fpr, lr_tpr, _ = roc_curve(y_test, lin_scores)
    xgb_fpr, xgb_tpr, _ = roc_curve(y_test, xgb_scores)
    rf_fpr, rf_tpr, _ = roc_curve(y_test, rf_scores)

    # ── Gain / lift chart data ─────────────────────────────────────────────
    sorted_results = raw_test.iloc[order].copy().reset_index(drop=True)
    sorted_results["actual_churn"]          = y_test.values[order]
    sorted_results["churn_probability"]     = best_prob[order]
    sorted_results["cumulative_churn"]      = sorted_results["actual_churn"].cumsum()
    sorted_results["cumulative_capture_rate"] = (
        sorted_results["cumulative_churn"] / max(total_churners, 1)
    )
    sorted_results["population_pct"] = (
        np.arange(1, len(sorted_results) + 1) / len(sorted_results)
    )

    # ── Full dataset ranking ───────────────────────────────────────────────
    if best_name == "Linear Regression":
        all_scores = best_model.predict(X)
    else:
        all_scores = best_model.predict_proba(X)[:, 1]

    all_order    = np.argsort(-all_scores)
    all_ranked   = raw_features.iloc[all_order].copy().reset_index(drop=True)
    all_ranked["actual_churn"]      = y.values[all_order]
    all_ranked["churn_probability"] = all_scores[all_order]

    top10_n_all    = max(1, int(0.10 * len(all_ranked)))
    total_churn_all = int(all_ranked["actual_churn"].sum())
    captured_all    = int(all_ranked.head(top10_n_all)["actual_churn"].sum())
    top_10          = all_ranked.head(top10_n_all).copy()

    # ── Feature importance (from RF) ───────────────────────────────────────
    feat_imp = (
        pd.DataFrame({"feature": X.columns, "importance": rf.feature_importances_})
        .sort_values("importance", ascending=False)
    )

    # ── Model comparison table ─────────────────────────────────────────────
    named_model_rows = []
    for m_name, (auc_v, cap_v, _) in model_scores.items():
        suffix = " ✅" if m_name == best_name else ""
        named_model_rows.append({
            "model":           f"{m_name}{suffix}",
            "roc_auc":         round(float(auc_v), 4),
            "top10_capture":   round(float(cap_v * 100), 2),
        })

    expected_churners = int(round(capture_rate * total_churn_all))
    expected_churners = max(0, min(expected_churners, top10_n_all))
    expected_churn_rate = float(expected_churners / top10_n_all) if top10_n_all > 0 else 0.0

    return {
        # metadata
        "target_column":    target_column,
        "total_customers":  len(source_df),
        "churn_rate":       float(y.mean()),
        "source_df":        source_df.copy(),
        "target_series":    y.copy(),
        # AUC scores
        "lr_auc":           float(lin_auc),
        "xgb_auc":          float(xgb_auc),
        "rf_auc":           float(rf_auc),
        # best model
        "best_model":       best_name,
        "best_model_auc":   float(best_auc),
        "capture_rate":     float(capture_rate),
        # ROC data
        "lr_roc":           {"fpr": lr_fpr.tolist(),  "tpr": lr_tpr.tolist()},
        "xgb_roc":          {"fpr": xgb_fpr.tolist(), "tpr": xgb_tpr.tolist()},
        "rf_roc":           {"fpr": rf_fpr.tolist(),  "tpr": rf_tpr.tolist()},
        # gain chart
        "gain_population_pct": sorted_results["population_pct"].tolist(),
        "gain_capture_rate":   sorted_results["cumulative_capture_rate"].tolist(),
        # feature + model tables
        "feature_importance": feat_imp.to_dict(orient="records"),
        "model_comparison":   named_model_rows,
        # ranking data
        "results":             all_ranked,
        "top_10":              top_10,
        "top_10_n":            int(top10_n_all),
        "total_churners":      int(total_churn_all),
        "captured_in_top10":   int(captured_all),
        # ROI / A-B
        "expected_churners_in_top10":    int(expected_churners),
        "expected_churn_rate_in_top10":  float(expected_churn_rate),
    }
