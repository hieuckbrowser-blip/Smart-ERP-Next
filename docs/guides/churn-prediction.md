# AI-powered Customer Churn Prediction

## Overview
The churn prediction module uses a rule‑based model to identify customers likely to stop buying from your business. It analyzes RFM (recency, frequency, monetary) metrics and assigns a churn probability (0‑100%) and a risk segment: **high**, **medium**, or **low**.

## How it works

1. **Data collection** – For each customer, the service looks at orders in the last 12 months.
2. **Metrics calculation**:
   - Recency: days since last purchase
   - Frequency: average orders per month
   - Monetary: total amount spent
3. **Rule‑based scoring**:
   - High risk: recency > 90 days OR (frequency < 0.2 AND total spent < 500k VND) → probability 80‑99%
   - Medium risk: recency between 45‑90 days OR (frequency < 0.5 AND total spent < 2M VND) → probability 40‑79%
   - Low risk: recency < 45 days → probability 5‑30%
4. **Store predictions** in `customer_churn_predictions` table.

## Using the dashboard

- Navigate to **Analytics → Churn Prediction**.
- Click **Run churn prediction** to compute fresh scores for all customers.
- View segment cards (high/medium/low) – click a card to filter the table.
- The table shows each customer’s risk level, probability, and key metrics.
- Use this information to target at‑risk customers with promotions or personalized outreach.

## Scheduling automatic updates

Add a cron job (e.g., weekly) to call `POST /analytics/churn/compute` automatically. Example using Tauri or a separate Node service.

## Customising the model

The logic lives in `churn.service.ts`. You can adjust:
- Risk thresholds (recency days, spend limits, frequency bounds)
- Probability calculation formula
- Segmentation logic

## Limitations

- The model is rule‑based, not machine‑learning trained. For high‑accuracy predictions, you could replace it with a logistic regression model using historical churn data.
- Works best with at least 6 months of order history.
