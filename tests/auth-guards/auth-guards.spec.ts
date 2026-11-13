import { expect, test } from "@playwright/test";
import { SHOP } from "../helpers";

const shopperViewport = { width: 390, height: 844 };

test("auth guards redirect guests from protected routes", async ({
  browser,
}) => {
  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  for (const path of ["/shipping", "/payment", "/profile"]) {
    await page.goto(`${SHOP}${path}`);
    await expect(page).toHaveURL(`${SHOP}/register`);
  }

  await page.goto(`${SHOP}/cart`);
  await expect(page).toHaveURL(`${SHOP}/cart`);

  await shopper.close();
});
