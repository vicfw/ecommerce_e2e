# Change phone

## What it checks

A logged-in shopper can change their phone number via OTP and see the new number on personal info.

## Workflow

One test, in order: register and login, open personal info, request a change to a new unused phone, capture the OTP from the API response, verify the code, assert the new number is shown on the page.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Storefront running (Playwright webServer / local)
- Port **9000** must be free so Playwright can start the API (webServer config)

No catalog seed or admin login is required for this scenario.

## Rows this run writes and does not delete

Creates a user row for the random phone when registering. The same row’s `phoneNumber` is updated to a second random phone. Neither row is deleted.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/change-phone
```
