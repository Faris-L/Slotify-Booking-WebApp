import { BookingSettingsForm } from "@/components/settings/booking-settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOwnerContext } from "@/lib/business/context";
import { getBusinessSettings } from "@/lib/business/settings-queries";

export default async function SettingsPage() {
  const { supabase, business } = await requireOwnerContext();
  const settings = await getBusinessSettings(supabase, business.id);

  if (!settings) {
    throw new Error("Business settings not found.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Booking policies for{" "}
          <span className="font-medium text-foreground">{settings.name}</span>.
        </p>
      </div>

      <Card className="border-sky-100">
        <CardHeader>
          <CardTitle>Booking policies</CardTitle>
          <CardDescription>
            Controls how clients book, confirm, and manage appointments on your
            public page{" "}
            <code className="rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-800">
              /{settings.slug}
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingSettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
