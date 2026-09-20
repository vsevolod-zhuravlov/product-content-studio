import { test as base, expect } from "@playwright/test";
import {
  findDraftProduct,
  findPublishedProduct,
  resetAndSeed,
  type Product,
} from "./db";

export { expect };

type ProductFixtures = {
  publishedProduct: Product;
  draftProduct: Product;
};

export const test = base.extend<ProductFixtures>({
  publishedProduct: async ({}, setFixture) => {
    await setFixture(await findPublishedProduct());
  },
  draftProduct: async ({}, setFixture) => {
    await setFixture(await findDraftProduct());
  },
});

export const mutatingTest = base.extend<ProductFixtures & { seed: void }>({
  seed: [
    async ({}, setFixture) => {
      await resetAndSeed();
      await setFixture();
    },
    { auto: true },
  ],
  publishedProduct: async ({ seed }, setFixture) => {
    void seed;
    await setFixture(await findPublishedProduct());
  },
  draftProduct: async ({ seed }, setFixture) => {
    void seed;
    await setFixture(await findDraftProduct());
  },
});
