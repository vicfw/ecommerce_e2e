import { expect, test } from "@playwright/test";
import { registerAndLogin, SHOP } from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const PRODUCT_NAME = "زعفران پاکتی عاقله - 4 گرم";

const shopperViewport = { width: 390, height: 844 };

test("cart qty increment decrement remove", async ({ browser }) => {
  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  await registerAndLogin(page);

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await page.goto(`${SHOP}/cart`);
  await expect(
    page.getByRole("heading", { name: PRODUCT_NAME })
  ).toBeVisible();

  const qtyBox = page.getByTestId("cart-qty-inc").locator("..");
  await expect(qtyBox.getByText("1", { exact: true })).toBeVisible();

  await page.getByTestId("cart-qty-inc").click();
  await expect(qtyBox.getByText("2", { exact: true })).toBeVisible();

  await page.getByTestId("cart-qty-dec").click();
  await expect(qtyBox.getByText("1", { exact: true })).toBeVisible();

  await page.getByTestId("cart-line-remove").click();
  await expect(
    page.getByText("سبد خرید شما خالی است!").filter({ visible: true })
  ).toBeVisible();
  await expect(page.getByTestId("cart-line-remove")).toHaveCount(0);

  await shopper.close();
});
