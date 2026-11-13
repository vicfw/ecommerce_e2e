import { expect, test } from "@playwright/test";
import {
  ADMIN,
  API,
  loginAdmin,
  registerAndLogin,
  SHOP,
} from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const shopperViewport = { width: 390, height: 844 };
const adminViewport = { width: 1280, height: 720 };

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

test("comment rating shows on PDP only after admin approval", async ({
  browser,
}) => {
  const commentBody = `e2e-rating-${Date.now()}`;

  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  await registerAndLogin(page);

  await page.route("**/api/v1/upload**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Image uploaded successfully",
        data: { url: ["https://res.cloudinary.com/e2e/image/upload/e2e-comment.png"] },
      }),
    });
  });

  const productRes = await page.request.get(
    `${API}/api/v1/product/${PRODUCT_SLUG}`
  );
  expect(productRes.ok()).toBeTruthy();
  const product = (await productRes.json()).data;
  const productId = Number(product.id);
  const avgBefore = Number(product.averageRating);

  const commentsRes = await page.request.get(
    `${API}/api/v1/comment?productId=${productId}&limit=1`
  );
  expect(commentsRes.ok()).toBeTruthy();
  const approvedCount = Number((await commentsRes.json()).total);
  // Pick a score that moves the average when this is the only new approved row.
  const rating = avgBefore >= 4 ? 1 : 5;
  const expectedAfter = Number(
    ((avgBefore * approvedCount + rating) / (approvedCount + 1)).toFixed(1)
  );

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  await expect(page.getByTestId("product-average-rating")).toHaveText(
    new RegExp(`امتیاز ${avgBefore.toFixed(1)}`)
  );

  await page.getByRole("button", { name: "افزودن دیدگاه" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByTestId(`comment-rating-${rating}`).click();
  await dialog.getByTestId("comment-body").fill(commentBody);
  const uploadPromise = page.waitForResponse(
    (res) => res.url().includes("/upload") && res.ok()
  );
  await dialog.locator("#file-upload").setInputFiles({
    name: "e2e.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
  await uploadPromise;

  const submit = dialog.getByTestId("comment-submit");
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport();

  const createPromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/comment") &&
      res.request().method() === "POST" &&
      res.ok()
  );
  await submit.click();
  await createPromise;
  await expect(
    page.getByText(
      "دیدگاه شما با موفقیت ثبت شد، پس از تایید ، نمایش داده خواهد شد",
      { exact: true }
    )
  ).toBeVisible();

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  await expect(page.getByTestId("product-average-rating")).toHaveText(
    new RegExp(`امتیاز ${avgBefore.toFixed(1)}`)
  );

  const pendingProduct = await page.request.get(
    `${API}/api/v1/product/${PRODUCT_SLUG}`
  );
  expect(Number((await pendingProduct.json()).data.averageRating)).toBe(
    avgBefore
  );

  const adminContext = await browser.newContext({ viewport: adminViewport });
  const admin = await adminContext.newPage();
  await loginAdmin(admin);
  await admin.goto(`${ADMIN}/#/comment`);
  const commentRow = admin.getByRole("row").filter({ hasText: commentBody });
  await expect(commentRow).toBeVisible({ timeout: 30_000 });
  await expect(commentRow.getByText(String(rating), { exact: true })).toBeVisible();

  const approvePromise = admin.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/comment/") &&
      res.request().method() === "PATCH" &&
      res.ok()
  );
  await commentRow.getByRole("button", { name: "Approve" }).click();
  await approvePromise;
  await expect(admin.getByText("Comment approved")).toBeVisible();

  await expect
    .poll(async () => {
      const res = await page.request.get(
        `${API}/api/v1/product/${PRODUCT_SLUG}`
      );
      return Number((await res.json()).data.averageRating);
    })
    .toBe(expectedAfter);

  await page.goto(`${SHOP}/products/${PRODUCT_SLUG}`);
  await expect(page.getByTestId("product-average-rating")).toHaveText(
    new RegExp(`امتیاز ${expectedAfter.toFixed(1)}`)
  );

  await adminContext.close();
  await shopper.close();
});
