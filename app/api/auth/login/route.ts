import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!credentials || typeof credentials !== "object") {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  const input = credentials as Record<string, unknown>;
  const identifier =
    typeof input.email === "string"
      ? input.email.trim()
      : typeof input.identifier === "string"
        ? input.identifier.trim()
        : "";
  const password = input.password;
  const email =
    identifier.includes("@")
      ? identifier
      : identifier === process.env.BRIEFLY_ADMIN_USERNAME
        ? process.env.BRIEFLY_ADMIN_EMAIL
        : undefined;

  if (!email || typeof password !== "string" || password.length === 0) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient({ writeCookies: true });
    const result = await supabase.auth.signInWithPassword({ email, password });
    const { error } = result;
    if (error) {
      const needsConfirmation = error.code === "email_not_confirmed";
      return NextResponse.json(
        {
          error: needsConfirmation
            ? "Confirm your email address before signing in."
            : "The email or password is incorrect.",
        },
        { status: needsConfirmation ? 403 : 401 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (loginError) {
    console.error("Account login request failed:", loginError);
    return NextResponse.json(
      {
        error:
          "The server cannot reach Supabase. Verify SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are configured for this deployment.",
      },
      { status: 503 },
    );
  }
}
