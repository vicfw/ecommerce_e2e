import { expect, test, type Page } from "@playwright/test";
import {
  loginAdmin,
  registerAndLogin,
  SHOP,
  stubZibalReturn,
} from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";

const shopperViewport = { width: 390, height: 844 };
const adminViewport = { width: 1280, height: 720 };

async function pickFirstComboboxOption(page: Page, nth: number) {
  await page.getByRole("combobox").nth(nth).click();
  await page.getByRole("option").first().click();
}

test("admin ship", async ({ browser }) => {
  const firstName = "E2E";
  const lastName = `Ship${Date.now().toString().slice(-6)}`;

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
  await expect(page.getByText("آدرس جدید با موفقیت ایجاد شد")).toBeVisible();

  await page.getByRole("link", { name: "تایید و تکمیل سفارش" }).click();
  await page.waitForURL(/\/payment/);

  await stubZibalReturn(page, "1");

  await page.getByRole("button", { name: "پرداخت" }).click();
  await expect(page.getByText("سفارش شما با موفقیت انجام شد.")).toBeVisible({
    timeout: 60_000,
  });

  const adminContext = await browser.newContext({ viewport: adminViewport });
  const admin = await adminContext.newPage();

  await loginAdmin(admin);
  await admin.getByText("Orders").first().click();

  const customerLabel = `${firstName} ${lastName}`;
  await expect(admin.getByText(customerLabel).first()).toBeVisible({
    timeout: 30_000,
  });
  await admin.getByText(customerLabel).first().click();

  await expect(admin.getByText("processing").first()).toBeVisible();
  await expect(admin.getByText(phone).first()).toBeVisible();

  await admin.getByRole("combobox", { name: "Status" }).click();
  await admin.getByRole("option", { name: "Shipped" }).click();

  const updatePromise = admin.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/order/") &&
      res.request().method() === "PATCH" &&
      res.ok()
  );
  await admin.getByRole("button", { name: "Update Status" }).click();
  await updatePromise;

  await expect(admin.getByText("Order status updated")).toBeVisible();
  await expect(admin.getByText("shipped").first()).toBeVisible();

  await shopper.close();
  await adminContext.close();
});
