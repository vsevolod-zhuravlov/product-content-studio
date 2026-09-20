import { beforeEach, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import {
  getAdminProduct,
  getPublishedProductBySlug,
  listAdminProducts,
  listPublishedProducts,
  updateProduct,
} from "@/server/products/products.service";
import { getPublicProduct } from "@/server/products/get-public-product";
import { buildProduct } from "../factories/product";
import { resetDb } from "../helpers/database";

const validEdit = {
  description: "Оновлений опис",
  seoTitle: "Оновлений SEO заголовок",
  seoDescription: "Оновлений SEO опис",
  status: "PUBLISHED",
} as const;

beforeEach(async () => {
  await resetDb();
});

describe("public product queries", () => {
  it("lists only published products ordered by name", async () => {
    await db.product.create({
      data: buildProduct({
        name: "Бета",
        slug: "published-beta",
        status: ProductStatus.PUBLISHED,
      }),
    });
    await db.product.create({
      data: buildProduct({
        name: "Альфа",
        slug: "published-alpha",
        status: ProductStatus.PUBLISHED,
      }),
    });
    await db.product.create({
      data: buildProduct({
        name: "Чернетка",
        slug: "draft",
        status: ProductStatus.DRAFT,
      }),
    });

    const products = await listPublishedProducts();

    expect(products.map(({ name }) => name)).toEqual(["Альфа", "Бета"]);
    expect(products.map(({ slug }) => slug)).not.toContain("draft");
  });

  it("returns null for both a draft slug and an unknown slug", async () => {
    await db.product.create({
      data: buildProduct({
        slug: "private-draft",
        status: ProductStatus.DRAFT,
      }),
    });

    await expect(
      getPublishedProductBySlug("private-draft"),
    ).resolves.toBeNull();
    await expect(getPublishedProductBySlug("missing")).resolves.toBeNull();
  });

  it("uses the same not-found path for a draft slug and an unknown slug", async () => {
    await db.product.create({
      data: buildProduct({
        slug: "hidden-draft",
        status: ProductStatus.DRAFT,
      }),
    });
    await db.product.create({
      data: buildProduct({
        slug: "visible-product",
        status: ProductStatus.PUBLISHED,
      }),
    });

    const draft = await getPublicProduct("hidden-draft");
    const unknown = await getPublicProduct("does-not-exist");
    const published = await getPublicProduct("visible-product");

    expect(draft).toBeNull();
    expect(unknown).toBeNull();
    expect(published).not.toBeNull();
    expect(published?.slug).toBe("visible-product");
  });

  it("returns a public DTO with exactly the allowed keys", async () => {
    await db.product.create({
      data: buildProduct({
        slug: "public-shape",
        status: ProductStatus.PUBLISHED,
      }),
    });

    const product = await getPublishedProductBySlug("public-shape");

    expect(product).not.toBeNull();
    expect(Object.keys(product!).sort()).toEqual(
      [
        "slug",
        "name",
        "specs",
        "description",
        "seoTitle",
        "seoDescription",
      ].sort(),
    );
    expect(product?.specs).toEqual([{ label: "Колір", value: "Чорний" }]);
  });
});

describe("admin product queries", () => {
  it("lists all products with status", async () => {
    await db.product.create({
      data: buildProduct({ name: "Draft", status: ProductStatus.DRAFT }),
    });
    await db.product.create({
      data: buildProduct({
        name: "Published",
        status: ProductStatus.PUBLISHED,
      }),
    });

    const products = await listAdminProducts();

    expect(products).toHaveLength(2);
    expect(products.map(({ status }) => status).sort()).toEqual([
      ProductStatus.DRAFT,
      ProductStatus.PUBLISHED,
    ]);
    expect(Object.keys(products[0]!).sort()).toEqual(
      ["id", "name", "status", "updatedAt"].sort(),
    );
  });

  it("gets a full product by id and rejects an unknown id", async () => {
    const created = await db.product.create({ data: buildProduct() });

    await expect(getAdminProduct(created.id)).resolves.toEqual(created);
    await expect(getAdminProduct("unknown-id")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("updateProduct", () => {
  it("persists valid editable fields, bumps updatedAt, and preserves protected fields", async () => {
    const oldUpdatedAt = new Date("2020-01-01T00:00:00.000Z");
    const created = await db.product.create({
      data: buildProduct({ updatedAt: oldUpdatedAt }),
    });

    await updateProduct(created.id, validEdit);
    const persisted = await db.product.findUniqueOrThrow({
      where: { id: created.id },
    });

    expect(persisted).toMatchObject(validEdit);
    expect(persisted.updatedAt.getTime()).toBeGreaterThan(
      oldUpdatedAt.getTime(),
    );
    expect({
      name: persisted.name,
      slug: persisted.slug,
      specs: persisted.specs,
    }).toEqual({
      name: created.name,
      slug: created.slug,
      specs: created.specs,
    });
  });

  it("rejects invalid input and leaves the database row unchanged", async () => {
    const created = await db.product.create({ data: buildProduct() });

    await expect(
      updateProduct(created.id, {
        ...validEdit,
        description: "",
        seoTitle: "x".repeat(61),
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    const persisted = await db.product.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(persisted).toEqual(created);
  });

  it("rejects extra fields and preserves name, specs, and slug", async () => {
    const created = await db.product.create({ data: buildProduct() });

    await expect(
      updateProduct(created.id, {
        ...validEdit,
        name: "Unauthorized rename",
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    const persisted = await db.product.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect({
      name: persisted.name,
      slug: persisted.slug,
      specs: persisted.specs,
    }).toEqual({
      name: created.name,
      slug: created.slug,
      specs: created.specs,
    });
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(updateProduct("unknown-id", validEdit)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("publishing a draft adds it to public results", async () => {
    const draft = await db.product.create({
      data: buildProduct({ slug: "publish-me", status: ProductStatus.DRAFT }),
    });

    expect(await listPublishedProducts()).toHaveLength(0);

    await updateProduct(draft.id, validEdit);

    expect((await listPublishedProducts()).map(({ slug }) => slug)).toEqual([
      "publish-me",
    ]);
  });

  it("switching a published product to draft hides it from both public queries", async () => {
    const published = await db.product.create({
      data: buildProduct({
        slug: "hide-me",
        status: ProductStatus.PUBLISHED,
      }),
    });

    await updateProduct(published.id, {
      ...validEdit,
      status: "DRAFT",
    });

    await expect(listPublishedProducts()).resolves.toEqual([]);
    await expect(getPublishedProductBySlug("hide-me")).resolves.toBeNull();
  });
});
