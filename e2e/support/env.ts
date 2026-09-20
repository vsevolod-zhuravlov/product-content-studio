export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL ?? "admin@example.com")
      .trim()
      .toLowerCase(),
    password: process.env.ADMIN_PASSWORD ?? "change-me",
  };
}
