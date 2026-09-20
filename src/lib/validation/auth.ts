import { z } from "zod";

export const loginSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ error: "Введіть коректну пошту" }),
  password: z
    .string()
    .min(1, { error: "Обов'язкове поле" })
    .max(128, { error: "Максимум 128 символів" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
