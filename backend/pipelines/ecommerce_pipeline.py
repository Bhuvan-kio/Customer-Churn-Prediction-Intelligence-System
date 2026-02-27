"""
E-Commerce domain pipeline configuration.

Dataset : E_comm.csv
Target  : Churn
Customer ID column : CustomerID  (in core common drop list already)
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

# ─── Dataset config ───────────────────────────────────────────────────────────
DISPLAY_NAME  = "E-Commerce"
DATASET_PATH  = Path(__file__).resolve().parent.parent.parent / "E_comm.csv"
TARGET_COLUMN = "Churn"
DROP_COLUMNS  : list[str] = []   # CustomerID already in core common drop list


# ─── Domain-specific risk ranking ─────────────────────────────────────────────

def get_risk_rows(top_10: pd.DataFrame) -> list[dict]:
    rows: list[dict] = []

    for idx, row in top_10.iterrows():
        probability    = float(row["churn_probability"])
        risk_band      = "High" if probability >= 0.6 else "Medium"
        complain       = int(row.get("Complain", 0))
        satisfaction   = float(row.get("SatisfactionScore", 3))
        tenure         = float(row.get("Tenure", 0) or 0)
        order_count    = float(row.get("OrderCount", 1) or 1)
        cashback       = float(row.get("CashbackAmount", 0))
        days_since     = float(row.get("DaySinceLastOrder", 0) or 0)
        city_tier      = row.get("CityTier", "Unknown")
        if pd.isna(city_tier):
            geography = "Unknown"
        else:
            geography = f"Tier {int(city_tier)}" if str(city_tier).strip().isdigit() else str(city_tier)

        # estimated lifetime value proxy: orders × cashback × avg-margin-factor
        ltv = round(order_count * cashback * 3.5, 2)
        if tenure < 3:
            plan_type = "New Customer"
        elif order_count >= 8:
            plan_type = "Loyalty Shopper"
        else:
            plan_type = "Standard"

        if complain == 1 and satisfaction <= 2:
            action = "Immediate complaint resolution + 20 % off next order voucher"
        elif days_since > 30:
            action = "Win-back campaign: personalised product recommendation + free shipping"
        elif satisfaction <= 2:
            action = "Satisfaction survey + escalate to customer success team"
        elif tenure < 3:
            action = "New-customer nurture: onboarding checklist + first loyalty-points bonus"
        elif probability >= 0.5:
            action = "Retention offer: cashback boost or exclusive member discount"
        else:
            action = "Include in next promotional campaign targeting at-risk segment"

        rows.append({
            "customer_id":       str(int(row.get("CustomerID", idx))),
            "churn_probability": round(probability, 4),
            "risk_score":        round(probability * 100, 1),
            "revenue_estimate":  ltv,
            "balance":           round(cashback, 2),
            "geography":         geography,
            "plan_type":         plan_type,
            "risk_band":         risk_band,
            "suggested_action":  action,
        })

    return rows


# ─── Domain-specific retention playbook ──────────────────────────────────────

def get_retention_playbook() -> list[dict]:
    return [
        {
            "condition": "High Risk + Complaint + Satisfaction ≤ 2",
            "action":    "Immediate escalation to customer success, complaint resolution guarantee + compensation voucher",
            "icon":      "🛟",
            "priority":  "Critical",
        },
        {
            "condition": "High Risk + 30+ Days Since Last Order",
            "action":    "Automated win-back: personalised recs, free shipping coupon, limited-time flash-sale access",
            "icon":      "🛍️",
            "priority":  "High",
        },
        {
            "condition": "High Risk + Low Satisfaction Score (≤ 2)",
            "action":    "Proactive satisfaction call, experience improvement offer, loyalty-points top-up",
            "icon":      "⭐",
            "priority":  "High",
        },
        {
            "condition": "Medium Risk + Short Tenure (< 3 months)",
            "action":    "Onboarding booster: guided product tour, first loyalty-tier fast-track, welcome gift",
            "icon":      "🎁",
            "priority":  "Medium",
        },
        {
            "condition": "Medium Risk + Low Coupon Usage",
            "action":    "Personalised coupon offer matched to most-browsed product category",
            "icon":      "🎟️",
            "priority":  "Medium",
        },
    ]
