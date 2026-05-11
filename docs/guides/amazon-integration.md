# Amazon SP‑API Integration

This guide explains how to connect your Amazon Seller Central account to Smart ERP Next using the Selling Partner API (SP‑API).

## Prerequisites

- An Amazon Seller Central account with professional selling plan.
- Register as an Amazon Developer and create an SP‑API application.
- Obtain the following credentials:
  - **Client ID** (LWA App ID)
  - **Client Secret** (LWA Client Secret)
  - **Refresh Token** – obtained after the first OAuth flow

## Setup Steps

1. In Smart ERP Next, go to **Settings → E‑commerce**.
2. Click the **Amazon** tab.
3. Fill in the required fields:
   - **Client ID / Client Secret** – from your SP‑API app.
   - **Refresh Token** – generated after authorizing the app for your seller account.
   - **Seller ID** (Merchant ID) – found in your Seller Central account info.
   - **Region** – North America, Europe, or Far East.
4. Click **Save**.

## Sync Behaviour

- **Products**: synced every 30 minutes (cron) or manually via the “Sync now” button. The sync pulls ASINs, titles, prices, and stock quantities.
- **Orders**: synced every 30 minutes. New orders are created in Smart ERP Next with the channel `amazon`.
- **Customers**: derived from order buyer information; separate customer records are not automatically created (Amazon does not provide a dedicated customer list API).

## Webhooks (Optional)

Amazon SP‑API supports notifications via SQS. To enable real‑time updates, configure the `notification` endpoint in your SP‑API application and set up the SQS queue. Webhook handling is beyond the scope of this guide.

## Troubleshooting

- **Invalid token** – ensure your Refresh Token is still valid (expires after 1 year unless refreshed). Re‑authorize the app and generate a new token.
- **Rate limits** – Amazon SP‑API has rate limits. Our sync respects a safe delay and back‑off mechanism.
- **Missing product data** – verify your catalog permissions in the SP‑API app.

## Supported Features

- Product catalog sync (ASIN, title, price, stock, images)
- Order sync (status mapping, total amount, buyer name)
- Basic buyer information extraction

## Limitations

- Amazon does not provide a public customer list API; customers are created on‑the‑fly from order data.
- Inventory sync is one‑way (Amazon → ERP). Two‑way sync (ERP → Amazon) is planned for a future release.
