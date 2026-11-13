import { expect, test, type Page } from "@playwright/test";
import {
  loginAdmin,
  productQuantity,
  registerAndLogin,
  SHOP,
  stubZibalReturn,
} from "../helpers";

const GIFT_SLUG =
  "aqeleh-gift-saffron-3-grams-with-cardamom-10-grams-teapot-and-mortar";

const shopperViewport = { width: 390, height: 844 };
const adminViewport = { width: 1280, height: 720 };

async function pickFirstComboboxOption(page: Page, nth: number) {
  await page.getByRole("combobox").nth(nth).click();
  await page.getByRole("option").first().click();
}

test("customer return request", async ({ browser, request }) => {
  const firstName = "E2E";
  const lastName = `Return${Date.now().toString().slice(-6)}`;
  const quantityBefore = await productQuantity(request, GIFT_SLUG);

  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  const { phone } = await registerAndLogin(page);

  await page.goto(`${SHOP}/products/${GIFT_SLUG}`);
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
  await expect(
    page.getByText("آدرس جدید با موفقیت ایجاد شد", { exact: true })
  ).toBeVisible();

  await page.getByRole("link", { name: "تایید و تکمیل سفارش" }).click();
  await page.waitForURL(/\/payment/);

  await stubZibalReturn(page, "1");

  const loaderUrlPromise = page.waitForURL(/\/payment\/loader/);
  await page.getByRole("button", { name: "پرداخت" }).click();
  await loaderUrlPromise;
  const orderId = new URL(page.url()).searchParams.get("orderId");
  expect(orderId).toMatch(/^\d+$/);

  await expect(
    page.getByText("سفارش شما با موفقیت انجام شد.", { exact: true })
  ).toBeVisible({ timeout: 60_000 });

  await page.goto(`${SHOP}/profile/orders/${orderId}`);
  await expect(page.getByText("جزئیات سفارش").first()).toBeVisible();
  await expect(page.getByTestId("order-return-request")).toHaveCount(0);

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
  await admin.getByRole("option", { name: "Delivered" }).click();

  const deliverPromise = admin.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/order/") &&
      res.request().method() === "PATCH" &&
      res.ok()
  );
  await admin.getByRole("button", { name: "Update Status" }).click();
  await deliverPromise;
  await expect(admin.getByText("Order status updated")).toBeVisible();
  await expect(admin.getByText("delivered").first()).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("order-return-request")).toBeVisible();
  await page.getByTestId("order-return-request").click();
  await page.getByTestId("order-return-reason").fill("کالا آسیب دیده بود");

  const createReturnPromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/return-request") &&
      res.request().method() === "POST" &&
      res.ok()
  );
  await page.getByTestId("order-return-submit").click();
  await createReturnPromise;

  await expect(
    page.getByText("درخواست مرجوعی در انتظار بررسی است", { exact: true })
  ).toBeVisible();

  await expect
    .poll(() => productQuantity(request, GIFT_SLUG))
    .toBe(quantityBefore - 1);

  await admin.getByText("Returns").first().click();
  await expect(admin.getByText(customerLabel).first()).toBeVisible({
    timeout: 30_000,
  });

  const approvePromise = admin.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/return-request/") &&
      res.request().method() === "PATCH" &&
      res.ok()
  );
  await admin.getByRole("button", { name: "Approve" }).first().click();
  await approvePromise;
  await expect(admin.getByText("Return approved")).toBeVisible();

  await expect
    .poll(() => productQuantity(request, GIFT_SLUG))
    .toBe(quantityBefore);

  await page.reload();
  await expect(
    page.getByText("درخواست مرجوعی تایید شد", { exact: true })
  ).toBeVisible();

  await shopper.close();
  await adminContext.close();
});
