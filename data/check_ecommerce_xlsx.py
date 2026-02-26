import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier


def top10_capture(y_true, probs):
    order = np.argsort(-probs)
    ys = np.array(y_true)[order]
    n10 = max(1, int(0.10 * len(ys)))
    return ys[:n10].sum() / max(ys.sum(), 1)


df = pd.read_excel("E Commerce Dataset.xlsx", sheet_name="E Comm")

if "Churn" not in df.columns:
    raise ValueError("Expected target column 'Churn' in sheet 'E Comm'.")
target = "Churn"

# target mapping
if pd.api.types.is_numeric_dtype(df[target]):
    y = df[target].astype(int)
else:
    y = (
        df[target]
        .astype(str)
        .str.strip()
        .str.lower()
        .map({"true": 1, "false": 0, "yes": 1, "no": 0, "1": 1, "0": 0, "churn": 1, "not churn": 0})
        .fillna(df[target])
        .astype(int)
    )

X = df.drop(columns=[target]).copy()
for col in ["customer_id", "CustomerID", "customerId", "RowNumber", "row_number", "Surname", "CLIENTNUM"]:
    if col in X.columns:
        X = X.drop(columns=[col])

if "Last_Purchase_Date" in X.columns:
    d = pd.to_datetime(X["Last_Purchase_Date"], errors="coerce")
    ref = d.max()
    X["Days_Since_Last_Purchase"] = (ref - d).dt.days
    X = X.drop(columns=["Last_Purchase_Date"])

num = X.select_dtypes(include=["number"]).columns.tolist()
cat = [c for c in X.columns if c not in num]

prep = ColumnTransformer(
    [
        (
            "num",
            Pipeline([
                ("imp", SimpleImputer(strategy="median")),
                ("sc", StandardScaler()),
            ]),
            num,
        ),
        (
            "cat",
            Pipeline([
                ("imp", SimpleImputer(strategy="most_frequent")),
                ("oh", OneHotEncoder(handle_unknown="ignore")),
            ]),
            cat,
        ),
    ]
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

rows = []

lr = Pipeline([
    ("prep", prep),
    ("m", LogisticRegression(max_iter=3000, class_weight="balanced")),
])
lr.fit(X_train, y_train)
lr_prob = lr.predict_proba(X_test)[:, 1]
rows.append(("Logistic Regression", roc_auc_score(y_test, lr_prob), top10_capture(y_test, lr_prob)))

rf = Pipeline([
    ("prep", prep),
    ("m", RandomForestClassifier(n_estimators=700, class_weight="balanced", random_state=42, n_jobs=-1)),
])
rf.fit(X_train, y_train)
rf_prob = rf.predict_proba(X_test)[:, 1]
rows.append(("Random Forest", roc_auc_score(y_test, rf_prob), top10_capture(y_test, rf_prob)))

X_train_enc = prep.fit_transform(X_train)
X_test_enc = prep.transform(X_test)
neg = int((y_train == 0).sum())
pos = int((y_train == 1).sum())
spw = (neg / pos) if pos > 0 else 1
xgb = XGBClassifier(
    n_estimators=500,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    eval_metric="logloss",
    scale_pos_weight=spw,
    random_state=42,
    n_jobs=-1,
)
xgb.fit(X_train_enc, y_train)
xgb_prob = xgb.predict_proba(X_test_enc)[:, 1]
rows.append(("XGBoost", roc_auc_score(y_test, xgb_prob), top10_capture(y_test, xgb_prob)))

rows = sorted(rows, key=lambda r: r[2], reverse=True)
print("target:", target)
print("shape:", df.shape)
print("churn_rate_pct:", round(y.mean() * 100, 2))
for n, a, c in rows:
    print(f"{n}: AUC={a:.4f}, Top10Capture={c*100:.2f}%")
print("best_capture_pct:", round(rows[0][2] * 100, 2))
print("target_met_40pct:", rows[0][2] >= 0.40)
