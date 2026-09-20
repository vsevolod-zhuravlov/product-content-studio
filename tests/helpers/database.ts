import { db } from "@/lib/db";

export async function resetDb(): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "Product", "User" RESTART IDENTITY CASCADE',
  );
}
