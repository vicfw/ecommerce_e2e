# Payment replay

## What it checks

A successful Zibal callback can be opened again on `/payment/loader` and still shows success, while sachet stock drops by exactly 1 (verify idempotency). Stock is read from the public product API after backend catalog invalidation on inventory deduct.

## Workflow

One test, in order: register, add to cart (identity and address), pay with success stub, capture the loader URL, open that URL again, assert success copy and stock down by 1.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-saffron-sachet-4-grams` with stock at least 1
- Payment uses the local Zibal stub, not the real gateway
- Port **9000** must be free so Playwright can start the API with stub Zibal URLs

## Rows this run writes and does not delete

- One user (random `0912…` phone, name filled in the test)
- One default address
- One order with one line and status `processing`
- Stock on that SKU down by 1 (not 2)
- That user's cart removed

Nothing is deleted afterward. Reseed or raise quantity when the SKU hits zero.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/payment-replay
```
