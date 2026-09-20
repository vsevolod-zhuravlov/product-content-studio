import { AppLogo } from "./app-logo";
import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";

type AdminHeaderProps = {
  email: string;
};

export function AdminHeader({ email }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <AppLogo />
        <div className="ml-auto">
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
