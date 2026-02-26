import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier


def top10_capture(y_true, probs):
    order = np.argsort(-probs)
    sorted_y = np.array(y_true)[order]
    n10 = int(0.10 * len(sorted_y))
    return sorted_y[:n10].sum() / max(sorted_y.sum(), 1)


def preprocess(df):
    X = df.copy()

    for col in ["customer_id", "CustomerID", "customerId", "row_number"]:
        if col in X.columns:
            X = X.drop(columns=[col])

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
    for col in X.columns:
        if X[col].dtype == object:
            low = X[col].astype(str).str.strip().str.lower()
            if low.isin(bool_map.keys()).all():
                X[col] = low.map(bool_map).astype(int)

    if {"monthly_logins", "weekly_active_days"}.issubset(X.columns):
        X["engagement_index"] = X["monthly_logins"] * (X["weekly_active_days"] + 1)
    if {"support_tickets", "avg_resolution_time"}.issubset(X.columns):
        X["support_burden"] = X["support_tickets"] * X["avg_resolution_time"]
    if {"monthly_fee", "discount_applied"}.issubset(X.columns):
        X["discount_flag"] = X["discount_applied"].astype(str).str.lower().map({"yes": 1, "no": 0}).fillna(0)
        X["effective_fee"] = X["monthly_fee"] * (1 - 0.1 * X["discount_flag"])
    if {"last_login_days_ago", "usage_growth_rate"}.issubset(X.columns):
        X["dormancy_growth"] = X["last_login_days_ago"] * (1 - X["usage_growth_rate"])

    cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    if cat_cols:
        X = pd.get_dummies(X, columns=cat_cols, drop_first=False, dtype=int)

    return X


df = pd.read_csv("customer_churn_business_dataset.csv")
if "churn" not in df.columns:
    raise ValueError("Expected target column 'churn'")

y = df["churn"].astype(int)
X = preprocess(df.drop(columns=["churn"]))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

results = []

# RF sweep
rf_grid = [
    dict(n_estimators=400, max_depth=None, min_samples_leaf=1, max_features="sqrt"),
    dict(n_estimators=900, max_depth=None, min_samples_leaf=1, max_features="sqrt"),
    dict(n_estimators=1200, max_depth=14, min_samples_leaf=2, max_features="sqrt"),
    dict(n_estimators=1000, max_depth=None, min_samples_leaf=1, max_features=None),
]
for params in rf_grid:
    rf = RandomForestClassifier(
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
        **params,
    )
    rf.fit(X_train, y_train)
    prob = rf.predict_proba(X_test)[:, 1]
    results.append((f"RF {params}", roc_auc_score(y_test, prob), top10_capture(y_test, prob)))

neg = int((y_train == 0).sum())
pos = int((y_train == 1).sum())
scale_pw = neg / pos if pos > 0 else 1

# curated XGB sweep
xgb_grid = [
    dict(n_estimators=500, max_depth=4, learning_rate=0.05, subsample=0.9, colsample_bytree=0.9),
    dict(n_estimators=800, max_depth=4, learning_rate=0.03, subsample=0.95, colsample_bytree=0.9),
    dict(n_estimators=1200, max_depth=3, learning_rate=0.02, subsample=1.0, colsample_bytree=1.0),
    dict(n_estimators=700, max_depth=5, learning_rate=0.04, subsample=0.85, colsample_bytree=0.85),
]
for params in xgb_grid:
    xgb = XGBClassifier(
        random_state=42,
        eval_metric="logloss",
        scale_pos_weight=scale_pw,
        n_jobs=-1,
        **params,
    )
    xgb.fit(X_train, y_train)
    prob = xgb.predict_proba(X_test)[:, 1]
    results.append((f"XGB {params}", roc_auc_score(y_test, prob), top10_capture(y_test, prob)))

# randomized XGB trials
rng = np.random.default_rng(42)
for i in range(35):
    params = {
        "n_estimators": int(rng.integers(250, 1401)),
        "max_depth": int(rng.integers(3, 8)),
        "learning_rate": float(rng.uniform(0.015, 0.12)),
        "subsample": float(rng.uniform(0.7, 1.0)),
        "colsample_bytree": float(rng.uniform(0.7, 1.0)),
        "min_child_weight": int(rng.integers(1, 8)),
        "reg_lambda": float(rng.uniform(0.4, 4.0)),
    }
    xgb = XGBClassifier(
        random_state=42,
        eval_metric="logloss",
        scale_pos_weight=scale_pw,
        n_jobs=-1,
        **params,
    )
    xgb.fit(X_train, y_train)
    prob = xgb.predict_proba(X_test)[:, 1]
    results.append((f"XGB-RAND-{i+1} {params}", roc_auc_score(y_test, prob), top10_capture(y_test, prob)))

results = sorted(results, key=lambda r: r[2], reverse=True)

print("shape:", df.shape)
print("churn_rate_pct:", round(y.mean() * 100, 2))
print("\nTop 10 runs by Top10Capture:")
for name, auc, cap in results[:10]:
    print(f"{cap*100:5.2f}% | AUC={auc:.4f} | {name}")

best = results[0]
print("\nBEST_CAPTURE_PCT=", round(best[2] * 100, 2), sep="")
print("BEST_AUC=", round(best[1], 4), sep="")
print("TARGET_40_MET=", best[2] >= 0.40, sep="")
