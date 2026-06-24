import { redirect } from "next/navigation";

import { getOwnerBusiness, type OwnerBusiness } from "@/lib/business/queries";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type OwnerContext = {
  supabase: SupabaseClient;
  user: User;
  business: OwnerBusiness;
};

export async function requireOwnerContext(): Promise<OwnerContext> {
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

  return { supabase, user, business };
}
