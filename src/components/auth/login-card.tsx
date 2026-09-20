import { Package } from "lucide-react";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginCard({ children }: { children: ReactNode }) {
  return (
    <Card className="w-full max-w-md bg-white py-8 shadow-xl shadow-primary/10 ring-border sm:py-10">
      <CardHeader className="items-center gap-5 px-6 text-center sm:px-10">
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Package className="size-5" aria-hidden="true" />
          </span>
          <span>Product Content Studio</span>
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Вхід до адмін-панелі
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 sm:px-10">{children}</CardContent>
    </Card>
  );
}
