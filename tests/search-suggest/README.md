# Search suggest

## What it checks

Without login, the mobile search combobox shows no suggestions for an empty query, and typing a known product name shows a product suggestion that navigates to that product’s PDP.

## Workflow

One test, in order: open the homepage; open mobile search; assert the suggestion listbox is absent while the field is empty; type `زعفران پاکتی`; open the matching product suggestion; assert the PDP for the seeded sachet.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Storefront running (Playwright webServer / local)
- Port **9000** must be free so Playwright can start the API (webServer config)
- Product slug `aqeleh-saffron-sachet-4-grams` (`زعفران پاکتی عاقله - 4 گرم`) available via `/product/suggest` (Meili or ILIKE fallback)

## Rows this run writes and does not delete

None. No register, cart writes, or orders.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/search-suggest
```
