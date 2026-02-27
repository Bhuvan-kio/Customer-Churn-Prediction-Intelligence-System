"""
Domain-Adaptive Customer Churn Prediction  —  FastAPI Backend
═══════════════════════════════════════════════════════════════
Trains Linear Regression + XGBoost + Random Forest for every supported
domain (Telecom / Banking / E-Commerce) at startup.

All endpoints accept an optional  ?domain=<key>  query param
(default: "telecom").  The frontend passes the user-selected domain.

Domains are registered in backend/services/domain_router.py.
To add a new domain create a pipeline module and register it there.
"""

import numpy as np
import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.services.domain_router import (
    VALID_DOMAINS,
    get_retention_playbook,
    get_risk_rows,
    get_store,
    train_all,
)

# ─── App setup ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Domain-Adaptive Churn Risk Intelligence API",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request / Response models ───────────────────────────────────────────────

class ROIRequest(BaseModel):
    domain:               str   = "telecom"
    avg_revenue:          float = 500.0
    offer_cost:           float = 50.0
    churn_reduction_pct:  float = 30.0


class ABRequest(BaseModel):
    domain:               str   = "telecom"
    churn_reduction_pct:  float = 30.0


class OptimizePortfolioRequest(BaseModel):
    domain: str = "telecom"
    budget: float = 50000.0


# ─── Startup ─────────────────────────────────────────────────────────────────


@app.on_event("startup")
def startup_event() -> None:
    train_all()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _domain_param(domain: str) -> str:
    """Validate and normalise domain param (raise 422 on unknown value)."""
    key = domain.lower().strip()
    if key not in VALID_DOMAINS:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown domain '{domain}'. Valid: {VALID_DOMAINS}",
        )
    return key


def _safe_rate(num: float, den: float) -> float:
    return float(num / den) if den else 0.0


def _priority_model(priority: str) -> dict:
    defaults = {
        "reach_pct": 0.12,
        "lift_pct": 0.08,
        "cost_per_customer": 45.0,
        "severity": "medium",
    }
    table = {
        "Critical": {
            "reach_pct": 0.26,
            "lift_pct": 0.22,
            "cost_per_customer": 95.0,
            "severity": "critical",
        },
        "High": {
            "reach_pct": 0.18,
            "lift_pct": 0.14,
            "cost_per_customer": 70.0,
            "severity": "high",
        },
        "Medium": defaults,
    }
    return table.get(priority, defaults)


def _format_ratio(churners: int, non_churners: int) -> str:
    if churners <= 0:
        return "N/A"
    return f"1 : {round(non_churners / churners, 1)}"


def _breakdown_from_series(series: pd.Series, target: pd.Series, label: str) -> dict:
    temp = pd.DataFrame({"segment": series.astype(str), "churn": target.astype(int)})
    grp = (
        temp.groupby("segment", dropna=False)
        .agg(customers=("churn", "size"), churners=("churn", "sum"))
        .reset_index()
    )
    grp["churn_rate"] = grp["churners"] / grp["customers"].clip(lower=1)
    grp = grp.sort_values("churn_rate", ascending=False)
    return {
        "title": label,
        "rows": [
            {
                "segment": str(r["segment"]),
                "customers": int(r["customers"]),
                "churners": int(r["churners"]),
                "churn_rate": round(float(r["churn_rate"] * 100), 2),
            }
            for _, r in grp.iterrows()
        ],
    }


