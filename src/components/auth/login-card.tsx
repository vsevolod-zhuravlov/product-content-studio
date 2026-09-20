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
      <CardHeader className="px-6 sm:px-10 mb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Вхід до адмін-панелі
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 sm:px-10">{children}</CardContent>
    </Card>
  );
}
