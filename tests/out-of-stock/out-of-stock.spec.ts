import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  ADMIN,
  loginAdmin,
  productQuantity,
  SHOP,
} from "../helpers";

const GIFT_SLUG =
  "aqeleh-gift-saffron-3-grams-with-cardamom-10-grams-teapot-and-mortar";
const GIFT_EN_NAME =
  "Aqeleh Gift Saffron - 3 grams with Cardamom - 10 grams Teapot and Mortar";

const shopperViewport = { width: 390, height: 844 };
const adminViewport = { width: 1280, height: 720 };

async function setGiftQuantity(
  admin: Page,
  quantity: number,
  request: APIRequestContext
) {
  await admin.goto(`${ADMIN}/#/product`);
  await expect(admin.getByText(GIFT_EN_NAME).first()).toBeVisible({
    timeout: 30_000,
  });
  await admin.getByText(GIFT_EN_NAME).first().click();

  const quantityInput = admin.getByLabel("Quantity");
  await expect(quantityInput).toBeVisible();
  await quantityInput.fill(String(quantity));

  const savePromise = admin.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/product/") &&
      res.request().method() === "PATCH" &&
      res.ok()
  );
  await admin.getByRole("button", { name: "Save" }).click();
  await savePromise;

  await expect
    .poll(() => productQuantity(request, GIFT_SLUG))
    .toBe(quantity);
}

test("out of stock", async ({ browser, request }) => {
  const adminContext = await browser.newContext({ viewport: adminViewport });
  const admin = await adminContext.newPage();
  await loginAdmin(admin);

  try {
    await setGiftQuantity(admin, 0, request);

    const shopper = await browser.newContext({ viewport: shopperViewport });
    const page = await shopper.newPage();

    await page.goto(`${SHOP}/products/${GIFT_SLUG}`);
    await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
    await expect(
      page.getByText("موجودی این محصول تمام شده است")
    ).toBeVisible();

    await shopper.close();
  } finally {
    await setGiftQuantity(admin, 2, request);
    await adminContext.close();
  }
});
