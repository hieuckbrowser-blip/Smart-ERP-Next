# Demand Forecasting API

**Purpose:** Enable AI‑powered inventory demand prediction to reduce stockouts and overstock.

## Endpoint Design

### 1. `GET /analytics/forecast/demand`

**Query parameters:**
- `productId` (optional) – if omitted, returns forecast for all active products
- `days` – forecast horizon in days (default 30, max 90)
- `interval` – granularity: `day`, `week`, `month` (default `day`)

**Response:**
```json
{
  "productId": "uuid",
  "sku": "PRD-001",
  "forecast": [
    {"date": "2026-05-12", "predictedDemand": 42, "lowerBound": 38, "upperBound": 47},
    ...
  ],
  "metrics": {
    "mape": 12.4,
    "recommendedReorderQuantity": 120,
    "confidence": "high"
  }
}
```

### 2. `POST /analytics/forecast/train`

Triggers model retraining using historical sales data (last 365 days). Returns training job ID.

**Response:**
```json
{ "jobId": "uuid", "status": "started" }
```

### 3. `GET /analytics/forecast/train/{jobId}`

Check training status and download model metadata.

**Response:**
```json
{ "status": "completed", "modelVersion": "v2", "trainingDate": "2026-05-11T10:00:00Z" }
```

## Implementation Phases

| Phase | Components | Est. effort |
|-------|------------|-------------|
| 1 | Data pipeline + baseline Prophet model | 2 weeks |
| 2 | XGBoost feature engineering | 2 weeks |
| 3 | API integration + dashboard | 1 week |
| 4 | Automated reorder triggers | 1 week |

**Next action:** Create `apps/api/src/analytics/forecast` module and `apps/web/src/app/analytics/forecast` page.

*Last updated: 2026-05-11* – follows roadmap in `docs/roadmap.md`.
