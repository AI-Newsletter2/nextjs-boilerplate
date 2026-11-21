import { NextResponse } from "next/server";

type SupabaseErrorSummary = {
  code?: string;
};

export function newsletterDatabaseError(
  action: string,
  error: SupabaseErrorSummary,
) {
  console.error(`Supabase newsletter ${action} failed`, {
    code: error.code ?? "unknown",
  });

  let message = `Unable to ${action} your newsletter.`;
  if (["42P01", "PGRST205"].includes(error.code ?? "")) {
    message =
      "The newsletters table is missing. Run the Supabase migration in supabase/migrations/202611210001_newsletters.sql.";
  } else if (["42703", "PGRST204"].includes(error.code ?? "")) {
    message =
      "The newsletter schema is out of date. Apply migrations 202611210001_newsletters.sql and 202611210002_newsletter_delivery.sql in order, then reload this page. If both are already applied, refresh the Supabase API schema cache.";
  } else if (error.code === "42501") {
    message =
      "Supabase denied this operation. Check that the newsletter row-level security policies are installed and your session is valid.";
  }

  return NextResponse.json({ error: message }, { status: 503 });
}
