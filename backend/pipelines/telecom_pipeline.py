"""
Telecom domain pipeline configuration.

Dataset : data/data.csv  (UCI KDD telecom churn)
Target  : churn  (auto-detected)
Customer ID column : "phone number"
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

# ─── Dataset config ───────────────────────────────────────────────────────────
DISPLAY_NAME  = "Telecom"
DATASET_PATH  = Path(__file__).resolve().parent.parent.parent / "data" / "data.csv"
TARGET_COLUMN = None          # auto-detected by core.detect_target_column
DROP_COLUMNS  : list[str] = []  # phone number already in core's common drop list


# ─── Domain-specific risk ranking ─────────────────────────────────────────────

def get_risk_rows(top_10: pd.DataFrame) -> list[dict]:
    rows: list[dict] = []

    for idx, row in top_10.iterrows():
        probability    = float(row["churn_probability"])
        risk_band      = "High" if probability >= 0.6 else "Medium"
        service_calls  = float(row.get("customer service calls", 0))
        intl_plan      = str(row.get("international plan", "")).strip().lower()
        voice_plan     = str(row.get("voice mail plan", "")).strip().lower()
        day_minutes    = float(row.get("total day minutes", 0))
        geography      = str(row.get("state", "Unknown"))
        monthly_rev    = float(
            row.get("total day charge", 0)
            + row.get("total eve charge", 0)
            + row.get("total night charge", 0)
            + row.get("total intl charge", 0)
        )
        balance_proxy  = float(row.get("account length", 0)) * monthly_rev
        if intl_plan == "yes" and voice_plan == "yes":
            plan_type = "International + Voice Mail"
        elif intl_plan == "yes":
            plan_type = "International"
        elif voice_plan == "yes":
            plan_type = "Voice Mail"
        else:
            plan_type = "Standard"

        if service_calls >= 4:
            action = "Priority support callback and issue-resolution plan within 24 hours"
        elif intl_plan == "yes" and day_minutes > 250:
            action = "Offer international plan retention bundle with loyalty discount"
        elif voice_plan == "no" and day_minutes > 220:
            action = "Promote value bundle: voicemail + daytime usage discount"
        elif probability >= 0.5:
            action = "Run personalised save-offer campaign via call and SMS"
        else:
            action = "Monitor and include in next retention wave"

        rows.append({
            "customer_id":       str(row.get("phone number", f"TEL-{idx:04d}")),
            "churn_probability": round(probability, 4),
            "risk_score":        round(probability * 100, 1),
            "revenue_estimate":  round(monthly_rev, 2),
            "balance":           round(balance_proxy, 2),
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
            "condition": "High Risk + 4+ Customer Service Calls",
            "action":    "Immediate specialist callback, root-cause fix, and follow-up confirmation within 48 hours",
            "icon":      "🛟",
            "priority":  "Critical",
        },
        {
            "condition": "High Risk + International Plan User",
            "action":    "Retention bundle with international add-on discount and loyalty credits",
            "icon":      "🌍",
            "priority":  "High",
        },
        {
            "condition": "High Risk + Heavy Daytime Usage",
            "action":    "Offer daytime-usage booster pack at reduced monthly fee",
            "icon":      "📞",
            "priority":  "High",
        },
        {
            "condition": "Medium Risk + No Voice Mail Plan",
            "action":    "Upsell value bundle with voicemail and support guarantees",
            "icon":      "📨",
            "priority":  "Medium",
        },
        {
            "condition": "Medium Risk + Rising Service Interactions",
            "action":    "Trigger proactive care workflow before complaint escalation",
            "icon":      "🧭",
            "priority":  "Medium",
        },
    ]
