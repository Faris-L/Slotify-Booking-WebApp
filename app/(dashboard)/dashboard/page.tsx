import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnerBusiness } from "@/lib/business/queries";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const business = user ? await getOwnerBusiness(supabase, user.id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back. Your business is ready for the next setup steps.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle>{business?.name ?? "Your business"}</CardTitle>
            <CardDescription>Public booking page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Your page will be available at:
            </p>
            <code className="block rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
              /{business?.slug}
            </code>
            <p className="text-xs text-muted-foreground">
              The public booking flow arrives in Phase 5.
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
            <CardDescription>Phase 3 — business configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Add services and categories</li>
              <li>Add staff members</li>
              <li>Set working hours and time off</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{user?.email}</span>
        {" · "}
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
