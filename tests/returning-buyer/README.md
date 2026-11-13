# Returning buyer

## What it checks

A shopper who already filled identity and one address can log out, log in again with the same phone, add the sachet, and reach `/payment` without seeing the identity dialog or creating another address. Does not pay.

## Workflow

One test, in order: register, fill identity and address through `/payment`, logout via **خروج**, login with the same phone, add sachet, confirm cart, assert no identity/address dialogs, reach `/payment`.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-saffron-sachet-4-grams` with stock at least 1
- Port **9000** must be free so Playwright can start the API (webServer config)

## Rows this run writes and does not delete

- One user (random `0912…` phone, name filled in the test)
- One default address
- That user's cart with the sachet line (no order)

Nothing is deleted afterward. No order and no stock change.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/returning-buyer
```
