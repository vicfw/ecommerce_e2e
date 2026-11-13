# Out of stock

## What it checks

Admin can set the seeded gift product Quantity to `0`; a shopper who tries to add it on the PDP sees the sold-out alert. Quantity is restored to `2` before the test ends. If Quantity is already the target (e.g. a prior run left it at `0`), the admin edit is skipped — React Admin keeps Save disabled on a pristine form, which would hang Playwright’s click.

Product description is optional in admin and API (seeded products have empty descriptions), so Quantity-only edits can save. Product `slugify` collapses repeated hyphens so saving the gift product keeps the seeded public slug.

## Workflow

One test, in order: admin login, edit gift product Quantity to `0` and save, shopper opens that PDP and clicks add-to-cart, assert sold-out copy, finally admin sets Quantity back to `2`.

## Viewport

- Shopper: 390×844
- Admin: 1280×720

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Product slug `aqeleh-gift-saffron-3-grams-with-cardamom-10-grams-teapot-and-mortar` (seed quantity 2)
- Admin phone `09362712519`
- Port **9000** must be free so Playwright can start the API (webServer config)

## Rows this run writes and does not delete

- No new users or orders
- Gift product Quantity is set to `0` during the run and restored to `2` in `finally`

Nothing is deleted afterward.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/out-of-stock
```
