"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "./unsaved-changes-provider";

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
  const { isDirty, requestLeave } = useUnsavedChanges();

  return (
    <Link
      href={href}
      replace={replace}
      scroll={scroll}
      onNavigate={(event) => {
        onNavigate?.(event);
        if (!isDirty) return;

        event.preventDefault();
        requestLeave(() => {
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
