import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const SHOP = "http://localhost:3000";
export const ADMIN = "http://localhost:5173";
export const STUB = "http://127.0.0.1:4010";
export const API = "http://127.0.0.1:9000";
export const ADMIN_PHONE = "09362712519";

export async function loginWithPhone(page: Page, phone: string): Promise<void> {
  const otpResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/users") &&
      res.request().method() === "POST" &&
      !res.url().includes("/login")
  );
  await page.goto(`${SHOP}/register`);
  await page.getByPlaceholder("09122222222").fill(phone);
  await page.getByRole("button", { name: "ورود" }).click();
  const otpResponse = await otpResponsePromise;
  const otpBody = await otpResponse.json();
  const otp = String(otpBody.code);
  expect(otp).toMatch(/^\d{4}$/);

  const mePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/users/me") &&
      res.request().method() === "GET" &&
      res.ok()
  );
  await page.getByRole("textbox").fill(otp);
  await page.getByRole("button", { name: "تایید" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await mePromise;
  await page.waitForFunction(() => document.cookie.includes("userInfo="));
}

export async function registerAndLogin(page: Page): Promise<{ phone: string }> {
  const phone = `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0")}`;
  await loginWithPhone(page, phone);
  return { phone };
}

export async function loginAdmin(page: Page): Promise<void> {
  const otpResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/admin/request-otp") &&
      res.request().method() === "POST"
  );
  await page.goto(`${ADMIN}/login`);
  await page.getByLabel("Phone number").fill(ADMIN_PHONE);
  await page.getByRole("button", { name: "Send code" }).click();
  const otpResponse = await otpResponsePromise;
  const adminOtpBody = await otpResponse.json();
  const adminOtp = String(adminOtpBody.code);
  expect(adminOtp).toMatch(/^\d{4}$/);

  await page.getByLabel("Verification code").fill(adminOtp);

  const adminLoginPromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/admin/login") &&
      res.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Login" }).click();
  const adminLoginResponse = await adminLoginPromise;
  expect(adminLoginResponse.ok()).toBeTruthy();
  await expect(page.getByText("Orders").first()).toBeVisible();
}

export async function stubZibalReturn(
  page: Page,
  success: "0" | "1"
): Promise<void> {
  await page.route("https://gateway.zibal.ir/start/**", async (route) => {
    const trackId = new URL(route.request().url()).pathname.split("/").pop();
    const trackRes = await page.request.get(`${STUB}/v1/track/${trackId}`);
    const { orderId } = await trackRes.json();
    await route.fulfill({
      status: 302,
      headers: {
        Location: `${SHOP}/payment/loader?success=${success}&status=2&trackId=${trackId}&orderId=${orderId}`,
      },
    });
  });
}

export async function productQuantity(
  request: APIRequestContext,
  slug: string
): Promise<number> {
  const res = await request.get(`${API}/api/v1/product/${slug}`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return Number(body.data.quantity);
}
