"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptionalUnsavedChanges } from "./unsaved-changes-provider";

type GuardedLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function GuardedLink({
  href,
  replace,
  scroll,
  onNavigate,
  ...props
}: GuardedLinkProps) {
  const router = useRouter();
  const unsaved = useOptionalUnsavedChanges();
  const isDirty = unsaved?.isDirty ?? false;
  const requestLeave = unsaved?.requestLeave;

  return (
    <Link
      href={href}
      replace={replace}
      scroll={scroll}
      onNavigate={(event) => {
        onNavigate?.(event);
        if (!isDirty) return;

        event.preventDefault();
        requestLeave?.(() => {
          if (replace) {
            router.replace(href, { scroll });
          } else {
            router.push(href, { scroll });
          }
        });
      }}
      {...props}
    />
  );
}
