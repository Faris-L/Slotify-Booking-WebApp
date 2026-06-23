"use server";

import { redirect } from "next/navigation";

import { getOwnerBusiness } from "@/lib/business/queries";
import { businessSetupSchema } from "@/lib/validations/business";
import { createClient } from "@/utils/supabase/server";

export type BusinessSetupState = {
  error?: string;
};

export async function createBusiness(
  _prevState: BusinessSetupState,
  formData: FormData
): Promise<BusinessSetupState> {
  const parsed = businessSetupSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    brandColor: formData.get("brandColor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a business." };
  }

  const existing = await getOwnerBusiness(supabase, user.id);
  if (existing) {
    redirect("/dashboard");
  }

  const { error } = await supabase.from("book_businesses").insert({
    owner_id: user.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    timezone: parsed.data.timezone,
    currency: parsed.data.currency,
    brand_color: parsed.data.brandColor,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This booking URL slug is already taken. Try another." };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}