def _build_overview_analytics(store: dict) -> dict:
    domain = store["domain"]
    df: pd.DataFrame = store["source_df"].copy()
    target = store["target_series"].copy().astype(int)
    n = len(df)

    # 1) Data health panel
    total_cells = int(df.shape[0] * df.shape[1])
    missing_pct = round(float((df.isna().sum().sum() / total_cells) * 100), 2) if total_cells else 0.0
    duplicate_records = int(df.duplicated().sum())
    duplicate_pct = round(_safe_rate(duplicate_records, n) * 100, 2)

    churners = int(target.sum())
    non_churners = int(n - churners)
    churn_rate_pct = round(_safe_rate(churners, n) * 100, 2)

    # 2) Class imbalance
    class_distribution = [
        {"name": "Non-Churn", "count": non_churners},
        {"name": "Churn", "count": churners},
    ]

    # 3) Segmentation snapshots
    segmentations: list[dict] = []
    if domain == "bank":
        if "Geography" in df.columns:
            geo_map = {0: "France", 1: "Germany", 2: "Spain"}
            geo = df["Geography"].map(geo_map).fillna(df["Geography"].astype(str))
            segmentations.append(_breakdown_from_series(geo, target, "Churn by Geography"))
        if "Age" in df.columns:
            age_groups = pd.cut(
                pd.to_numeric(df["Age"], errors="coerce").fillna(0),
                bins=[0, 29, 39, 49, 59, 120],
                labels=["<30", "30-39", "40-49", "50-59", "60+"],
                include_lowest=True,
            )
            segmentations.append(_breakdown_from_series(age_groups.astype(str), target, "Churn by Age Group"))
        if "NumOfProducts" in df.columns:
            segmentations.append(_breakdown_from_series(df["NumOfProducts"], target, "Churn by Product Count"))
    elif domain == "ecommerce":
        if "CityTier" in df.columns:
            segmentations.append(_breakdown_from_series(df["CityTier"], target, "Churn by City Tier"))
        if "Tenure" in df.columns:
            tenure_group = pd.cut(
                pd.to_numeric(df["Tenure"], errors="coerce").fillna(0),
                bins=[-1, 1, 5, 100],
                labels=["0-1", "2-5", "6+"],
                include_lowest=True,
            )
            segmentations.append(_breakdown_from_series(tenure_group.astype(str), target, "Churn by Tenure Group"))
        if "Complain" in df.columns:
            comp = df["Complain"].map({0: "No Complaint", 1: "Complaint Raised"}).fillna(df["Complain"].astype(str))
            segmentations.append(_breakdown_from_series(comp, target, "Churn by Complaint Status"))
    else:  # telecom
        if "international plan" in df.columns:
            segmentations.append(_breakdown_from_series(df["international plan"], target, "Churn by International Plan"))
        if "customer service calls" in df.columns:
            calls = pd.to_numeric(df["customer service calls"], errors="coerce").fillna(0)
            call_bucket = pd.cut(
                calls,
                bins=[-1, 1, 3, 20],
                labels=["0-1", "2-3", "4+"],
                include_lowest=True,
            )
            segmentations.append(_breakdown_from_series(call_bucket.astype(str), target, "Churn by Service Call Band"))
        if "voice mail plan" in df.columns:
            segmentations.append(_breakdown_from_series(df["voice mail plan"], target, "Churn by Voice Mail Plan"))

    # 4) Feature distribution insight (top churn differences)
    numeric_cols = [
        c for c in df.select_dtypes(include=[np.number]).columns
        if c.lower() not in {"id", "rownumber", "customerid"}
        and "id" not in c.lower()
    ]

    diff_rows: list[dict] = []
    for col in numeric_cols:
        churn_vals = pd.to_numeric(df.loc[target == 1, col], errors="coerce").dropna()
        non_vals = pd.to_numeric(df.loc[target == 0, col], errors="coerce").dropna()
        if churn_vals.empty or non_vals.empty:
            continue
        churn_avg = float(churn_vals.mean())
        non_avg = float(non_vals.mean())
        gap = churn_avg - non_avg
        std = float(pd.to_numeric(df[col], errors="coerce").std())
        effect = abs(gap) / (std if std > 1e-9 else 1.0)
        diff_rows.append({
            "feature": col,
            "churn_avg": round(churn_avg, 3),
            "non_churn_avg": round(non_avg, 3),
            "gap": round(gap, 3),
            "effect_size": round(effect, 3),
            "direction": "Higher among churners" if gap > 0 else "Lower among churners",
        })
    diff_rows = sorted(diff_rows, key=lambda r: r["effect_size"], reverse=True)[:8]

    # 5) Risk heatmap (correlation matrix)
    heat_features = [r["feature"] for r in diff_rows[:6]]
    if len(heat_features) < 3:
        heat_features = numeric_cols[:6]
    heat_df = df[heat_features].copy() if heat_features else pd.DataFrame()
    heat_df["Churn"] = target
    corr = heat_df.corr(numeric_only=True).fillna(0)
    heat_labels = corr.columns.tolist()
    heat_matrix = [
        [round(float(corr.loc[row, col]), 3) for col in heat_labels]
        for row in heat_labels
    ]
    churn_corr = [
        {"feature": c, "corr": round(float(corr.loc[c, "Churn"]), 3)}
        for c in heat_labels
        if c != "Churn"
    ]
    churn_corr = sorted(churn_corr, key=lambda x: abs(x["corr"]), reverse=True)[:3]

    # 6) High-risk customer profile summary (auto text)
    profile_points = []
    for row in diff_rows[:3]:
        profile_points.append(
            f"{row['feature']}: {row['direction']} ({row['churn_avg']} vs {row['non_churn_avg']})."
        )

    if domain == "telecom" and "customer service calls" in df.columns:
        mask = pd.to_numeric(df["customer service calls"], errors="coerce").fillna(0) >= 4
        high_rate = round(_safe_rate(int(target[mask].sum()), int(mask.sum())) * 100, 2) if int(mask.sum()) else 0.0
        profile_points.insert(0, f"Customers with 4+ customer service calls churn at {high_rate}% in this dataset.")
    elif domain == "bank" and "SupportTickets" in df.columns:
        mask = pd.to_numeric(df["SupportTickets"], errors="coerce").fillna(0) >= 3
        high_rate = round(_safe_rate(int(target[mask].sum()), int(mask.sum())) * 100, 2) if int(mask.sum()) else 0.0
        profile_points.insert(0, f"Customers with 3+ support tickets churn at {high_rate}% in this dataset.")
    elif domain == "ecommerce" and "Tenure" in df.columns:
        mask = pd.to_numeric(df["Tenure"], errors="coerce").fillna(0) <= 1
        high_rate = round(_safe_rate(int(target[mask].sum()), int(mask.sum())) * 100, 2) if int(mask.sum()) else 0.0
        profile_points.insert(0, f"Customers with tenure 0-1 churn at {high_rate}% in this dataset.")

    return {
        "data_health": {
            "missing_values_pct": missing_pct,
            "duplicate_records_pct": duplicate_pct,
            "duplicate_records_count": duplicate_records,
            "class_imbalance_churn_pct": churn_rate_pct,
            "rows": n,
            "columns": int(df.shape[1]),
        },
        "class_imbalance": {
            "distribution": class_distribution,
            "ratio": _format_ratio(churners, non_churners),
            "churners": churners,
            "non_churners": non_churners,
            "note": "Model training uses stratified split and class-balancing methods (class_weight / scale_pos_weight).",
        },
        "segmentations": segmentations[:3],
        "feature_differences": diff_rows,
        "risk_heatmap": {
            "labels": heat_labels,
            "matrix": heat_matrix,
            "top_churn_correlations": churn_corr,
        },
        "high_risk_profile": {
            "summary": "High-risk customers are identified by converging behavioral and service-friction signals rather than a single variable.",
            "points": profile_points,
        },
    }


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/domains")
def list_domains() -> dict:
    """Return all available domains for the frontend dropdown."""
    return {
        "domains": [
            {"key": k, "label": get_store(k)["domain_label"]}
            for k in VALID_DOMAINS
        ]
    }


