import { expect, test } from "@playwright/test";
import { SHOP } from "../helpers";

const PRODUCT_SLUG = "aqeleh-saffron-sachet-4-grams";
const PRODUCT_NAME = "زعفران پاکتی عاقله - 4 گرم";
const SEARCH_QUERY = "زعفران پاکتی";

const shopperViewport = { width: 390, height: 844 };

test("search and browse finds seeded sachet", async ({ browser }) => {
  const shopper = await browser.newContext({ viewport: shopperViewport });
  const page = await shopper.newPage();

  await page.goto(`${SHOP}/category/saffron`);
  await expect(page.getByText(PRODUCT_NAME)).toBeVisible();

  await page.goto(`${SHOP}/brands/aqeleh`);
  await expect(page.getByText(PRODUCT_NAME)).toBeVisible();

  await page.goto(SHOP);
  await page.getByRole("button", { name: "جستجو در محصولات" }).click();
  await page.getByRole("textbox", { name: "جستجو در محصولات" }).fill(SEARCH_QUERY);
  await page
    .getByRole("link", { name: new RegExp(PRODUCT_NAME) })
    .first()
    .click();
  await page.waitForURL((url) => url.pathname === `/products/${PRODUCT_SLUG}`);
  await expect(page.getByRole("main").getByText(PRODUCT_NAME)).toBeVisible();

  await page.goto(`${SHOP}/search?q=zzzz-no-such-product`);
  await expect(page.getByText("محصولی یافت نشد")).toBeVisible();

  await shopper.close();
});
