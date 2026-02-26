import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier


def top10_capture(y_true, probs):
    order = np.argsort(-probs)
    y_sorted = np.array(y_true)[order]
    n10 = int(0.10 * len(y_sorted))
    return y_sorted[:n10].sum() / max(y_sorted.sum(), 1)


df = pd.read_csv("customer_churn_business_dataset.csv")
if "churn" not in df.columns:
    raise ValueError("Expected target column 'churn'")

y = df["churn"].astype(int)
X = df.drop(columns=["churn"]).copy()

for col in ["customer_id", "CustomerID", "customerId", "row_number"]:
    if col in X.columns:
        X = X.drop(columns=[col])

for col in X.columns:
    if X[col].dtype == object:
        low = X[col].astype(str).str.strip().str.lower()
        if low.isin(["yes", "no", "true", "false", "male", "female", "m", "f"]).all():
            X[col] = low.map(
                {
                    "yes": 1,
                    "no": 0,
                    "true": 1,
                    "false": 0,
                    "male": 1,
                    "female": 0,
                    "m": 1,
                    "f": 0,
                }
            ).astype(int)

cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
if cat_cols:
    X = pd.get_dummies(X, columns=cat_cols, drop_first=False, dtype=int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

results = []

lr = Pipeline([
    ("scaler", StandardScaler()),
    ("lr", LogisticRegression(max_iter=3000, class_weight="balanced")),
])
lr.fit(X_train, y_train)
lr_prob = lr.predict_proba(X_test)[:, 1]
results.append(("Logistic Regression", roc_auc_score(y_test, lr_prob), top10_capture(y_test, lr_prob)))

rf = RandomForestClassifier(
    n_estimators=700,
    max_depth=None,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1,
)
rf.fit(X_train, y_train)
rf_prob = rf.predict_proba(X_test)[:, 1]
results.append(("Random Forest", roc_auc_score(y_test, rf_prob), top10_capture(y_test, rf_prob)))

neg = int((y_train == 0).sum())
pos = int((y_train == 1).sum())
scale_pw = (neg / pos) if pos > 0 else 1
xgb = XGBClassifier(
    n_estimators=500,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    eval_metric="logloss",
    scale_pos_weight=scale_pw,
    random_state=42,
    n_jobs=-1,
)
xgb.fit(X_train, y_train)
xgb_prob = xgb.predict_proba(X_test)[:, 1]
results.append(("XGBoost", roc_auc_score(y_test, xgb_prob), top10_capture(y_test, xgb_prob)))

results = sorted(results, key=lambda r: r[2], reverse=True)

print("shape:", df.shape)
print("churn_rate_pct:", round(y.mean() * 100, 2))
for name, auc, cap in results:
    print(f"{name}: AUC={auc:.4f}, Top10Capture={cap*100:.2f}%")
print("best_capture_pct:", round(results[0][2] * 100, 2))
print("target_met_40pct:", results[0][2] >= 0.40)
