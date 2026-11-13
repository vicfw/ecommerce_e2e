import { expect, test } from "@playwright/test";
import { registerAndLogin, SHOP } from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const PRODUCT_NAME = "زعفران پاکتی عاقله - 4 گرم";

const shopperViewport = { width: 390, height: 844 };

test("guest cart merges after register", async ({ browser }) => {
  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await expect(page.getByText("افزوده شد به سبد خرید", { exact: true })).toBeVisible();

  await registerAndLogin(page);

  await page.goto(`${SHOP}/cart`);
  await expect(
    page.getByRole("heading", { name: PRODUCT_NAME })
  ).toBeVisible();

  await shopper.close();
});
