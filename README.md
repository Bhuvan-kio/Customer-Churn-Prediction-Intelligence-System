# Customer Churn Prediction Intelligence System (C.C.P.I.S.)

<div align="center">

![Platform](https://img.shields.io/badge/Platform-Web%20App-10b981?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688?style=for-the-badge&logo=fastapi)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-f59e0b?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge)

**A premium, full-stack AI platform for predicting and preventing customer churn across Telecom, Banking, and E-Commerce domains.**

</div>

---

## Preview

### Intelligence Home
![Intelligence Home](preview/06_landing_page.png)

### Churn Risk Engine (Dark Mode)
![Churn Risk Engine - Dark](preview/01_churn_risk_engine_dark.png)

### ROI Simulator (Light Mode)
![ROI Simulator - Light](preview/02_roi_simulator_light.png)

### Model Intelligence Benchmark
![Model Performance](preview/03_model_performance.png)

### Retention Strategy Playbook
![Retention Playbook](preview/04_retention_playbook.png)

### A/B Testing Center
![A/B Testing](preview/05_ab_testing.png)

---

## Features

| Module | Description |
|---|---|
| **Churn Risk Engine** | Real-time XGBoost churn probability scoring, class distribution, data integrity manifest |
| **High-Risk Ranking** | Filterable customer segment table with geography and revenue filters |
| **Multi-Platform Analysis** | Feature importance across Telecom, Banking, and E-Commerce domains |
| **Model Performance** | ROC-AUC curves, cumulative gain charts, model benchmark table |
| **Retention Playbook** | Strategy cards with projected ROI per customer category |
| **ROI Simulator** | Adjustable intervention sliders with revenue recovery projections |
| **A/B Testing** | Statistical significance testing for retention interventions |
| **Reward System** | Campaign builder for loyal user rewards and at-risk re-engagement |
| **3 Themes** | Dark · Light · AMOLED pitch-black (OLED optimized) |
| **File Upload** | Real CSV/JSON/XLSX drag-and-drop ingest with validation |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend
```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000 --app-dir .
# → http://localhost:8000
```

---

## Tech Stack

**Frontend:** React 18 · Vite · Recharts · Lucide Icons · Custom Glassmorphism CSS

**Backend:** FastAPI · XGBoost · scikit-learn · pandas · NumPy · Uvicorn

**ML Models:** XGBoost (primary) · Random Forest · Logistic Regression

---

## Supported Domains

- **Telecom** — churn from call patterns, data usage, international plans
- **Banking** — at-risk account holders via balance, activity & support signals
- **E-Commerce** — churning shoppers from order history & satisfaction scores

---

## Project Structure

```
hack temp/
├── frontend/
│   ├── src/
│   │   ├── pages/           # All page components
│   │   ├── App.jsx          # Main app with routing & theme engine
│   │   ├── api.js           # Backend API client
│   │   └── index.css        # Glassmorphic design system
│   └── index.html
├── backend/
│   └── main.py              # FastAPI server & ML pipeline
├── preview/                 # App screenshots
└── requirements.txt
```

---

<div align="center">

Built for the Hackathon &nbsp;·&nbsp; **C.C.P.I.S. v4.0**

</div>
