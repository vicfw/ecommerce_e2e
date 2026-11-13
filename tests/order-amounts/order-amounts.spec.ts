import { expect, test, type Page } from "@playwright/test";
import {
  API,
  registerAndLogin,
  SHOP,
  stubZibalReturn,
} from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const shopperViewport = { width: 390, height: 844 };

async function pickFirstComboboxOption(page: Page, nth: number) {
  await page.getByRole("combobox").nth(nth).click();
  await page.getByRole("option").first().click();
}

async function formatAmount(page: Page, n: number): Promise<string> {
  return page.evaluate((value) => value.toLocaleString(), n);
}

async function expectPriceRow(
  page: Page,
  label: string,
  amountText: string
) {
  const row = page
    .locator("div.flex.justify-between")
    .filter({ hasText: label })
    .filter({ visible: true })
    .first();
  await expect(row).toBeVisible();
  await expect(row.getByText(amountText, { exact: true })).toBeVisible();
}

test("order amounts match cart shipping payment and invoice", async ({
  browser,
  request,
}) => {
  const firstName = "E2E";
  const lastName = `Amounts${Date.now().toString().slice(-6)}`;

  const productRes = await request.get(`${API}/api/v1/product/${PRODUCT_SLUG}`);
  expect(productRes.ok()).toBeTruthy();
  const productBody = await productRes.json();
  const product = productBody.data;

  const listPrice = Number(product.price);
  const discountRate = Number(product.discount) || 0;

  const deliveryRes = await request.get(`${API}/api/v1/deliveryCost`);
  expect(deliveryRes.ok()).toBeTruthy();
  const deliveryBody = await deliveryRes.json();
  const delivery = Number(deliveryBody.data.cost);

  const profit = listPrice * (discountRate / 100);
  const goods = listPrice - profit;
  const payable = goods + delivery;

  expect(goods + profit).toBe(listPrice);
  expect(goods + delivery).toBe(payable);

  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  await registerAndLogin(page);

  const listFmt = await formatAmount(page, listPrice);
  const profitFmt = await formatAmount(page, profit);
  const goodsFmt = await formatAmount(page, goods);
  const deliveryFmt = await formatAmount(page, delivery);
  const payableFmt = await formatAmount(page, payable);

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  const addCartPromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/cart") &&
      !res.url().includes("/anon") &&
      res.request().method() === "POST" &&
      res.ok()
  );
  await page.getByRole("button", { name: "افزودن به سبد خرید" }).click();
  await addCartPromise;

  const cartResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/cart") &&
      !res.url().includes("/cartItem") &&
      !res.url().includes("/length") &&
      !res.url().includes("/anon") &&
      !res.url().includes("/coupon") &&
      res.request().method() === "GET" &&
      res.ok()
  );
  await page.goto(`${SHOP}/cart`);
  const cartRes = await cartResponsePromise;
  const cartBody = await cartRes.json();
  const cart = cartBody.data;
  expect(cart).toBeTruthy();

  expect(Number(cart.price)).toBe(listPrice);
  expect(Number(cart.discountPrice)).toBe(goods);
  expect(Number(cart.profitFromDiscount)).toBe(profit);
  expect(Number(cart.couponAmount) || 0).toBe(0);

  await expectPriceRow(page, "قیمت کالاها", `${listFmt} تومان`);
  await expectPriceRow(page, "سود شما از خرید", `${profitFmt}- تومان`);
  await expectPriceRow(page, "قابل پرداخت", `${goodsFmt} تومان`);

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

  await expectPriceRow(page, "هزینه ارسال", `${deliveryFmt} تومان`);
  await expectPriceRow(page, "قابل پرداخت", `${payableFmt} تومان`);

  await page.getByRole("link", { name: "تایید و تکمیل سفارش" }).click();
  await page.waitForURL(/\/payment/);

  await expectPriceRow(page, "هزینه ارسال", `${deliveryFmt} تومان`);
  await expectPriceRow(page, "قابل پرداخت", `${payableFmt} تومان`);

  await stubZibalReturn(page, "1");

  const loaderUrlPromise = page.waitForURL(/\/payment\/loader/);
  await page.getByRole("button", { name: "پرداخت" }).click();
  await loaderUrlPromise;
  const orderId = new URL(page.url()).searchParams.get("orderId");
  expect(orderId).toMatch(/^\d+$/);

  await expect(
    page.getByText("سفارش شما با موفقیت انجام شد.", { exact: true })
  ).toBeVisible({ timeout: 60_000 });

  const orderResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/v1/order/${orderId}`) &&
      res.request().method() === "GET" &&
      res.ok()
  );
  await page.goto(`${SHOP}/profile/orders/${orderId}`);
  const orderRes = await orderResponsePromise;
  const orderBody = await orderRes.json();
  const order = orderBody.data;

  expect(Number(order.totalAmount)).toBe(goods);
  expect(Number(order.profitFromDiscount)).toBe(profit);
  expect(Number(order.deliveryAmount)).toBe(delivery);
  expect(Number(order.couponAmount) || 0).toBe(0);
  expect(
    Number(order.totalAmount) + Number(order.deliveryAmount)
  ).toBe(payable);

  await expect(page.getByText("جزئیات سفارش").first()).toBeVisible();
  await page.getByTestId("order-invoice-open").click();
  await expect(page.getByTestId("order-invoice")).toBeVisible();
  await expect(page.getByTestId("order-invoice-total")).toHaveText(
    `${payableFmt} تومان`
  );

  await shopper.close();
});
