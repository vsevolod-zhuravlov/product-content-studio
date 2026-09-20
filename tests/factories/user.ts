import { hash } from "bcryptjs";

export async function buildUser(
  overrides: Partial<{
    email: string;
    password: string;
  }> = {},
) {
  const email = overrides.email ?? "admin@example.com";
  const password = overrides.password ?? "correct-password";

  return {
    password,
    data: {
      email,
      passwordHash: await hash(password, 4),
    },
  };
}
