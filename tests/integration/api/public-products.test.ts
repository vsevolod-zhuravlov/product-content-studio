import { beforeEach, describe, expect, it, vi } from "vitest";
import * as adminDetailRoute from "@/app/api/admin/products/[id]/route";
import * as publicCollectionRoute from "@/app/api/public/products/route";
import * as publicDetailRoute from "@/app/api/public/products/[slug]/route";
import { ProductStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { buildProduct } from "../../factories/product";
import { apiRequest, jsonApiRequest, validAdminToken } from "../../helpers/api";
import { resetDb } from "../../helpers/database";

vi.mock("@/server/revalidate", () => ({
  revalidatePublicProduct: vi.fn(),
}));

const publicProductKeys = [
  "slug",
  "name",
  "specs",
  "description",
  "seoTitle",
  "seoDescription",
].sort();

const edit = {
  description: "Оновлений опис",
  seoTitle: "Оновлений заголовок",
  seoDescription: "Оновлений SEO опис",
  status: "PUBLISHED",
} as const;

const slugContext = (slug: string) => ({
  params: Promise.resolve({ slug }),
});

const idContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

beforeEach(async () => {
  await resetDb();
});

describe("public product reads", () => {
  it("lists only published products in name order with exact public keys", async () => {
    await db.product.create({
      data: buildProduct({
        name: "Zulu",
        slug: "zulu",
        status: ProductStatus.PUBLISHED,
      }),
    });
    await db.product.create({
      data: buildProduct({
        name: "Alpha",
        slug: "alpha",
        status: ProductStatus.PUBLISHED,
      }),
    });
    await db.product.create({
      data: buildProduct({
        name: "Hidden",
        slug: "hidden",
        status: ProductStatus.DRAFT,
      }),
    });

    const response = await publicCollectionRoute.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.map((product: { name: string }) => product.name)).toEqual([
      "Alpha",
      "Zulu",
    ]);
    expect(
      body.data.map((product: Record<string, unknown>) =>
        Object.keys(product).sort(),
      ),
    ).toEqual([publicProductKeys, publicProductKeys]);
  });

  it("returns the identical result with and without an admin cookie", async () => {
    await db.product.create({
      data: buildProduct({
        slug: "visible",
        status: ProductStatus.PUBLISHED,
      }),
    });

    const anonymous = await publicCollectionRoute.GET();
    const authenticated = await publicCollectionRoute.GET(
      apiRequest("/api/public/products", {
        token: await validAdminToken(),
      }),
    );

    expect(await authenticated.json()).toEqual(await anonymous.json());
  });

  it("never serializes internal product or user data", async () => {
    const adminEmail = "private-admin@example.com";
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash: "private-password-hash",
      },
    });
    const product = await db.product.create({
      data: buildProduct({
        slug: "safe-shape",
        status: ProductStatus.PUBLISHED,
      }),
    });

    const listResponse = await publicCollectionRoute.GET();
    const detailResponse = await publicDetailRoute.GET(
      apiRequest("/api/public/products/safe-shape"),
      slugContext("safe-shape"),
    );
    const serialized = JSON.stringify([
      await listResponse.json(),
      await detailResponse.json(),
    ]);

    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("private-password-hash");
    expect(serialized).not.toContain(adminEmail);
    expect(serialized).not.toContain(product.id);
    expect(serialized).not.toContain('"status"');
    expect(serialized).not.toContain("createdAt");
    expect(serialized).not.toContain("updatedAt");
  });

  it("gets a published product with exact public keys", async () => {
    const product = await db.product.create({
      data: buildProduct({
        slug: "published-product",
        status: ProductStatus.PUBLISHED,
      }),
    });
    const response = await publicDetailRoute.GET(
      apiRequest("/api/public/products/published-product"),
      slugContext("published-product"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(body.data).sort()).toEqual(publicProductKeys);
    expect(body.data).toMatchObject({
      slug: product.slug,
      name: product.name,
      specs: product.specs,
    });
  });

  it("makes draft and unknown slugs indistinguishable", async () => {
    await db.product.create({
      data: buildProduct({
        slug: "private-draft",
        status: ProductStatus.DRAFT,
      }),
    });

    const draftResponse = await publicDetailRoute.GET(
      apiRequest("/api/public/products/private-draft"),
      slugContext("private-draft"),
    );
    const unknownResponse = await publicDetailRoute.GET(
      apiRequest("/api/public/products/unknown"),
      slugContext("unknown"),
    );
    const draftBody = await draftResponse.json();
    const unknownBody = await unknownResponse.json();

    expect(draftResponse.status).toBe(404);
    expect(unknownResponse.status).toBe(404);
    expect(draftBody).toEqual({ error: "Not found" });
    expect(draftBody).toEqual(unknownBody);
  });

  it.each([
    "' OR 1=1 --",
    "../etc/passwd",
    "%00",
    "a".repeat(101),
    "UPPERCASE",
    "contains space",
  ])("returns 404 for invalid or malicious slug %j", async (slug) => {
    const existing = await db.product.create({
      data: buildProduct({
        slug: "intact",
        status: ProductStatus.PUBLISHED,
      }),
    });
    const before = await db.product.findMany();
    const response = await publicDetailRoute.GET(
      apiRequest("/api/public/products/invalid"),
      slugContext(slug),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
    expect(await db.product.findMany()).toEqual(before);
    await expect(
      db.product.findUnique({ where: { id: existing.id } }),
    ).resolves.not.toBeNull();
  });

  it("sets no-store and no CORS headers on every public response", async () => {
    await db.product.create({
      data: buildProduct({
        slug: "published",
        status: ProductStatus.PUBLISHED,
      }),
    });
    const responses = [
      await publicCollectionRoute.GET(),
      await publicDetailRoute.GET(
        apiRequest("/api/public/products/published"),
        slugContext("published"),
      ),
      await publicDetailRoute.GET(
        apiRequest("/api/public/products/missing"),
        slugContext("missing"),
      ),
      await publicDetailRoute.GET(
        apiRequest("/api/public/products/invalid"),
        slugContext("../invalid"),
      ),
    ];

    for (const response of responses) {
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
      expect(
        response.headers.get("access-control-allow-credentials"),
      ).toBeNull();
    }
  });

  it("exports only GET from public route modules", () => {
    expect(Object.keys(publicCollectionRoute)).toEqual(["GET"]);
    expect(Object.keys(publicDetailRoute)).toEqual(["GET"]);
  });
});

