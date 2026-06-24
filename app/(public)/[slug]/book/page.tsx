import { notFound } from "next/navigation";

import { BookingWizard } from "@/components/booking/booking-wizard";
import { getPublicCatalog } from "@/lib/booking/queries";
import { createClient } from "@/utils/supabase/server";

type PublicBookPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export default async function PublicBookPage({
  params,
  searchParams,
}: PublicBookPageProps) {
  const { slug } = await params;
  const { service: serviceId } = await searchParams;
  const supabase = await createClient();
  const catalog = await getPublicCatalog(supabase, slug);

  if (!catalog) {
    notFound();
  }

  if (catalog.services.length === 0) {
    notFound();
  }

  const validServiceId =
    serviceId && catalog.services.some((service) => service.id === serviceId)
      ? serviceId
      : undefined;

  return (
    <BookingWizard
      catalog={catalog}
      initialServiceId={validServiceId}
      backHref={`/${slug}`}
    />
  );
}
