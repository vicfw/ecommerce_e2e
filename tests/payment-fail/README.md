# Payment fail

## What it checks

A new shopper can complete checkout, hit a failed Zibal callback (`success=0`), see **پرداخت لغو شد**, and leave the order `cancelled` with sachet stock unchanged.

## Workflow

One test, in order: register, add to cart (identity and address), pay with fail stub, assert fail title and stock, admin opens the order as `cancelled`.

## Viewport

- Shopper: 390×844
- Admin: 1280×720

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-saffron-sachet-4-grams` with stock at least 1
- Admin phone `09362712519`
- Payment uses the local Zibal stub, not the real gateway
- Port **9000** must be free so Playwright can start the API with stub Zibal URLs

## Rows this run writes and does not delete

- One user (random `0912…` phone, name filled in the test)
- One default address
- One order with one line and status `cancelled`
- Stock on that SKU unchanged (reservation released)

Nothing is deleted afterward.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/payment-fail
```
