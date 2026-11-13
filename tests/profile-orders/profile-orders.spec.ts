import { expect, test, type Page } from "@playwright/test";
import { registerAndLogin, SHOP, stubZibalReturn } from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const PRODUCT_NAME = "زعفران پاکتی عاقله - 4 گرم";

const shopperViewport = { width: 390, height: 844 };

async function pickFirstComboboxOption(page: Page, nth: number) {
  await page.getByRole("combobox").nth(nth).click();
  await page.getByRole("option").first().click();
}

test("profile orders list and detail", async ({ browser }) => {
  const firstName = "E2E";
  const lastName = `Orders${Date.now().toString().slice(-6)}`;

  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  await registerAndLogin(page);

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await page.goto(`${SHOP}/cart`);
  await page.getByRole("link", { name: "ثبت" }).click();
  await page.waitForURL(/\/profile\/personal-info/);

  const identityDialog = page
    .locator('[role="dialog"]')
    .filter({ hasText: "ثبت اطلاعات شناسایی" })
    .last();
  await expect(identityDialog).toBeVisible();
  const identityFields = identityDialog.locator("input");
  await identityFields.nth(0).fill(firstName);
  await identityFields.nth(1).fill(lastName);
  await identityDialog.locator("form").evaluate((form) =>
    (form as HTMLFormElement).requestSubmit()
  );
  await page.waitForURL(/\/shipping/);

  const addressDialog = page.getByRole("dialog", { name: "انتخاب آدرس" });
  await expect(addressDialog).toBeVisible();
  await addressDialog.getByPlaceholder("آدرس خود را وارد نمایید").fill(
    "خیابان تست پلاک ۱۲ واحد ۳"
  );
  await pickFirstComboboxOption(page, 0);
  await pickFirstComboboxOption(page, 1);
  const addressInputs = addressDialog.locator(
    "form input:not([type='checkbox'])"
  );
  await addressInputs.nth(0).fill("محله تست");
  await addressInputs.nth(1).fill("12");
  await addressInputs.nth(3).fill("1234567890");
  await addressDialog.getByRole("button", { name: "ثبت آدرس" }).click();
  await expect(page.getByText("آدرس جدید با موفقیت ایجاد شد", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "تایید و تکمیل سفارش" }).click();
  await page.waitForURL(/\/payment/);

  await stubZibalReturn(page, "1");

  const loaderUrlPromise = page.waitForURL(/\/payment\/loader/);
  await page.getByRole("button", { name: "پرداخت" }).click();
  await loaderUrlPromise;
  const orderId = new URL(page.url()).searchParams.get("orderId");
  expect(orderId).toMatch(/^\d+$/);

  await expect(page.getByText("سفارش شما با موفقیت انجام شد.", { exact: true })).toBeVisible({
    timeout: 60_000,
  });

  await page.goto(`${SHOP}/profile/orders?activeTab=processing`);
  await expect(page.getByText("جاری").first()).toBeVisible();
  await expect(page.getByText(orderId!, { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });

  await page.getByText("نمایش جزئیات").first().click();
  await page.waitForURL(new RegExp(`/profile/orders/${orderId}`));

  await expect(page.getByText("جزئیات سفارش").first()).toBeVisible();
  await expect(page.getByText(orderId!, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(PRODUCT_NAME).first()).toBeVisible();

  await shopper.close();
});
