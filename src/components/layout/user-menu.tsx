"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/components/common/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  email: string;
};

function getInitials(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const parts = localPart.split(/[._-]+/).filter(Boolean);

  if (parts.length > 1) {
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return localPart.slice(0, 2).toUpperCase() || "?";
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const { requestLeave } = useUnsavedChanges();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      router.replace("/admin/login");
      router.refresh();
    } catch (logoutError) {
      setError("Не вдалося вийти. Спробуйте ще раз.");
      throw logoutError;
    } finally {
      setIsPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="size-10"
            aria-label={`Меню користувача ${email}`}
          >
            <span
              className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
              aria-hidden="true"
            >
              {getInitials(email)}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        {error ? (
          <p role="alert" className="px-1.5 py-1 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          variant="destructive"
          onClick={() => requestLeave(logout)}
        >
          <LogOut aria-hidden="true" />
          {isPending ? "Вихід…" : "Вийти"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
