import { beforeEach, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { productEditSchema } from "@/lib/validation/product";
import { seedDatabase, seedProducts } from "../../prisma/seed";
import { getTestDatabaseUrl } from "../database-url";
import { resetDb } from "../helpers/database";

describe("database seed", () => {
  beforeEach(async () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD = "change-me-seed-password";
    await resetDb();
  });

  it("creates 1 admin, 10 published products, and 5 drafts", async () => {
    await seedDatabase(getTestDatabaseUrl());

    const [users, published, drafts] = await Promise.all([
      db.user.findMany(),
      db.product.findMany({ where: { status: ProductStatus.PUBLISHED } }),
      db.product.findMany({ where: { status: ProductStatus.DRAFT } }),
    ]);

    expect(users).toHaveLength(1);
    expect(users[0]?.email).toBe("admin@example.com");
    expect(published).toHaveLength(10);
    expect(drafts).toHaveLength(5);

    const slugs = [...published, ...drafts].map((product) => product.slug);
    expect(new Set(slugs).size).toBe(15);

    for (const product of seedProducts) {
      expect(
        productEditSchema.safeParse({
          description: product.description,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          status: product.status,
        }).success,
      ).toBe(true);
    }
  });
});
