import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as adminCollectionRoute from "@/app/api/admin/products/route";
import * as adminDetailRoute from "@/app/api/admin/products/[id]/route";
import { ProductStatus, type Product } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import * as productService from "@/server/products/products.service";
import { buildProduct } from "../../factories/product";
import {
  API_BASE_URL,
  apiRequest,
  invalidAdminTokens,
  invokeRoute,
  jsonApiRequest,
  validAdminToken,
} from "../../helpers/api";
import { resetDb } from "../../helpers/database";

const revalidatePublicProduct = vi.hoisted(() => vi.fn());
vi.mock("@/server/revalidate", () => ({ revalidatePublicProduct }));

const validEdit = {
  description: "Оновлений опис",
  seoTitle: "Оновлений SEO заголовок",
  seoDescription: "Оновлений SEO опис",
  status: "PUBLISHED",
} as const;

const adminProductKeys = [
  "id",
  "slug",
  "name",
  "specs",
  "description",
  "seoTitle",
  "seoDescription",
  "status",
  "updatedAt",
].sort();

const detailContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

async function invalidToken(name: string): Promise<string | undefined> {
  return (await invalidAdminTokens()).find(([label]) => label === name)?.[1];
}

async function expectUnchanged(original: Product): Promise<void> {
  await expect(
    db.product.findUniqueOrThrow({ where: { id: original.id } }),
  ).resolves.toEqual(original);
}

beforeEach(async () => {
  vi.restoreAllMocks();
  revalidatePublicProduct.mockReset();
  await resetDb();
});

describe("admin product authentication", () => {
  it.each([
    "no cookie",
    "expired token",
    "tampered token",
    "wrong-secret token",
  ])("GET collection rejects %s", async (name) => {
    const response = await adminCollectionRoute.GET(
      apiRequest("/api/admin/products", {
        token: await invalidToken(name),
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    "no cookie",
    "expired token",
    "tampered token",
    "wrong-secret token",
  ])("GET detail rejects %s", async (name) => {
    const response = await adminDetailRoute.GET(
      apiRequest("/api/admin/products/product-id", {
        token: await invalidToken(name),
      }),
      detailContext("product-id"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it.each([
    "no cookie",
    "expired token",
    "tampered token",
    "wrong-secret token",
  ])("PUT rejects %s without changing the row", async (name) => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        validEdit,
        await invalidToken(name),
      ),
      detailContext(product.id),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    await expectUnchanged(product);
    expect(revalidatePublicProduct).not.toHaveBeenCalled();
  });
});

describe("admin product reads", () => {
  it("lists drafts and published products ordered by name with exact keys", async () => {
    await db.product.create({
      data: buildProduct({
        name: "Zulu",
        slug: "zulu",
        status: ProductStatus.DRAFT,
      }),
    });
    await db.product.create({
      data: buildProduct({
        name: "Alpha",
        slug: "alpha",
        status: ProductStatus.PUBLISHED,
      }),
    });
    const token = await validAdminToken();

    const response = await adminCollectionRoute.GET(
      apiRequest("/api/admin/products", { token }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.data.map((product: { name: string }) => product.name)).toEqual([
      "Alpha",
      "Zulu",
    ]);
    expect(
      body.data.map((product: Record<string, unknown>) =>
        Object.keys(product).sort(),
      ),
    ).toEqual([
      ["id", "name", "status", "updatedAt"].sort(),
      ["id", "name", "status", "updatedAt"].sort(),
    ]);
  });

  it("gets an admin product with exactly the allowed keys", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.GET(
      apiRequest(`/api/admin/products/${product.id}`, {
        token: await validAdminToken(),
      }),
      detailContext(product.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(body.data).sort()).toEqual(adminProductKeys);
    expect(body.data).toMatchObject({
      id: product.id,
      slug: product.slug,
      name: product.name,
      specs: product.specs,
      status: product.status,
      updatedAt: product.updatedAt.toISOString(),
    });
  });

  it.each(["unknown-id", "not a valid cuid", "\0"])(
    "returns 404 for an unknown or malformed id: %j",
    async (id) => {
      const response = await adminDetailRoute.GET(
        apiRequest("/api/admin/products/missing", {
          token: await validAdminToken(),
        }),
        detailContext(id),
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Not found" });
      expect(response.headers.get("cache-control")).toBe("no-store");
    },
  );
});

describe("admin product updates", () => {
  it("persists editable fields, returns DB state, bumps updatedAt, and preserves protected fields", async () => {
    const product = await db.product.create({
      data: buildProduct({ updatedAt: new Date("2020-01-01T00:00:00.000Z") }),
    });
    const response = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        validEdit,
        await validAdminToken(),
      ),
      detailContext(product.id),
    );
    const body = await response.json();
    const persisted = await db.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    expect(response.status).toBe(200);
    expect(Object.keys(body.data).sort()).toEqual(adminProductKeys);
    expect(body.data).toEqual({
      id: persisted.id,
      slug: persisted.slug,
      name: persisted.name,
      specs: persisted.specs,
      description: persisted.description,
      seoTitle: persisted.seoTitle,
      seoDescription: persisted.seoDescription,
      status: persisted.status,
      updatedAt: persisted.updatedAt.toISOString(),
    });
    expect(persisted.updatedAt.getTime()).toBeGreaterThan(
      product.updatedAt.getTime(),
    );
    expect({
      name: persisted.name,
      specs: persisted.specs,
      slug: persisted.slug,
    }).toEqual({
      name: product.name,
      specs: product.specs,
      slug: product.slug,
    });
    expect(revalidatePublicProduct).toHaveBeenCalledWith(product.slug);
  });

  it("accepts exact Cyrillic boundary values", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const boundaryEdit = {
      description: "я".repeat(1000),
      seoTitle: "ї".repeat(60),
      seoDescription: "є".repeat(160),
      status: "PUBLISHED",
    };
    const response = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        boundaryEdit,
        await validAdminToken(),
      ),
      detailContext(product.id),
    );

    expect(response.status).toBe(200);
    await expect(
      db.product.findUniqueOrThrow({ where: { id: product.id } }),
    ).resolves.toMatchObject(boundaryEdit);
  });

  it("trims editable text before saving", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        {
          description: "  Опис  ",
          seoTitle: "\n Заголовок\t",
          seoDescription: "  SEO опис ",
          status: "DRAFT",
        },
        await validAdminToken(),
      ),
      detailContext(product.id),
    );
    const persisted = await db.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    expect(response.status).toBe(200);
    expect(persisted).toMatchObject({
      description: "Опис",
      seoTitle: "Заголовок",
      seoDescription: "SEO опис",
    });
  });

  it("stores and returns script-like text as inert JSON", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        { ...validEdit, description: "<script>alert(1)</script>" },
        await validAdminToken(),
      ),
      detailContext(product.id),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.data.description).toBe("<script>alert(1)</script>");
    await expect(
      db.product.findUniqueOrThrow({ where: { id: product.id } }),
    ).resolves.toMatchObject({ description: "<script>alert(1)</script>" });
  });
});

