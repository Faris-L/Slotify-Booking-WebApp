import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count, error } = await supabase
    .from("book_businesses")
    .select("*", { count: "exact", head: true });

  const connected = !error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <BrandMark />
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
            Faza 2 · auth + onboarding
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
          Online rezervacije
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Jednostavan booking za salone i uslužne biznise
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Slotify povezuje vlasnike i klijente — od podešavanja termina do
          potvrde rezervacije.
        </p>

        <div className="mt-10 w-full max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-foreground">Supabase status</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {connected
              ? `Povezano · book_businesses: ${count ?? 0} redova`
              : `Greška: ${error?.message}`}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className={`size-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <span className="text-xs text-muted-foreground">
              {connected ? "Baza spremna (Faza 1 ✅)" : "Provjeri .env.local"}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
          ) : (
            <>
              <Button nativeButton={false} render={<Link href="/login" />}>
                Prijava
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                Registracija
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
