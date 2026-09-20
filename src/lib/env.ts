import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().refine(isPostgresUrl, {
    error: "має бути коректною URL-адресою PostgreSQL",
  }),
  JWT_SECRET: z.string().min(32, {
    error: "має містити щонайменше 32 символи",
  }),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

function isPostgresUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

export function parseEnv(source: unknown): Env {
  const result = envSchema.safeParse(source);

  if (result.success) {
    return result.data;
  }

  const flattened = z.flattenError(result.error);
  const details = Object.entries(flattened.fieldErrors).map(
    ([name, reasons]) => `${name}: ${reasons?.join(", ")}`,
  );

  if (flattened.formErrors.length > 0) {
    details.push(`environment: ${flattened.formErrors.join(", ")}`);
  }

  throw new Error(`Invalid environment variables:\n- ${details.join("\n- ")}`);
}

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
