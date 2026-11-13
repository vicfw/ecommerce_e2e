# Admin ship

## What it checks

After a successful paid sachet order, an admin can open that order and set status to `shipped` via **Update Status**. Stock stays deducted (order is not cancelled).

## Workflow

One test, in order: register, add sachet (identity and address), pay with success stub, admin opens the order by customer name, sets status to `shipped`, saves **Update Status**, assert status chip/text is `shipped`.

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
- One order with one line and status `shipped`
- Stock on that SKU down by 1
- That user's cart removed

Nothing is deleted afterward. Reseed or raise quantity when the SKU hits zero.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/admin-ship
```
