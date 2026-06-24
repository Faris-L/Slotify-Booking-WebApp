import type { PublicCatalog } from "@/lib/booking/queries";

type BusinessHeaderProps = {
  catalog: PublicCatalog;
};

export function BusinessHeader({ catalog }: BusinessHeaderProps) {
  const { business } = catalog;
  const brandColor = business.brand_color ?? "#0ea5e9";

  return (
    <header
      className="border-b border-sky-100 bg-white"
      style={{ borderTopColor: brandColor, borderTopWidth: 4 }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
          style={{ backgroundColor: brandColor }}
        >
          {business.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
            {business.name}
          </h1>
          {business.description ? (
            <p className="truncate text-sm text-muted-foreground">
              {business.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Book an appointment</p>
          )}
        </div>
      </div>
    </header>
  );
}
