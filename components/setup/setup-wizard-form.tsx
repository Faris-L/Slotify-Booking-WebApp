"use client";

import { useActionState, useState } from "react";

import { createBusiness, type BusinessSetupState } from "@/lib/business/actions";
import {
  BUSINESS_CURRENCIES,
  BUSINESS_TIMEZONES,
  DEFAULT_BRAND_COLOR,
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
} from "@/lib/constants/business";
import { slugifyName } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: BusinessSetupState = {};

export function SetupWizardForm() {
  const [state, formAction, pending] = useActionState(
    createBusiness,
    initialState
  );
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <Card className="w-full max-w-lg border-sky-100 shadow-sm">
      <CardHeader>
        <CardTitle>Set up your business</CardTitle>
        <CardDescription>
          Add the basics for your public booking page. You can configure
          services and staff in the next step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Studio Nova"
              onChange={(event) => {
                if (!slugTouched) {
                  setSlug(slugifyName(event.target.value));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Booking URL slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="slug"
                name="slug"
                required
                value={slug}
                placeholder="studio-nova"
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value.toLowerCase());
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens. This becomes your public
              link.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={DEFAULT_TIMEZONE}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {BUSINESS_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                name="currency"
                defaultValue={DEFAULT_CURRENCY}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {BUSINESS_CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="brandColor"
                name="brandColor"
                type="color"
                defaultValue={DEFAULT_BRAND_COLOR}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <span className="text-sm text-muted-foreground">
                Used on your public booking page
              </span>
            </div>
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating business…" : "Continue to dashboard"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
