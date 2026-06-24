"use server";

import { redirect } from "next/navigation";

import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { createClient } from "@/utils/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function safeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("email signups are disabled")) {
    return "Email signups are disabled in Supabase. Enable them under Authentication → Providers → Email → Enable Email provider + Allow new users to sign up.";
  }

  if (lower.includes("email not confirmed")) {
    return "Email not confirmed. Check your inbox or disable Confirm email in Supabase Auth settings.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Sign in or reset your password.";
  }

  return message;
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  redirect(safeRedirectPath(formData.get("next")?.toString()));
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (data.session) {
    redirect("/setup");
  }

  // signUp succeeded but no session — email confirmation is enabled in Supabase
  if (data.user && !data.user.email_confirmed_at) {
    return {
      message:
        "Account created. Check your email and confirm your address, then sign in. For development: Supabase Dashboard → Authentication → Providers → Email → disable Confirm email.",
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    if (signInError.message.toLowerCase().includes("email not confirmed")) {
      return {
        message:
          "Email not confirmed. Check your inbox or disable Confirm email in Supabase Auth settings.",
      };
    }

    return { error: mapAuthError(signInError.message) };
  }

  redirect("/setup");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
