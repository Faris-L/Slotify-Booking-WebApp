import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatDuration,
  formatPrice,
} from "@/lib/booking/format";
import type { PublicCatalog } from "@/lib/booking/queries";

type ServiceCatalogProps = {
  catalog: PublicCatalog;
  bookBasePath: string;
};

export function ServiceCatalog({ catalog, bookBasePath }: ServiceCatalogProps) {
  const { business, categories, services } = catalog;

  const servicesByCategory = categories.map((category) => ({
    category,
    services: services.filter((service) => service.category_id === category.id),
  }));

  const uncategorized = services.filter((service) => !service.category_id);

  if (services.length === 0) {
    return (
      <Card className="border-sky-100">
        <CardHeader>
          <CardTitle>No services yet</CardTitle>
          <CardDescription>
            This business has not published any bookable services.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {servicesByCategory.map(({ category, services: categoryServices }) =>
        categoryServices.length === 0 ? null : (
          <section key={category.id} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              {category.name}
            </h2>
            <div className="grid gap-3">
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  currency={business.currency}
                  bookHref={`${bookBasePath}?service=${service.id}`}
                />
              ))}
            </div>
          </section>
        )
      )}

      {uncategorized.length > 0 && (
        <section className="space-y-3">
          {categories.length > 0 && (
            <h2 className="text-lg font-semibold text-foreground">Other</h2>
          )}
          <div className="grid gap-3">
            {uncategorized.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                currency={business.currency}
                bookHref={`${bookBasePath}?service=${service.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  currency,
  bookHref,
}: {
  service: PublicCatalog["services"][number];
  currency: string;
  bookHref: string;
}) {
  return (
    <Card className="border-sky-100">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{service.name}</h3>
            <Badge variant="secondary">{formatDuration(service.duration_minutes)}</Badge>
          </div>
          {service.description ? (
            <p className="text-sm text-muted-foreground">{service.description}</p>
          ) : null}
          <p className="text-sm font-medium text-foreground">
            {formatPrice(service.price, currency)}
          </p>
        </div>
        <Button
          nativeButton={false}
          className="shrink-0"
          render={<Link href={bookHref} />}
        >
          Book
        </Button>
      </CardContent>
    </Card>
  );
}