@app.get("/api/kpis")
def get_kpis(domain: str = Query("telecom")) -> dict:
    s = get_store(_domain_param(domain))
    return {
        "total_customers": s["total_customers"],
        "churn_rate":      round(s["churn_rate"] * 100, 2),
        "model_auc":       round(s["best_model_auc"], 4),
        "baseline_auc":    round(s["lr_auc"], 4),
        "best_model":      s["best_model"],
        "dataset":         s["dataset_name"],
        "domain":          s["domain"],
        "domain_label":    s["domain_label"],
    }


@app.get("/api/overview-analytics")
def get_overview_analytics(domain: str = Query("telecom")) -> dict:
    s = get_store(_domain_param(domain))
    return _build_overview_analytics(s)


@app.get("/api/model-performance")
def get_model_performance(domain: str = Query("telecom")) -> dict:
    s = get_store(_domain_param(domain))
    return {
        "lr_roc":              s["lr_roc"],
        "xgb_roc":             s["xgb_roc"],
        "rf_roc":              s["rf_roc"],
        "lr_auc":              round(s["lr_auc"], 4),
        "xgb_auc":             round(s["xgb_auc"], 4),
        "rf_auc":              round(s["rf_auc"], 4),
        "capture_rate_top10":  round(s["capture_rate"] * 100, 2),
        "gain_population_pct": s["gain_population_pct"],
        "gain_capture_rate":   s["gain_capture_rate"],
        "best_model":          s["best_model"],
    }


