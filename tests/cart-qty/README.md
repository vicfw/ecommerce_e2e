# Cart qty

## What it checks

A logged-in shopper can add the seeded sachet, increment quantity to 2, decrement to 1, then remove the line on mobile `/cart`. Does not pay.

## Workflow

One test, in order: register and login, add sachet, open `/cart`, click `cart-qty-inc` (assert `2`), click `cart-qty-dec` (assert `1`), click `cart-line-remove`, assert empty cart.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-saffron-sachet-4-grams` with stock at least 2
- Port **9000** must be free so Playwright can start the API (webServer config)

## Rows this run writes and does not delete

- One user (random `0912…` phone)
- That user's cart ends empty after the line is removed

Nothing is deleted afterward. No order and no stock change.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/cart-qty
```
