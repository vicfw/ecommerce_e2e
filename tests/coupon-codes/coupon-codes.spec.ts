import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  ADMIN_PHONE,
  API,
  registerAndLogin,
  SHOP,
} from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const shopperViewport = { width: 390, height: 844 };

async function adminToken(request: APIRequestContext): Promise<string> {
  const otpRes = await request.post(`${API}/api/v1/admin/request-otp`, {
    data: { phoneNumber: ADMIN_PHONE },
  });
  expect(otpRes.ok()).toBeTruthy();
  const otpBody = await otpRes.json();
  const code = String(otpBody.code);
  expect(code).toMatch(/^\d{4}$/);

  const loginRes = await request.post(`${API}/api/v1/admin/login`, {
    data: { phoneNumber: ADMIN_PHONE, code },
  });
  expect(loginRes.ok()).toBeTruthy();
  const loginBody = await loginRes.json();
  return String(loginBody.data.token);
}

async function createCoupon(
  request: APIRequestContext,
  token: string,
  body: Record<string, unknown>
) {
  const res = await request.post(`${API}/api/v1/coupon`, {
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

async function pickFirstComboboxOption(page: Page, nth: number) {
  await page.getByRole("combobox").nth(nth).click();
  await page.getByRole("option").first().click();
}

test("coupon codes", async ({ browser, request }) => {
  const suffix = Date.now().toString().slice(-8);
  const validCode = `E2EOK${suffix}`;
  const expiredCode = `E2EEXP${suffix}`;
  const minCode = `E2EMIN${suffix}`;
  const token = await adminToken(request);

  await createCoupon(request, token, {
    code: validCode,
    type: "fixed",
    value: 50_000,
    active: true,
  });
  await createCoupon(request, token, {
    code: expiredCode,
    type: "fixed",
    value: 50_000,
    active: true,
    expiresAt: "2020-01-01T00:00:00.000Z",
  });
  await createCoupon(request, token, {
    code: minCode,
    type: "fixed",
    value: 50_000,
    active: true,
    minCart: 9_999_999_999,
  });

  const firstName = "E2E";
  const lastName = `Coupon${suffix.slice(-6)}`;
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
  await addressDialog
    .getByPlaceholder("آدرس خود را وارد نمایید")
    .fill("خیابان تست پلاک ۱۲ واحد ۳");
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

  // Seeded SKU: 840000 @ 42% off + 45000 delivery = 532200
  await expect(page.getByText("532,200 تومان").first()).toBeVisible();

  const couponInput = page.getByTestId("payment-coupon-input-mobile");
  const applyBtn = page.getByTestId("payment-coupon-apply-mobile");

  await couponInput.fill(expiredCode);
  await applyBtn.click();
  await expect(page.getByTestId("payment-coupon-error-mobile")).toContainText(
    "منقضی"
  );
  await expect(page.getByText("532,200 تومان").first()).toBeVisible();

  await couponInput.fill(minCode);
  await applyBtn.click();
  await expect(page.getByTestId("payment-coupon-error-mobile")).toContainText(
    "حداقل"
  );
  await expect(page.getByText("532,200 تومان").first()).toBeVisible();

  await couponInput.fill(validCode);
  await applyBtn.click();
  await expect(page.getByTestId("payment-coupon-remove-mobile")).toBeVisible();
  await expect(page.getByText("50,000").first()).toBeVisible();
  await expect(page.getByText("482,200 تومان").first()).toBeVisible();

  await shopper.close();
});