describe("admin product update validation", () => {
  const invalidCases: Array<{
    name: string;
    body: unknown;
    field: string;
  }> = [
    {
      name: "empty description",
      body: { ...validEdit, description: "" },
      field: "description",
    },
    {
      name: "whitespace description",
      body: { ...validEdit, description: "   " },
      field: "description",
    },
    {
      name: "empty seoTitle",
      body: { ...validEdit, seoTitle: "" },
      field: "seoTitle",
    },
    {
      name: "whitespace seoTitle",
      body: { ...validEdit, seoTitle: " \n " },
      field: "seoTitle",
    },
    {
      name: "empty seoDescription",
      body: { ...validEdit, seoDescription: "" },
      field: "seoDescription",
    },
    {
      name: "whitespace seoDescription",
      body: { ...validEdit, seoDescription: "\t" },
      field: "seoDescription",
    },
    {
      name: "1001-character description",
      body: { ...validEdit, description: "я".repeat(1001) },
      field: "description",
    },
    {
      name: "61-character seoTitle",
      body: { ...validEdit, seoTitle: "я".repeat(61) },
      field: "seoTitle",
    },
    {
      name: "161-character seoDescription",
      body: { ...validEdit, seoDescription: "я".repeat(161) },
      field: "seoDescription",
    },
    ...["description", "seoTitle", "seoDescription", "status"].map((field) => {
      const body: Record<string, unknown> = { ...validEdit };
      delete body[field];
      return { name: `missing ${field}`, body, field };
    }),
    ...(["description", "seoTitle", "seoDescription"] as const).flatMap(
      (field) =>
        [42, null, []].map((value) => ({
          name: `${field} with ${String(value)} type`,
          body: { ...validEdit, [field]: value },
          field,
        })),
    ),
    {
      name: "invalid status",
      body: { ...validEdit, status: "ARCHIVED" },
      field: "status",
    },
    ...["name", "specs", "slug", "id", "updatedAt", "createdAt"].map(
      (field) => ({
        name: `extra ${field}`,
        body: { ...validEdit, [field]: field === "specs" ? [] : "forbidden" },
        field,
      }),
    ),
    { name: "array body", body: [], field: "_root" },
    { name: "null body", body: null, field: "_root" },
    { name: "string body", body: "invalid", field: "_root" },
  ];

  it.each(invalidCases)(
    "rejects $name and leaves the DB unchanged",
    async ({ body, field }) => {
      const product = await db.product.create({ data: buildProduct() });
      const response = await adminDetailRoute.PUT(
        jsonApiRequest(
          `/api/admin/products/${product.id}`,
          "PUT",
          body,
          await validAdminToken(),
        ),
        detailContext(product.id),
      );
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toMatchObject({
        error: "Validation failed",
        fieldErrors: { [field]: expect.any(Array) },
      });
      expect(responseBody.fieldErrors[field].length).toBeGreaterThan(0);
      await expectUnchanged(product);
      expect(revalidatePublicProduct).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed JSON", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.PUT(
      apiRequest(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: '{"description":',
        token: await validAdminToken(),
      }),
      detailContext(product.id),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Validation failed",
      fieldErrors: { _root: ["Malformed JSON"] },
    });
    await expectUnchanged(product);
  });

  it("rejects a non-JSON content type", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.PUT(
      apiRequest(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify(validEdit),
        contentType: "text/plain",
        token: await validAdminToken(),
      }),
      detailContext(product.id),
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: "Unsupported media type",
    });
    await expectUnchanged(product);
  });

  it("rejects a raw body larger than 16 KiB before JSON parsing", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.PUT(
      apiRequest(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: "x".repeat(16 * 1024 + 1),
        token: await validAdminToken(),
      }),
      detailContext(product.id),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Payload too large" });
    await expectUnchanged(product);
  });

  it("rejects cross-origin writes", async () => {
    const product = await db.product.create({ data: buildProduct() });
    const response = await adminDetailRoute.PUT(
      jsonApiRequest(
        `/api/admin/products/${product.id}`,
        "PUT",
        validEdit,
        await validAdminToken(),
        { origin: "https://evil.example" },
      ),
      detailContext(product.id),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    await expectUnchanged(product);
  });

  it("returns 404 for an unknown id without revalidating", async () => {
    const response = await adminDetailRoute.PUT(
      jsonApiRequest(
        "/api/admin/products/unknown-id",
        "PUT",
        validEdit,
        await validAdminToken(),
      ),
      detailContext("unknown-id"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
    expect(revalidatePublicProduct).not.toHaveBeenCalled();
  });
});

describe("admin API error and method surface", () => {
  it("sanitizes unexpected service errors", async () => {
    const error = new Error("database password and private stack");
    vi.spyOn(productService, "listAdminProducts").mockRejectedValueOnce(error);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await adminCollectionRoute.GET(
      apiRequest("/api/admin/products", {
        token: await validAdminToken(),
      }),
    );
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(500);
    expect(serialized).toBe('{"error":"Internal server error"}');
    expect(serialized).not.toContain(error.message);
    expect(serialized).not.toContain("stack");
    expect(consoleError).toHaveBeenCalledWith(error);
  });

  it("exports only GET for the collection and GET plus PUT for detail", () => {
    expect(Object.keys(adminCollectionRoute).sort()).toEqual(["GET"]);
    expect(Object.keys(adminDetailRoute).sort()).toEqual(["GET", "PUT"]);
  });

  it.each(["POST", "DELETE", "PATCH"] as const)(
    "returns 405 for authenticated %s on collection and detail",
    async (method) => {
      const token = await validAdminToken();
      const collection = await invokeRoute(
        adminCollectionRoute,
        apiRequest("/api/admin/products", { method, token }),
      );
      const detail = await invokeRoute(
        adminDetailRoute,
        apiRequest("/api/admin/products/product-id", { method, token }),
        detailContext("product-id"),
      );

      expect(collection.status).toBe(405);
      expect(detail.status).toBe(405);
      expect(await collection.json()).toEqual({ error: "Method Not Allowed" });
      expect(await detail.json()).toEqual({ error: "Method Not Allowed" });
    },
  );

  it("uses no-store for protocol errors too", async () => {
    const response = await adminDetailRoute.PUT(
      new NextRequest(`${API_BASE_URL}/api/admin/products/x`, {
        method: "PUT",
        headers: {
          cookie: `pcs_session=${await validAdminToken()}`,
          "content-type": "text/plain",
        },
        body: "{}",
      }),
      detailContext("x"),
    );

    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
