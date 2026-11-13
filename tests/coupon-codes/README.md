# Coupon codes

## What it checks

On payment, a valid coupon lowers the payable total; an expired or under-minimum code shows an error and leaves the total unchanged.

## Workflow

One test, in order: create three coupons via admin API, register, add seeded product, reach payment, try expired then under-minimum (assert error + unchanged total), apply a valid fixed code (assert payable drops).

## Viewport

- Shopper: 390×844

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Migration `0011_coupons` applied
- Product slug `aqeleh-saffron-sachet-4-grams` with stock at least 1
- Admin phone `09362712519`
- Port **9000** free so Playwright can start the API

## Rows this run writes and does not delete

- Three coupon rows (`E2E…` codes)
- One user (random `0912…` phone, name filled in the test)
- One default address
- That user's cart (still open; payment is not completed)

Nothing is deleted afterward.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/coupon-codes
```
