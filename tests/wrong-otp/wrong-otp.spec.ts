import { expect, test } from "@playwright/test";
import { SHOP } from "../helpers";

const shopperViewport = { width: 390, height: 844 };

test("wrong OTP does not reach home", async ({ browser }) => {
  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  const phone = `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0")}`;

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
  const realOtp = String(otpBody.code);
  expect(realOtp).toMatch(/^\d{4}$/);

  const wrongOtp = realOtp === "0000" ? "1111" : "0000";
  const loginPromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/users/login") &&
      res.request().method() === "POST"
  );
  await page.getByRole("textbox").fill(wrongOtp);
  await page.getByRole("button", { name: "تایید" }).click();
  const loginResponse = await loginPromise;
  expect(loginResponse.ok()).toBeFalsy();

  await expect(page).not.toHaveURL((url) => url.pathname === "/");

  await shopper.close();
});
