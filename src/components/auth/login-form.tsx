"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
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
        let shouldFocus = true;

        for (const field of ["email", "password"] as const) {
          const message = body.fieldErrors[field]?.[0];
          if (message) {
            setError(field, { message }, { shouldFocus });
            shouldFocus = false;
          }
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
    <form onSubmit={onSubmit} noValidate>
      <fieldset className="space-y-5" disabled={isSubmitting}>
        <div className="space-y-2">
          <Label htmlFor="email">Електронна пошта</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-10 bg-white"
            {...register("email")}
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-10 bg-white"
            {...register("password")}
          />
          {errors.password && (
            <p
              id="password-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <Button className="h-10 w-full" type="submit">
          {isSubmitting && (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          )}
          Увійти
        </Button>
      </fieldset>
    </form>
  );
}
