import { redirect } from "next/navigation";

import { SetupWizardForm } from "@/components/setup/setup-wizard-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { getOwnerBusiness } from "@/lib/business/queries";
import { createClient } from "@/utils/supabase/server";

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/setup");
  }

  const business = await getOwnerBusiness(supabase, user.id);
  if (business) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <BrandMark />
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl justify-center px-6 py-16">
        <SetupWizardForm />
      </main>
    </div>
  );
}
