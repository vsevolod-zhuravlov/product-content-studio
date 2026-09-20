export function assertTestDatabaseUrl(value: string): string {
  const url = new URL(value);
  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      "Refusing to run tests: database name must end with _test.",
    );
  }

  return value;
}

export function getTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL;

  if (!value) {
    throw new Error("TEST_DATABASE_URL is required to run integration tests.");
  }

  return assertTestDatabaseUrl(value);
}

export function getE2eDatabaseUrl(): string {
  const explicit = process.env.E2E_DATABASE_URL;
  if (explicit) {
    return assertTestDatabaseUrl(explicit);
  }

  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      "E2E_DATABASE_URL or TEST_DATABASE_URL is required to run end-to-end tests.",
    );
  }

  assertTestDatabaseUrl(testUrl);

  const url = new URL(testUrl);
  const databaseName = decodeURIComponent(url.pathname.slice(1));
  const e2eName = databaseName.replace(/_test$/, "_e2e_test");
  url.pathname = `/${e2eName}`;

  return assertTestDatabaseUrl(url.toString());
}
