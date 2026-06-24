"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/components/dashboard/dashboard-nav";
import { cn } from "@/lib/utils";

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard mobile"
      className="flex gap-1 overflow-x-auto border-b border-sky-100 bg-white px-4 py-2 md:hidden"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-sky-100 text-sky-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
