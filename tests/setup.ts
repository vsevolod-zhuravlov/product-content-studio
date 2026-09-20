import { config } from "dotenv";
import { getTestDatabaseUrl } from "./database-url";

config({ path: ".env", quiet: true });
process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.JWT_SECRET =
  "integration-test-jwt-secret-that-is-at-least-32-characters";