@app.get("/api/model-comparison")
def get_model_comparison(domain: str = Query("telecom")) -> dict:
    s = get_store(_domain_param(domain))
    return {"models": s["model_comparison"]}


@app.get("/api/feature-importance")
def get_feature_importance(domain: str = Query("telecom")) -> dict:
    s = get_store(_domain_param(domain))
    _insights: dict[str, str] = {
        "telecom": (
            "Call-centre intensity, international usage patterns, and voice-mail behaviour "
            "are the strongest churn indicators. Proactively outreach customers with high "
            "service-call volume and tailor retention offers for heavy international-usage segments."
        ),
        "bank": (
            "Account balance, number of products, and member activity status are the primary "
            "churn drivers. Inactive customers with zero balance and a single product represent "
            "the highest exit risk and should be re-engaged first."
        ),
        "ecommerce": (
            "Tenure, complaint history, and satisfaction score dominate churn prediction. "
            "Recent customers who have lodged complaints and show low satisfaction are the "
            "most urgent intervention targets."
        ),
    }
    return {
        "features": s["feature_importance"],
        "insight":  _insights.get(s["domain"], "Domain-specific churn drivers shown above."),
    }


@app.get("/api/risk-ranking")
def get_risk_ranking(domain: str = Query("telecom")) -> dict:
    key  = _domain_param(domain)
    rows = get_risk_rows(key)
    return {"customers": rows, "total_in_segment": len(rows)}


@app.get("/api/retention-playbook")
def get_retention_playbook_endpoint(domain: str = Query("telecom")) -> dict:
    key        = _domain_param(domain)
    strategies = get_retention_playbook(key)
    return {"strategies": strategies}


