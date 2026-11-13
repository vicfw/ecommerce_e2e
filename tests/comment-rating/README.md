# Comment rating

## What it checks

A logged-in shopper can submit a 1–5 star comment; after image upload the submit button stays reachable (scroll into viewport); the PDP average stays unchanged until an admin approves it, then shows the updated score. Buyer images on PDP use plain `<img>` so a bad host cannot crash the comment section.

## Workflow

One test, in order: register, open seeded PDP (assert `0.0`), submit a rated comment (upload stubbed), assert average still `0.0`, admin approves, reload PDP and assert the new average.

## Viewport

- Shopper: 390×844
- Admin: 1280×720

## Data that must already exist

- Postgres and Redis up
- Catalog seed applied (`bun run db:seed` in `ecommerce_backend`)
- Migration `0009_comment_ratings` applied
- Product slug `aqeleh-saffron-sachet-4-grams`
- Admin phone `09362712519`
- Port **9000** free so Playwright can start the API

## Rows this run writes and does not delete

- One user (random `0912…` phone)
- One pending-then-approved comment with rating `5` on the seeded SKU

Nothing is deleted afterward.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/comment-rating
```
