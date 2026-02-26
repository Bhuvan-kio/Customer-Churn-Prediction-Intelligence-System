"""
Customer Churn Risk Intelligence System — FastAPI Backend
Trains Linear Regression + XGBoost + Random Forest at startup.
Serves ML insights via REST API endpoints.

Dataset: data.csv
Target : churn-like binary column (auto-detected)
"""

from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

app = FastAPI(title="Churn Risk Intelligence API", version="2.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

store: dict = {}


class ROIRequest(BaseModel):
    avg_revenue: float = 500.0
    offer_cost: float = 50.0
    churn_reduction_pct: float = 30.0


class ABRequest(BaseModel):
    churn_reduction_pct: float = 30.0


def detect_target_column(df: pd.DataFrame) -> str:
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

    raise ValueError("Could not detect churn target column in data.csv")


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

    for column in [
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
    ]:
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

    return out.apply(pd.to_numeric, errors="coerce").fillna(0)


def compute_capture(scores: np.ndarray, y_true: pd.Series) -> tuple[float, int, int, int, np.ndarray]:
    order = np.argsort(-scores)
    sorted_y = y_true.values[order]
    n10 = max(1, int(0.10 * len(sorted_y)))
    total_churners = int(sorted_y.sum())
    captured = int(sorted_y[:n10].sum())
    capture = float(captured / total_churners) if total_churners > 0 else 0.0
    return capture, n10, captured, total_churners, order


@app.on_event("startup")
def train_models() -> None:
    dataset_path = Path(__file__).resolve().parent.parent / "data.csv"
    source_df = pd.read_csv(dataset_path)

    target_column = detect_target_column(source_df)
    y = normalize_target(source_df[target_column])
    raw_features = source_df.drop(columns=[target_column]).copy()
    X = preprocess_features(raw_features)

    indices = np.arange(len(source_df))
    train_idx, test_idx = train_test_split(
        indices,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]
    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]
    raw_test = raw_features.iloc[test_idx].reset_index(drop=True)

    linear = LinearRegression()
    linear.fit(X_train, y_train)
    lin_scores = linear.predict(X_test)
    lin_auc = roc_auc_score(y_test, lin_scores)
    lin_capture, _, _, _, _ = compute_capture(lin_scores, y_test)

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
        random_state=42,
        n_jobs=-1,
    )
    xgb.fit(X_train, y_train)
    xgb_scores = xgb.predict_proba(X_test)[:, 1]
    xgb_auc = roc_auc_score(y_test, xgb_scores)
    xgb_capture, _, _, _, _ = compute_capture(xgb_scores, y_test)

    rf = RandomForestClassifier(
        n_estimators=700,
        max_depth=None,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    rf_scores = rf.predict_proba(X_test)[:, 1]
    rf_auc = roc_auc_score(y_test, rf_scores)
    rf_capture, _, _, _, _ = compute_capture(rf_scores, y_test)

    model_scores = {
        "Linear Regression": (lin_auc, lin_capture, lin_scores),
        "XGBoost": (xgb_auc, xgb_capture, xgb_scores),
        "Random Forest": (rf_auc, rf_capture, rf_scores),
    }
    best_model_name = max(model_scores.keys(), key=lambda model: model_scores[model][1])
    best_auc, best_capture, best_prob = model_scores[best_model_name]

    capture_rate, top_10_n, captured_in_top10, total_churners, order = compute_capture(best_prob, y_test)

    lr_fpr, lr_tpr, _ = roc_curve(y_test, lin_scores)
    xgb_fpr, xgb_tpr, _ = roc_curve(y_test, xgb_scores)
    rf_fpr, rf_tpr, _ = roc_curve(y_test, rf_scores)

    sorted_results = raw_test.iloc[order].copy().reset_index(drop=True)
    sorted_results["actual_churn"] = y_test.values[order]
    sorted_results["churn_probability"] = best_prob[order]

    sorted_results["customer_id"] = (
        sorted_results["phone number"].astype(str)
        if "phone number" in sorted_results.columns
        else pd.Series([f"CUST-{i+1:04d}" for i in range(len(sorted_results))])
    )

    sorted_results["cumulative_churn"] = sorted_results["actual_churn"].cumsum()
    sorted_results["cumulative_capture_rate"] = (
        sorted_results["cumulative_churn"] / max(total_churners, 1)
    )
    sorted_results["population_pct"] = np.arange(1, len(sorted_results) + 1) / len(sorted_results)

    top_10 = sorted_results.head(top_10_n).copy()

    feat_imp = pd.DataFrame(
        {
            "feature": X.columns,
            "importance": rf.feature_importances_,
        }
    ).sort_values("importance", ascending=False)

    named_model_rows = []
    for model_name, (auc_value, capture_value, _) in model_scores.items():
        suffix = " ✅" if model_name == best_model_name else ""
        named_model_rows.append(
            {
                "model": f"{model_name}{suffix}",
                "roc_auc": round(float(auc_value), 4),
                "top10_capture": round(float(capture_value * 100), 2),
            }
        )

    store["dataset_name"] = dataset_path.name
    store["target_column"] = target_column
    store["total_customers"] = len(source_df)
    store["churn_rate"] = float(y.mean())

    store["lr_auc"] = float(lin_auc)
    store["xgb_auc"] = float(xgb_auc)
    store["rf_auc"] = float(rf_auc)

    store["best_model"] = best_model_name
    store["best_model_auc"] = float(best_auc)
    store["capture_rate"] = float(capture_rate)

    store["lr_roc"] = {"fpr": lr_fpr.tolist(), "tpr": lr_tpr.tolist()}
    store["xgb_roc"] = {"fpr": xgb_fpr.tolist(), "tpr": xgb_tpr.tolist()}
    store["rf_roc"] = {"fpr": rf_fpr.tolist(), "tpr": rf_tpr.tolist()}

    store["gain_population_pct"] = sorted_results["population_pct"].tolist()
    store["gain_capture_rate"] = sorted_results["cumulative_capture_rate"].tolist()

    store["feature_importance"] = feat_imp.to_dict(orient="records")
    store["model_comparison"] = named_model_rows

    store["results"] = sorted_results
    store["top_10"] = top_10
    store["top_10_n"] = int(top_10_n)
    store["total_churners"] = int(total_churners)
    store["captured_in_top10"] = int(captured_in_top10)

    print(
        f"✅ Models trained — Linear: {lin_auc:.4f} | XGB: {xgb_auc:.4f} | RF: {rf_auc:.4f}"
    )
    print(
        f"🎯 Top 10% capture — Linear: {lin_capture*100:.1f}% | XGB: {xgb_capture*100:.1f}% | RF: {rf_capture*100:.1f}%"
    )
    print(f"🏆 Best model by Top-10 capture: {best_model_name} ({capture_rate*100:.1f}%)")


@app.get("/api/kpis")
def get_kpis() -> dict:
    return {
        "total_customers": store["total_customers"],
        "churn_rate": round(store["churn_rate"] * 100, 2),
        "model_auc": round(store["best_model_auc"], 4),
        "baseline_auc": round(store["lr_auc"], 4),
        "best_model": store["best_model"],
        "dataset": store["dataset_name"],
    }


@app.get("/api/model-performance")
def get_model_performance() -> dict:
    return {
        "lr_roc": store["lr_roc"],
        "xgb_roc": store["xgb_roc"],
        "rf_roc": store["rf_roc"],
        "lr_auc": round(store["lr_auc"], 4),
        "xgb_auc": round(store["xgb_auc"], 4),
        "rf_auc": round(store["rf_auc"], 4),
        "capture_rate_top10": round(store["capture_rate"] * 100, 2),
        "gain_population_pct": store["gain_population_pct"],
        "gain_capture_rate": store["gain_capture_rate"],
        "best_model": store["best_model"],
    }


@app.get("/api/model-comparison")
def get_model_comparison() -> dict:
    return {"models": store["model_comparison"]}


@app.get("/api/feature-importance")
def get_feature_importance() -> dict:
    return {
        "features": store["feature_importance"],
        "insight": (
            "Call-center intensity, international usage patterns, and voice-mail behavior are the strongest churn indicators in this dataset. "
            "Use proactive outreach for customers with high service-call volume, and tailor retention offers for high international-usage segments."
        ),
    }


@app.get("/api/risk-ranking")
def get_risk_ranking() -> dict:
    top = store["top_10"].copy()

    rows = []
    for _, row in top.iterrows():
        probability = float(row["churn_probability"])
        risk_band = "High" if probability >= 0.6 else "Medium"

        service_calls = float(row.get("customer service calls", 0))
        intl_plan = str(row.get("international plan", "")).strip().lower()
        voice_plan = str(row.get("voice mail plan", "")).strip().lower()
        day_minutes = float(row.get("total day minutes", 0))

        monthly_revenue = float(
            row.get("total day charge", 0)
            + row.get("total eve charge", 0)
            + row.get("total night charge", 0)
            + row.get("total intl charge", 0)
        )
        balance_proxy = float(row.get("account length", 0)) * monthly_revenue

        if service_calls >= 4:
            suggested_action = "Priority support callback and issue-resolution plan within 24 hours"
        elif intl_plan == "yes" and day_minutes > 250:
            suggested_action = "Offer international plan retention bundle with loyalty discount"
        elif voice_plan == "no" and day_minutes > 220:
            suggested_action = "Promote value bundle: voicemail + daytime usage discount"
        elif probability >= 0.5:
            suggested_action = "Run personalized save-offer campaign via call and SMS"
        else:
            suggested_action = "Monitor and include in next retention wave"

        rows.append(
            {
                "customer_id": str(row.get("customer_id", row.get("phone number", "UNKNOWN"))),
                "churn_probability": round(probability, 4),
                "risk_score": round(probability * 100, 1),
                "revenue_estimate": round(monthly_revenue, 2),
                "balance": round(balance_proxy, 2),
                "risk_band": risk_band,
                "suggested_action": suggested_action,
            }
        )

    return {"customers": rows, "total_in_segment": len(rows)}


@app.get("/api/retention-playbook")
def get_retention_playbook() -> dict:
    return {
        "strategies": [
            {
                "condition": "High Risk + 4+ Customer Service Calls",
                "action": "Immediate specialist callback, root-cause fix, and follow-up confirmation within 48 hours",
                "icon": "🛟",
                "priority": "Critical",
            },
            {
                "condition": "High Risk + International Plan User",
                "action": "Retention bundle with international add-on discount and loyalty credits",
                "icon": "🌍",
                "priority": "High",
            },
            {
                "condition": "High Risk + Heavy Daytime Usage",
                "action": "Offer daytime-usage booster pack at reduced monthly fee",
                "icon": "📞",
                "priority": "High",
            },
            {
                "condition": "Medium Risk + No Voice Mail Plan",
                "action": "Upsell value bundle with voicemail and support guarantees",
                "icon": "📨",
                "priority": "Medium",
            },
            {
                "condition": "Medium Risk + Rising Service Interactions",
                "action": "Trigger proactive care workflow before complaint escalation",
                "icon": "🧭",
                "priority": "Medium",
            },
        ]
    }


@app.post("/api/roi-simulation")
def roi_simulation(req: ROIRequest) -> dict:
    churners_targeted = store["captured_in_top10"]
    num_targeted = store["top_10_n"]

    reduction_fraction = req.churn_reduction_pct / 100.0
    churners_saved = churners_targeted * reduction_fraction
    revenue_saved = churners_saved * req.avg_revenue
    total_offer_cost = num_targeted * req.offer_cost
    net_profit = revenue_saved - total_offer_cost
    roi_pct = (net_profit / total_offer_cost * 100) if total_offer_cost > 0 else 0

    return {
        "customers_targeted": num_targeted,
        "churners_in_segment": churners_targeted,
        "churners_saved": round(churners_saved, 1),
        "revenue_saved": round(revenue_saved, 2),
        "offer_cost": round(total_offer_cost, 2),
        "net_profit": round(net_profit, 2),
        "roi_percent": round(roi_pct, 2),
    }


@app.post("/api/ab-test")
def ab_test_simulation(req: ABRequest) -> dict:
    top = store["top_10"].copy()
    np.random.seed(42)
    top["group"] = np.random.choice(["control", "treatment"], size=len(top))

    control = top[top["group"] == "control"]
    treatment = top[top["group"] == "treatment"]

    control_churn_rate = float(control["actual_churn"].mean()) if len(control) else 0.0

    reduction_fraction = req.churn_reduction_pct / 100.0
    treatment_churn_rate = (
        float(treatment["actual_churn"].mean()) * (1 - reduction_fraction)
        if len(treatment)
        else 0.0
    )

    absolute_reduction = control_churn_rate - treatment_churn_rate
    relative_reduction = (
        absolute_reduction / control_churn_rate * 100 if control_churn_rate > 0 else 0
    )

    return {
        "control_group_size": len(control),
        "treatment_group_size": len(treatment),
        "control_churn_rate": round(control_churn_rate * 100, 2),
        "treatment_churn_rate": round(treatment_churn_rate * 100, 2),
        "absolute_reduction": round(absolute_reduction * 100, 2),
        "relative_reduction": round(relative_reduction, 2),
    }
