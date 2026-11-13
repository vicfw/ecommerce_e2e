# Guest cart

## What it checks

A logged-out shopper can add the seeded sachet to the cart (`anonCartId`), register, and still see that line on `/cart` after login merges the guest cart. Does not pay.

Backend fix shipped with this scenario: first anon add (no `anonCartId` header) no longer queries Postgres with `NaN`, which previously made guest add-to-cart fail.

## Workflow

One test, in order: open PDP logged out, add to cart, register and login, open `/cart`, assert the sachet line.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-saffron-sachet-4-grams` with stock at least 1
- Port **9000** must be free so Playwright can start the API (webServer config)

## Rows this run writes and does not delete

- One user (random `0912…` phone)
- That user's cart with one sachet line (from the merged anon cart)

Nothing is deleted afterward. No order and no stock change.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/guest-cart
```
