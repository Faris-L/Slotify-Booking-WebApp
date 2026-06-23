import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <BrandMark />
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl justify-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}
