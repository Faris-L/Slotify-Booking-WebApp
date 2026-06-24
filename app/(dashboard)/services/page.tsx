import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryList } from "@/components/services/category-list";
import { ServiceList } from "@/components/services/service-list";
import { requireOwnerContext } from "@/lib/business/context";
import { getServiceCategories, getServices } from "@/lib/services/queries";

export default async function ServicesPage() {
  const { supabase, business } = await requireOwnerContext();
  const [categories, services] = await Promise.all([
    getServiceCategories(supabase, business.id),
    getServices(supabase, business.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Services
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage what clients can book — duration, price, and categories.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <CategoryList categories={categories} />
        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle>All services</CardTitle>
            <CardDescription>
              {services.length} service{services.length === 1 ? "" : "s"} ·
              prices in {business.currency}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceList
              services={services}
              categories={categories}
              currency={business.currency}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
