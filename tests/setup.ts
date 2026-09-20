import { config } from "dotenv";
import { getTestDatabaseUrl } from "./database-url";

config({ path: ".env", quiet: true });
process.env.DATABASE_URL = getTestDatabaseUrl();
