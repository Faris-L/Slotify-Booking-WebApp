import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        S
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Slotify
      </span>
    </Link>
  );
}
