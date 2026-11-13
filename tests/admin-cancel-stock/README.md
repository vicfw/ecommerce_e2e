# Admin cancel stock

## What it checks

After a successful paid gift-SKU order, an admin can set status to `cancelled` via **Update Status**. Sold stock is restored (`applyInventoryForOrderStatus`), so gift quantity matches the pre-pay value.

## Workflow

One test, in order: record gift quantity, register, add gift SKU (identity and address), pay with success stub, admin opens the order by customer name, sets status to `cancelled`, saves **Update Status**, assert status is `cancelled` and gift quantity equals the recorded pre-pay value.

## Viewport

- Shopper: 390×844
- Admin: 1280×720

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-gift-saffron-3-grams-with-cardamom-10-grams-teapot-and-mortar` with stock at least 1 (seed quantity 2)
- Admin phone `09362712519`
- Payment uses the local Zibal stub, not the real gateway
- Port **9000** must be free so Playwright can start the API with stub Zibal URLs

## Rows this run writes and does not delete

- One user (random `0912…` phone, name filled in the test)
- One default address
- One order with one gift line and status `cancelled`
- Gift quantity ends unchanged vs pre-pay (sold then restored)
- That user's cart removed

Nothing is deleted afterward.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/admin-cancel-stock
```
