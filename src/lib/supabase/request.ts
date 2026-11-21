import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient({ writeCookies: true });
  const { data, error } = await supabase.auth.getUser();
  if (
    error &&
    !["AuthSessionMissingError", "AuthApiError"].includes(error.name)
  ) {
    throw new Error(`Unable to verify your session: ${error.message}`);
  }

  if (!data.user) {
    return {
      supabase,
      user: null,
      response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }),
    };
  }

  return { supabase, user: data.user, response: null };
}
