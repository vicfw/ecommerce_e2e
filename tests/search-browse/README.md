# Search browse

## What it checks

Without login, category and brand listing show the seeded sachet, mobile search reaches that product’s PDP, and a nonsense query shows **محصولی یافت نشد**.

## Workflow

One test, in order: open `/category/saffron` and assert the sachet name; open `/brands/aqeleh` and assert it again; on the homepage open mobile search (`aria-label` **جستجو در محصولات**), type `زعفران پاکتی`, open a suggestion to the PDP; open `/search?q=zzzz-no-such-product` and assert empty results.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Storefront running (Playwright webServer / local)
- Port **9000** must be free so Playwright can start the API (webServer config)
- Category slug `saffron`, brand slug `aqeleh`
- Product slug `aqeleh-saffron-sachet-4-grams` (`زعفران پاکتی عاقله - 4 گرم`) indexed or available via search fallback

## Rows this run writes and does not delete

None. No register, cart writes, or orders.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/search-browse
```
