import { expect, test } from "@playwright/test";
import { registerAndLogin, SHOP } from "../helpers";

const shopperViewport = { width: 390, height: 844 };

test("logged-in user changes phone via OTP", async ({ browser }) => {
  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  const { phone: originalPhone } = await registerAndLogin(page);
  const newPhone = `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0")}`;
  expect(newPhone).not.toBe(originalPhone);

  await page.goto(`${SHOP}/profile/personal-info`);
  await expect(
    page.getByText(originalPhone, { exact: true }).filter({ visible: true })
  ).toBeVisible();

  await page.locator('[data-testid="change-phone-edit"]:visible').click();
  const dialog = page.getByRole("dialog", { name: "تغییر شماره موبایل" });
  await expect(dialog).toBeVisible();

  const otpResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/users/change-phone/request") &&
      res.request().method() === "POST"
  );
  await dialog.getByTestId("change-phone-number").fill(newPhone);
  await dialog.getByTestId("change-phone-request").click();
  const otpResponse = await otpResponsePromise;
  expect(otpResponse.ok()).toBeTruthy();
  const otpBody = await otpResponse.json();
  const otp = String(otpBody.code);
  expect(otp).toMatch(/^\d{4}$/);

  const codeDialog = page.getByRole("dialog", { name: "کد تایید را وارد کنید" });
  await expect(codeDialog).toBeVisible();

  const verifyPromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/users/change-phone/verify") &&
      res.request().method() === "POST"
  );
  const codeInput = codeDialog.getByTestId("change-phone-code");
  await codeInput.fill("");
  await codeInput.pressSequentially(otp);
  await expect(codeInput).toHaveValue(otp);
  await codeDialog.getByTestId("change-phone-submit").click();
  const verifyResponse = await verifyPromise;
  expect(verifyResponse.ok()).toBeTruthy();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText(newPhone, { exact: true }).filter({ visible: true })
  ).toBeVisible();

  await shopper.close();
});
