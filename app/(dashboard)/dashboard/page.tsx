import Link from "next/link";

import { StatsOverview } from "@/components/dashboard/stats-overview";
import { getDashboardStats } from "@/lib/bookings/queries";
import { requireOwnerContext } from "@/lib/business/context";

export default async function DashboardPage() {
  const { supabase, business } = await requireOwnerContext();
  const stats = await getDashboardStats(supabase, business.id, business.timezone);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Today and this week at a glance for {business.name}.
        </p>
      </div>

      <StatsOverview stats={stats} slug={business.slug} />

      <p className="text-sm text-muted-foreground">
        Manage appointments in{" "}
        <Link href="/calendar" className="text-primary hover:underline">
          Calendar
        </Link>
        {" · "}
        Configure{" "}
        <Link href="/services" className="text-primary hover:underline">
          Services
        </Link>
        {" and "}
        <Link href="/schedule" className="text-primary hover:underline">
          Schedule
        </Link>
      </p>
    </div>
  );
}
