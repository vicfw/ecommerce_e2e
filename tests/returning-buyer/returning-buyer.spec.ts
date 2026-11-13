import { expect, test, type Page } from "@playwright/test";
import { loginWithPhone, registerAndLogin, SHOP } from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";

const shopperViewport = { width: 390, height: 844 };

async function pickFirstComboboxOption(page: Page, nth: number) {
  await page.getByRole("combobox").nth(nth).click();
  await page.getByRole("option").first().click();
}

test("returning buyer skips identity and address", async ({ browser }) => {
  const firstName = "E2E";
  const lastName = `Return${Date.now().toString().slice(-6)}`;

  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  const { phone } = await registerAndLogin(page);

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

  await page.goto(`${SHOP}/profile`);
  await page.getByRole("button", { name: "خروج" }).click();
  await page.waitForURL((url) => url.pathname === "/");

  await loginWithPhone(page, phone);

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await page.goto(`${SHOP}/cart`);
  await page.getByRole("link", { name: "ثبت" }).click();
  await page.waitForURL(/\/shipping/);

  await expect(
    page
      .locator('[role="dialog"]')
      .filter({ hasText: "ثبت اطلاعات شناسایی" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "انتخاب آدرس" })
  ).toHaveCount(0);

  await page.getByRole("link", { name: "تایید و تکمیل سفارش" }).click();
  await page.waitForURL(/\/payment/);

  await shopper.close();
});