@app.post("/api/optimize-retention-portfolio")
def optimize_retention_portfolio(req: OptimizePortfolioRequest) -> dict:
    key = _domain_param(req.domain)
    budget = max(1000.0, float(req.budget))
    strategies = get_retention_playbook(key)
    rows = get_risk_rows(key)

    total_customers = len(rows)
    avg_risk_prob = float(np.mean([float(r.get("churn_probability", 0.0)) for r in rows])) if rows else 0.45
    avg_revenue = float(np.mean([float(r.get("revenue_estimate", 0.0)) for r in rows])) if rows else 500.0

    enriched: list[dict] = []
    for idx, strategy in enumerate(strategies):
        model = _priority_model(str(strategy.get("priority", "Medium")))
        targeted = max(1, int(round(total_customers * model["reach_pct"])))
        prevented = float(targeted * avg_risk_prob * model["lift_pct"])
        cost = float(targeted * model["cost_per_customer"])
        net = float(prevented * avg_revenue - cost)
        score = float((net / cost) if cost > 0 else net)
        enriched.append({
            "strategy_id": idx,
            "priority": strategy.get("priority", "Medium"),
            "condition": strategy.get("condition", ""),
            "severity": model["severity"],
            "targeted_customers": targeted,
            "prevented_churners": round(prevented, 3),
            "estimated_cost": round(cost, 2),
            "estimated_net_impact": round(net, 2),
            "roi_percent": round(float((net / cost * 100) if cost > 0 else 0.0), 2),
            "score": round(score, 4),
        })

    ranked = sorted(enriched, key=lambda s: s["score"], reverse=True)
    remaining = budget
    selected_ids: list[int] = []
    for row in ranked:
        if row["estimated_cost"] <= remaining:
            selected_ids.append(int(row["strategy_id"]))
            remaining -= float(row["estimated_cost"])

    selected = [s for s in enriched if s["strategy_id"] in selected_ids]
    covered = int(sum(float(s["targeted_customers"]) for s in selected))
    prevented = float(sum(float(s["prevented_churners"]) for s in selected))
    cost = float(sum(float(s["estimated_cost"]) for s in selected))
    net = float(sum(float(s["estimated_net_impact"]) for s in selected))
    baseline_churners = float(total_customers * avg_risk_prob)
    reduction_pct = float((prevented / baseline_churners * 100) if baseline_churners > 0 else 0.0)

    return {
        "domain": key,
        "budget": round(float(budget), 2),
        "selected_strategy_ids": selected_ids,
        "strategy_metrics": enriched,
        "portfolio_summary": {
            "active_strategies": len(selected_ids),
            "estimated_customers_covered": covered,
            "estimated_prevented_churners": round(prevented, 2),
            "estimated_cost": round(cost, 2),
            "estimated_net_impact": round(net, 2),
            "suggested_churn_reduction_pct": round(max(5.0, min(80.0, reduction_pct)), 2),
        },
    }


@app.post("/api/roi-simulation")
def roi_simulation(req: ROIRequest) -> dict:
    s = get_store(_domain_param(req.domain))
    churners_targeted = s["expected_churners_in_top10"]
    num_targeted      = s["top_10_n"]
    reduction   = req.churn_reduction_pct / 100.0
    saved       = churners_targeted * reduction
    rev_saved   = saved * req.avg_revenue
    offer_cost  = num_targeted * req.offer_cost
    net_profit  = rev_saved - offer_cost
    roi_pct     = (net_profit / offer_cost * 100) if offer_cost > 0 else 0.0
    return {
        "customers_targeted":        num_targeted,
        "churners_in_segment":       churners_targeted,
        "churners_in_segment_basis": "estimated_from_holdout_capture",
        "churners_saved":            round(saved, 1),
        "revenue_saved":             round(rev_saved, 2),
        "offer_cost":                round(offer_cost, 2),
        "net_profit":                round(net_profit, 2),
        "roi_percent":               round(roi_pct, 2),
    }


@app.post("/api/ab-test")
def ab_test_simulation(req: ABRequest) -> dict:
    s   = get_store(_domain_param(req.domain))
    top = s["top_10"].copy()
    np.random.seed(42)
    top["group"] = np.random.choice(["control", "treatment"], size=len(top))
    control   = top[top["group"] == "control"]
    treatment = top[top["group"] == "treatment"]
    ctrl_rate         = s["expected_churn_rate_in_top10"]
    reduction         = req.churn_reduction_pct / 100.0
    treat_rate        = ctrl_rate * (1 - reduction)
    abs_reduction     = ctrl_rate - treat_rate
    rel_reduction     = (abs_reduction / ctrl_rate * 100) if ctrl_rate > 0 else 0.0
    return {
        "control_group_size":   len(control),
        "treatment_group_size": len(treatment),
        "control_churn_rate":   round(ctrl_rate * 100, 2),
        "treatment_churn_rate": round(treat_rate * 100, 2),
        "absolute_reduction":   round(abs_reduction * 100, 2),
        "relative_reduction":   round(rel_reduction, 2),
    }

