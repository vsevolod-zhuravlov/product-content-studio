process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/unit_test";
process.env.JWT_SECRET ??=
  "unit-test-jwt-secret-that-is-at-least-32-characters";
