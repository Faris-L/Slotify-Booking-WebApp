import Link from "next/link";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStats } from "@/lib/bookings/types";

type StatsOverviewProps = {
  stats: DashboardStats;
  slug: string;
};

export function StatsOverview({ stats, slug }: StatsOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-sky-100">
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl">{stats.todayCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/calendar" className="text-sm text-primary hover:underline">
              View calendar →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-sky-100">
          <CardHeader className="pb-2">
            <CardDescription>This week</CardDescription>
            <CardTitle className="text-3xl">{stats.weekCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">All appointments</p>
          </CardContent>
        </Card>

        <Card className="border-sky-100">
          <CardHeader className="pb-2">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-3xl">{stats.clientCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/clients" className="text-sm text-primary hover:underline">
              View clients →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-sky-100">
          <CardHeader className="pb-2">
            <CardDescription>Public page</CardDescription>
            <CardTitle className="text-lg truncate">/{slug}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/${slug}`}
              className="text-sm text-primary hover:underline"
            >
              Open booking page →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle className="text-base">This week by status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(Object.keys(stats.statusCounts) as Array<keyof typeof stats.statusCounts>).map(
              (status) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg border border-sky-100 px-3 py-2"
                >
                  <BookingStatusBadge status={status} />
                  <span className="text-sm font-semibold">
                    {stats.statusCounts[status]}
                  </span>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle className="text-base">Today by staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.todayByEmployee.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments today</p>
            ) : (
              stats.todayByEmployee.map((row) => (
                <div
                  key={row.employeeId}
                  className="flex items-center justify-between rounded-lg bg-sky-50/50 px-3 py-2 text-sm"
                >
                  <span>{row.name}</span>
                  <span className="font-semibold">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
