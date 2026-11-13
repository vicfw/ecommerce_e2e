import { expect, test } from "@playwright/test";
import { SHOP } from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const PRODUCT_NAME = "زعفران پاکتی عاقله - 4 گرم";
const SEARCH_QUERY = "زعفران پاکتی";

const shopperViewport = { width: 390, height: 844 };

test("search suggestions navigate to product and stay empty for blank query", async ({
  browser,
}) => {
  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  await page.goto(SHOP);
  await page.getByRole("button", { name: "جستجو در محصولات" }).click();

  const searchInput = page.getByTestId("product-search-mobile");
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveValue("");
  await expect(page.getByRole("listbox", { name: "پیشنهادهای جستجو" })).toHaveCount(
    0
  );

  await searchInput.fill(SEARCH_QUERY);
  await page
    .getByRole("listbox", { name: "پیشنهادهای جستجو" })
    .getByRole("link", { name: new RegExp(PRODUCT_NAME) })
    .first()
    .click();
  await page.waitForURL((url) => url.pathname === `/products/${PRODUCT_SLUG}`);
  await expect(page.getByRole("main").getByText(PRODUCT_NAME)).toBeVisible();

  await shopper.close();
});
