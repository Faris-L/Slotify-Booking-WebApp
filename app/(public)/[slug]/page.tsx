import Link from "next/link";
import { notFound } from "next/navigation";

import { BusinessHeader } from "@/components/booking/business-header";
import { ServiceCatalog } from "@/components/booking/service-catalog";
import { Button } from "@/components/ui/button";
import { getPublicCatalog } from "@/lib/booking/queries";
import { createClient } from "@/utils/supabase/server";

type PublicBusinessPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicBusinessPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const catalog = await getPublicCatalog(supabase, slug);

  if (!catalog) {
    return { title: "Not found · Slotify" };
  }

  return {
    title: `${catalog.business.name} · Book online`,
    description:
      catalog.business.description ??
      `Book an appointment at ${catalog.business.name}`,
  };
}

export default async function PublicBusinessPage({
  params,
}: PublicBusinessPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const catalog = await getPublicCatalog(supabase, slug);

  if (!catalog) {
    notFound();
  }

  const bookBasePath = `/${slug}/book`;

  return (
    <div className="min-h-screen bg-background">
      <BusinessHeader catalog={catalog} />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Services</h2>
            <p className="text-sm text-muted-foreground">
              Choose a service to book online.
            </p>
          </div>
          {catalog.services.length > 0 ? (
            <Button nativeButton={false} render={<Link href={bookBasePath} />}>
              Book now
            </Button>
          ) : null}
        </div>
        <ServiceCatalog catalog={catalog} bookBasePath={bookBasePath} />
      </main>
    </div>
  );
}
