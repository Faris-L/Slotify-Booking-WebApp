"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerContext } from "@/lib/business/context";
import { businessSettingsSchema } from "@/lib/validations/business-settings";

export type ActionState = {
  error?: string;
  success?: string;
};

function revalidateSettings() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateBusinessSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = businessSettingsSchema.safeParse({
    confirmationMode: formData.get("confirmationMode"),
    minLeadMinutes: formData.get("minLeadMinutes"),
    cancelCutoffHours: formData.get("cancelCutoffHours"),
    allowAnyEmployee: formData.get("allowAnyEmployee"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_businesses")
    .update({
      confirmation_mode: parsed.data.confirmationMode,
      min_lead_minutes: parsed.data.minLeadMinutes,
      cancel_cutoff_hours: parsed.data.cancelCutoffHours,
      allow_any_employee: parsed.data.allowAnyEmployee,
    })
    .eq("id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateSettings();
  return { success: "Settings saved." };
}
