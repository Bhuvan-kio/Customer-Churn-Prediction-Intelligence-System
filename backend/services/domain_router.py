"""
Domain Router
─────────────
Trains all domains at startup and routes every API call to the correct
domain store.  Add a new domain by:
  1. Creating backend/pipelines/<name>_pipeline.py  (same interface)
  2. Registering it in DOMAIN_PIPELINES below.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from backend.core import detect_target_column, train_domain
from backend.pipelines import (
    bank_pipeline,
    ecommerce_pipeline,
    telecom_pipeline,
)

# ─── Registry ────────────────────────────────────────────────────────────────

DOMAIN_PIPELINES: dict[str, object] = {
    "telecom":   telecom_pipeline,
    "bank":      bank_pipeline,
    "ecommerce": ecommerce_pipeline,
}

DOMAIN_LABELS: dict[str, str] = {
    k: v.DISPLAY_NAME for k, v in DOMAIN_PIPELINES.items()   # type: ignore[attr-defined]
}

VALID_DOMAINS = list(DOMAIN_PIPELINES.keys())

# ─── In-memory stores ────────────────────────────────────────────────────────

_stores: dict[str, dict] = {}


def train_all() -> None:
    """Train all registered domains.  Called once at FastAPI startup."""
    for domain, pipeline in DOMAIN_PIPELINES.items():
        label = DOMAIN_LABELS[domain]
        print(f"🔄  Training [{label}] …")
        df = pd.read_csv(pipeline.DATASET_PATH)                         # type: ignore[attr-defined]

        target = pipeline.TARGET_COLUMN or detect_target_column(df)    # type: ignore[attr-defined]
        drop   = getattr(pipeline, "DROP_COLUMNS", [])

        store  = train_domain(df, target, extra_drop_cols=drop)
        store["domain"]        = domain
        store["domain_label"]  = label
        store["dataset_name"]  = Path(str(pipeline.DATASET_PATH)).name  # type: ignore[attr-defined]

        _stores[domain] = store
        print(
            f"   ✅ {label}: best={store['best_model']} "
            f"AUC={store['best_model_auc']:.4f}  "
            f"Capture={store['capture_rate']*100:.1f}%"
        )


# ─── Public accessors ────────────────────────────────────────────────────────

def get_store(domain: str) -> dict:
    if domain not in _stores:
        raise KeyError(
            f"Unknown domain '{domain}'. Valid choices: {VALID_DOMAINS}"
        )
    return _stores[domain]


def get_risk_rows(domain: str) -> list[dict]:
    store    = get_store(domain)
    pipeline = DOMAIN_PIPELINES[domain]
    return pipeline.get_risk_rows(store["top_10"])                     # type: ignore[attr-defined]


def get_retention_playbook(domain: str) -> list[dict]:
    pipeline = DOMAIN_PIPELINES[domain]
    return pipeline.get_retention_playbook()                           # type: ignore[attr-defined]
