export function getTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;

  if (!value) {
    throw new Error("TEST_DATABASE_URL is required to run integration tests.");
  }

  const url = new URL(value);
  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      "Refusing to run integration tests: TEST_DATABASE_URL database name must end with _test.",
    );
  }

  return value;
}
