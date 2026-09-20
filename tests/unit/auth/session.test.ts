import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { signSession } from "@/lib/auth/jwt";
import { getSession, requireAdminPage } from "@/lib/auth/session";

const { cookieGet, redirect } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("requireAdminPage", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    redirect.mockClear();
  });

  it("redirects to login when the session cookie is absent", async () => {
    cookieGet.mockReturnValue(undefined);

    await expect(getSession()).resolves.toBeNull();
    await expect(requireAdminPage()).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login",
    );
    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects to login when the session cookie is invalid", async () => {
    cookieGet.mockReturnValue({ name: AUTH_COOKIE_NAME, value: "not-a-jwt" });

    await expect(getSession()).resolves.toBeNull();
    await expect(requireAdminPage()).rejects.toThrow(
      "NEXT_REDIRECT:/admin/login",
    );
    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("returns the user when the session is valid", async () => {
    const token = await signSession({
      sub: "admin-1",
      email: "admin@example.com",
    });
    cookieGet.mockReturnValue({ name: AUTH_COOKIE_NAME, value: token });

    await expect(requireAdminPage()).resolves.toMatchObject({
      sub: "admin-1",
      email: "admin@example.com",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
