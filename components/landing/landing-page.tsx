import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Clock,
  Globe,
  Scissors,
  Smartphone,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import {
  DEMO_FEATURES,
  DEMO_INDUSTRIES,
  DEMO_LANDING_BOOKING,
} from "@/lib/demo/mock-data";

const featureIcons = [Globe, CalendarDays, Clock, Bell, Users, Smartphone] as const;

type LandingPageProps = {
  isLoggedIn: boolean;
};

export function LandingPage({ isLoggedIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandMark />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/demo" />}
            >
              View demo
            </Button>
            {isLoggedIn ? (
              <Button nativeButton={false} render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/register" />}
                >
                  Get started free
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.88_0.08_230),transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Scissors className="size-3.5" />
              Online booking for service businesses
            </div>
            <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Appointments without chaos.{" "}
              <span className="text-primary">Booking that works.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Slotify gives you a public booking page, smart calendar, and
              automatic reminders — so you run the business, not the phone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isLoggedIn ? (
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/dashboard" />}
                >
                  Open dashboard
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={<Link href="/register" />}
                  >
                    Create your business
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/demo" />}
                  >
                    See demo
                  </Button>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card · 5-minute setup
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
              <div className="border-b border-border bg-primary px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white">
                    {DEMO_LANDING_BOOKING.businessName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {DEMO_LANDING_BOOKING.businessName}
                    </p>
                    <p className="text-xs text-white/75">Book an appointment</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Service
                  </p>
                  <div className="mt-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <p className="font-medium">
                      {DEMO_LANDING_BOOKING.serviceName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {DEMO_LANDING_BOOKING.duration} ·{" "}
                      {DEMO_LANDING_BOOKING.price}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date & time
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {DEMO_LANDING_BOOKING.times.map((time, i) => (
                      <div
                        key={time}
                        className={`rounded-lg border px-2 py-2.5 text-center text-sm font-medium ${
                          i === DEMO_LANDING_BOOKING.selectedTimeIndex
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">
                  Confirm booking
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Built for
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {DEMO_INDUSTRIES.map((item) => (
              <span
                key={item}
                className="text-sm font-medium text-foreground/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for online booking
          </h2>
          <p className="mt-3 text-muted-foreground">
            From first setup to automatic reminders — one tool, end to end.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_FEATURES.map(({ title, description }, index) => {
            const Icon = featureIcons[index];
            return (
              <article
                key={title}
                className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"
          />
          <h2 className="relative font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready for your first booking?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/80">
            Set up your business, add services, and share your link — clients
            can book right away.
          </p>
          {!isLoggedIn && (
            <Button
              size="lg"
              variant="secondary"
              className="relative mt-8"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              Get started free
            </Button>
          )}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <BrandMark />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Slotify
          </p>
        </div>
      </footer>
    </div>
  );
}
