import "server-only";
import { compare, hash } from "bcryptjs";

const BCRYPT_COST = 12;

export const DUMMY_PASSWORD_HASH =
  "$2b$12$epR62a9hHWW7FgJxrMbu0uIPgI3aOEkh0OU4xrmWxzZEi1NqLcduy";

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}
