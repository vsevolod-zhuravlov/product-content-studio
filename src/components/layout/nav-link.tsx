"use client";

import { usePathname } from "next/navigation";
import { cn } from "cn";
import { GuardedLink } from "@/components/common/guarded-link";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
};

export function NavLink({
  href,
  children,
  className,
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (!exact && href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <GuardedLink
      href={href}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive || undefined}
      className={cn(
        "inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
        className,
      )}
    >
      {children}
    </GuardedLink>
  );
}