describe("status controls public availability across APIs", () => {
  it("publishes a draft through PUT, adding it to list and detail", async () => {
    const draft = await db.product.create({
      data: buildProduct({
        name: "Publish Me",
        slug: "publish-me",
        status: ProductStatus.DRAFT,
      }),
    });

    const updateResponse = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${draft.id}`,
        "PUT",
        edit,
        await validAdminToken(),
      ),
      idContext(draft.id),
    );
    const listResponse = await publicCollectionRoute.GET();
    const detailResponse = await publicDetailRoute.GET(
      apiRequest("/api/public/products/publish-me"),
      slugContext("publish-me"),
    );

    expect(updateResponse.status).toBe(200);
    expect(
      (await listResponse.json()).data.map(
        (product: { slug: string }) => product.slug,
      ),
    ).toContain("publish-me");
    expect(detailResponse.status).toBe(200);
  });

  it("unpublishes a product through PUT, removing it from list and detail", async () => {
    const published = await db.product.create({
      data: buildProduct({
        slug: "hide-me",
        status: ProductStatus.PUBLISHED,
      }),
    });

    const updateResponse = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${published.id}`,
        "PUT",
        { ...edit, status: "DRAFT" },
        await validAdminToken(),
      ),
      idContext(published.id),
    );
    const listResponse = await publicCollectionRoute.GET();
    const detailResponse = await publicDetailRoute.GET(
      apiRequest("/api/public/products/hide-me"),
      slugContext("hide-me"),
    );

    expect(updateResponse.status).toBe(200);
    expect((await listResponse.json()).data).toEqual([]);
    expect(detailResponse.status).toBe(404);
  });

  it("does not publish a draft through an unauthenticated PUT", async () => {
    const draft = await db.product.create({
      data: buildProduct({
        slug: "still-private",
        status: ProductStatus.DRAFT,
      }),
    });
    const updateResponse = await adminDetailRoute.PUT(
      jsonApiRequest(`/api/admin/products/${draft.id}`, "PUT", edit),
      idContext(draft.id),
    );
    const detailResponse = await publicDetailRoute.GET(
      apiRequest("/api/public/products/still-private"),
      slugContext("still-private"),
    );

    expect(updateResponse.status).toBe(401);
    expect(detailResponse.status).toBe(404);
    await expect(
      db.product.findUniqueOrThrow({ where: { id: draft.id } }),
    ).resolves.toMatchObject({ status: ProductStatus.DRAFT });
  });
});
