import { execFileSync } from "node:child_process";
import { Pool } from "pg";
import { getE2eDatabaseUrl } from "../../tests/database-url";

export type ProductStatus = "DRAFT" | "PUBLISHED";

export type Product = {
  id: string;
  slug: string;
  name: string;
  specs: Array<{ label: string; value: string }>;
  description: string;
  seoTitle: string;
  seoDescription: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};

const connectionString = getE2eDatabaseUrl();
const pool = new Pool({ connectionString });

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    specs: row.specs as Product["specs"],
    description: String(row.description),
    seoTitle: String(row.seoTitle),
    seoDescription: String(row.seoDescription),
    status: row.status as ProductStatus,
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
  };
}

export async function resetAndSeed(): Promise<void> {
  await pool.query('TRUNCATE TABLE "Product", "User" RESTART IDENTITY CASCADE');
  execFileSync("npm", ["exec", "--", "prisma", "db", "seed"], {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "pipe",
  });
}

export async function getProductById(id: string): Promise<Product> {
  const result = await pool.query('SELECT * FROM "Product" WHERE id = $1', [
    id,
  ]);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw new Error(`Product ${id} was not found.`);
  }
  return mapProduct(row);
}

export async function findProductBySlug(slug: string): Promise<Product> {
  const result = await pool.query('SELECT * FROM "Product" WHERE slug = $1', [
    slug,
  ]);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw new Error(`Product slug ${slug} was not found.`);
  }
  return mapProduct(row);
}

export async function findPublishedProduct(
  slug = "halo-hub",
): Promise<Product> {
  const product = await findProductBySlug(slug);
  if (product.status !== "PUBLISHED") {
    throw new Error(`Expected ${slug} to be published.`);
  }
  return product;
}

export async function findDraftProduct(): Promise<Product> {
  const result = await pool.query(
    `SELECT * FROM "Product" WHERE status = 'DRAFT' ORDER BY name ASC LIMIT 1`,
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw new Error("No draft product found.");
  }
  return mapProduct(row);
}

export async function findOtherPublished(
  excludeSlug: string,
): Promise<Product> {
  const result = await pool.query(
    `SELECT * FROM "Product"
     WHERE status = 'PUBLISHED' AND slug <> $1
     ORDER BY name ASC LIMIT 1`,
    [excludeSlug],
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw new Error("No other published product found.");
  }
  return mapProduct(row);
}

export async function listProducts(): Promise<Product[]> {
  const result = await pool.query('SELECT * FROM "Product" ORDER BY name ASC');
  return (result.rows as Array<Record<string, unknown>>).map(mapProduct);
}

export async function countByStatus() {
  const result = await pool.query(
    `SELECT status, COUNT(*)::int AS count FROM "Product" GROUP BY status`,
  );
  const counts = { published: 0, drafts: 0, total: 0 };
  for (const row of result.rows as Array<{ status: string; count: number }>) {
    if (row.status === "PUBLISHED") counts.published = row.count;
    if (row.status === "DRAFT") counts.drafts = row.count;
    counts.total += row.count;
  }
  return counts;
}
