# Auth guards

## What it checks

With no cookies, `/shipping`, `/payment`, and `/profile` redirect to `/register`. `/cart` is not protected and stays on `/cart`.

## Workflow

One test, in order: open each protected path logged out and assert `/register`, then open `/cart` and assert the URL stays `/cart`.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Storefront running (Playwright webServer / local)
- Port **9000** must be free so Playwright can start the API (webServer config)

No catalog seed or admin login is required for this scenario.

## Rows this run writes and does not delete

None. No register, cart writes, or orders.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/auth-guards
```
