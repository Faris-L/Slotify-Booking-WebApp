import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOwnerBusiness } from "@/lib/business/queries";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const business = await getOwnerBusiness(supabase, user.id);
  if (!business) {
    redirect("/setup");
  }

  return (
    <DashboardShell businessName={business.name}>{children}</DashboardShell>
  );
}
