import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        S
      </div>
      <span className="font-heading text-lg font-bold tracking-tight text-foreground">
        Slotify
      </span>
    </Link>
  );
}
