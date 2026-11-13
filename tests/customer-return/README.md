# Customer return request

## What it checks

A shopper can request a return only after the order is `delivered`. Admin approve sets the order to `returned` and restores stock. Approve is required before restock; non-delivered orders have no return control.

## Workflow

One test, in order: register, buy gift SKU, pay, open order detail (no return button while processing), admin marks delivered, shopper submits return reason, stock still reduced, admin Approves on Returns, stock restored and shopper sees approved/returned state.

## Viewport

- Shopper: 390×844
- Admin: 1280×720

## Data that must already exist

- Postgres and Redis up
- Migration `0012_return_requests` applied
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-gift-saffron-3-grams-with-cardamom-10-grams-teapot-and-mortar` with stock at least 1
- Payment uses the local Zibal stub
- Port **9000** free so Playwright can start the API with stub Zibal URLs
- Admin phone `09362712519` can log in

## Rows this run writes and does not delete

- One user (random `0912…` phone)
- One address
- One paid order moved `processing` → `delivered` → `returned`
- One `return_requests` row (`approved`)
- Gift SKU quantity down then restored

Nothing is deleted afterward.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/customer-return
```
