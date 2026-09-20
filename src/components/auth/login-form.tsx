"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

type ErrorResponse = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json().catch(() => ({}))) as ErrorResponse;

      if (response.ok) {
        router.replace(safeRedirectPath(next));
        router.refresh();
        return;
      }

      if (response.status === 400 && body.fieldErrors) {
        for (const field of ["email", "password"] as const) {
          const message = body.fieldErrors[field]?.[0];
          if (message) setError(field, { message });
        }
        return;
      }

      setError("root", {
        message:
          response.status === 401
            ? "Невірна пошта або пароль"
            : "Не вдалося увійти. Спробуйте ще раз",
      });
    } catch {
      setError("root", {
        message: "Не вдалося увійти. Спробуйте ще раз",
      });
    }
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Вхід до Product Content Studio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <fieldset className="space-y-4" disabled={isSubmitting}>
            <div className="space-y-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            <Button className="w-full" type="submit">
              {isSubmitting ? "Входимо…" : "Увійти"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
