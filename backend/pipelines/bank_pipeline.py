"""
Banking domain pipeline configuration.

Dataset : bank_with_tickets.csv  (Kaggle Bank Churn + support tickets)
Target  : Exited
Customer ID column : CustomerId
Drop before training : RowNumber, CustomerId, Surname
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

# ─── Dataset config ───────────────────────────────────────────────────────────
DISPLAY_NAME  = "Banking"
DATASET_PATH  = Path(__file__).resolve().parent.parent.parent / "bank_with_tickets.csv"
TARGET_COLUMN = "Exited"
DROP_COLUMNS  = ["RowNumber", "CustomerId", "Surname"]   # domain-specific drops


# ─── Domain-specific risk ranking ─────────────────────────────────────────────

def get_risk_rows(top_10: pd.DataFrame) -> list[dict]:
    rows: list[dict] = []

    for idx, row in top_10.iterrows():
        probability   = float(row["churn_probability"])
        risk_band     = "High" if probability >= 0.6 else "Medium"
        credit_score  = float(row.get("CreditScore", 650))
        balance       = float(row.get("Balance", 0))
        products      = int(row.get("NumOfProducts", 1))
        is_active     = int(row.get("IsActiveMember", 1))
        tickets       = float(row.get("SupportTickets", 0))
        salary        = float(row.get("EstimatedSalary", 0))
        age           = float(row.get("Age", 0))
        geography_raw = row.get("Geography", "Unknown")

        if pd.isna(geography_raw):
            geography = "Unknown"
        elif str(geography_raw).strip() in {"0", "1", "2"}:
            geography = {"0": "France", "1": "Germany", "2": "Spain"}[str(geography_raw).strip()]
        elif isinstance(geography_raw, (int, float)) and int(geography_raw) in {0, 1, 2}:
            geography = {0: "France", 1: "Germany", 2: "Spain"}[int(geography_raw)]
        else:
            geography = str(geography_raw)

        if products >= 3:
            plan_type = "Premium Multi-Product"
        elif products == 2:
            plan_type = "Dual Product"
        elif is_active == 0:
            plan_type = "Single Product Inactive"
        else:
            plan_type = "Single Product"

        if tickets >= 3 and is_active == 0:
            action = "Assign dedicated relationship manager and resolve all open support tickets"
        elif credit_score < 580:
            action = "Offer credit improvement programme with personalised financial counselling"
        elif balance == 0.0 and products == 1:
            action = "Re-engagement campaign: savings goal setup and bonus interest offer"
        elif age > 50 and probability >= 0.5:
            action = "Senior loyalty programme: preferential rates and priority service"
        elif probability >= 0.5:
            action = "Proactive outreach with loyalty rewards and premium product upgrade pitch"
        else:
            action = "Include in next quarterly retention outreach wave"

        rows.append({
            "customer_id":       str(int(row.get("CustomerId", idx))),
            "churn_probability": round(probability, 4),
            "risk_score":        round(probability * 100, 1),
            "revenue_estimate":  round(salary * 0.01, 2),   # 1% AUM proxy
            "balance":           round(balance, 2),
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
            "condition": "High Risk + 3+ Support Tickets + Inactive",
            "action":    "Assign relationship manager, resolve all tickets within 72 h, personalised retention call",
            "icon":      "🛟",
            "priority":  "Critical",
        },
        {
            "condition": "High Risk + Credit Score < 580",
            "action":    "Credit-builder programme, financial health review, and reduced-fee product bundle",
            "icon":      "💳",
            "priority":  "High",
        },
        {
            "condition": "High Risk + Zero Balance + Single Product",
            "action":    "Re-engagement drive: auto-savings setup, bonus interest for 3 months, digital nudge series",
            "icon":      "🏦",
            "priority":  "High",
        },
        {
            "condition": "Medium Risk + Inactive Member",
            "action":    "Digital re-activation push via app notification and SMS cashback incentive",
            "icon":      "📱",
            "priority":  "Medium",
        },
        {
            "condition": "Medium Risk + Long Tenure Nearing Exit",
            "action":    "Loyalty milestone reward + premium account upgrade pitch + fee waiver",
            "icon":      "🎖",
            "priority":  "Medium",
        },
    ]
