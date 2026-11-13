import { request } from "@playwright/test";
import { ensureSeededProductsInStock } from "./tests/helpers";

export default async function globalSetup() {
  const ctx = await request.newContext();
  try {
    await ensureSeededProductsInStock(ctx);
  } finally {
    await ctx.dispose();
  }
}
