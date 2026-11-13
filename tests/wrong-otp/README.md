# Wrong OTP

## What it checks

Submitting an incorrect verification code after phone entry does not land on `/`.

## Workflow

One test, in order: open `/register`, submit a fresh phone, capture the real OTP from the API response, enter `0000` (or `1111` if the real code is `0000`), click confirm, assert the URL is still not `/`.

## Viewport

- Shopper: 390×844

## Data that must already exist

- Storefront running (Playwright webServer / local)
- Port **9000** must be free so Playwright can start the API (webServer config)

No catalog seed or admin login is required for this scenario.

## Rows this run writes and does not delete

Creates a user row for the random phone when OTP is requested. That row is not deleted.

## How to run this folder only

From `ecommerce_e2e`:

```bash
pnpm exec playwright test tests/wrong-otp
```
