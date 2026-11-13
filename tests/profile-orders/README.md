# Profile orders

## What it checks

After a successful paid sachet order, `/profile/orders` lists that order under the processing tab and the order detail page shows the same order (id and product name).

## Workflow

One test, in order: register, add sachet (identity and address), pay with success stub, open orders list, open order detail, assert list and detail.

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
- Stock on that SKU down by 1
- That user's cart removed

Nothing is deleted afterward. Reseed or raise quantity when the SKU hits zero.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/profile-orders
```
