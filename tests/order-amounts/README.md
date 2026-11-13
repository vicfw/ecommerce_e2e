# Order amounts

## What it checks

Product list price, product discount, delivery, and payable stay consistent from cart through shipping and payment into the paid order API and invoice.

## Workflow

One test, in order: read seeded product and delivery from the API and compute expected totals, register, add one unit, assert cart API and visible price rows, complete identity and address, assert shipping and payment totals (goods + delivery), pay via Zibal stub, assert order API money fields, open invoice and assert payable.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-saffron-sachet-4-grams` (suite setup tops up seeded SKU stock via admin API)
- Delivery cost row (seed cost 45000)
- Admin phone `09362712519`
- Port **9000** free so Playwright can start the API

## Rows this run writes and does not delete

- One user (random `0912…` phone, name filled in the test)
- One default address
- One paid order (`processing`) for that user

Nothing is deleted afterward.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/order-amounts
```
