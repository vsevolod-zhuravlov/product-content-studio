import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type FormBannerKind =
  | "validation"
  | "unauthorized"
  | "not_found"
  | "retryable";

type FormErrorBannerProps = {
  kind: FormBannerKind;
  productId: string;
  onRetry?: () => void;
};

const LOGIN_HREF = "/admin/login";

export function FormErrorBanner({
  kind,
  productId,
  onRetry,
}: FormErrorBannerProps) {
  const loginHref = `${LOGIN_HREF}?next=${encodeURIComponent(`/admin/products/${productId}`)}`;

  if (kind === "validation") {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Сервер відхилив дані</AlertTitle>
        <AlertDescription>Перевірте виділені поля.</AlertDescription>
      </Alert>
    );
  }

  if (kind === "unauthorized") {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Сесія закінчилась</AlertTitle>
        <AlertDescription>
          <a href={loginHref} target="_blank" rel="noopener noreferrer">
            Увійти знову
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (kind === "not_found") {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Товар більше не існує</AlertTitle>
        <AlertDescription>
          <Link href="/admin/products">До списку товарів</Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>Не вдалося зберегти</AlertTitle>
      <AlertDescription>
        <p>
          Не вдалося зберегти. Ваші правки збережено у формі — спробуйте ще раз
        </p>
        {onRetry ? (
          <Button type="button" variant="outline" className="mt-3 h-10" onClick={onRetry}>
            Спробувати ще раз
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
