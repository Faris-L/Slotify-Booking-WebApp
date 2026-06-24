import { signOut } from "@/lib/auth/actions";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}

export function DashboardShell({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="border-b border-sky-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <BrandMark href="/dashboard" />
            <span className="truncate text-sm text-muted-foreground">
              {businessName}
            </span>
          </div>
          <SignOutButton />
        </div>
      </header>
      <DashboardMobileNav />
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <aside className="hidden w-44 shrink-0 md:block">
          <DashboardNav />
        </aside>
        <main id="dashboard-main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
