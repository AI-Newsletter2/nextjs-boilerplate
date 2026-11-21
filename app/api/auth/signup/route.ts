import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  let details: unknown;
  try {
    details = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!details || typeof details !== "object") {
    return NextResponse.json(
      { error: "Enter your name, email, and password." },
      { status: 400 },
    );
  }

  const input = details as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = input.password;
  if (!name || name.length > 100 || !email || typeof password !== "string") {
    return NextResponse.json(
      { error: "Enter your name, email, and password." },
      { status: 400 },
    );
  }

  let data;
  let error;
  try {
    const supabase = await createSupabaseServerClient({ writeCookies: true });
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    data = result.data;
    error = result.error;
  } catch (signUpError) {
    console.error("Account signup request failed:", signUpError);
    return NextResponse.json(
      {
        error:
          "The server cannot reach Supabase. Verify SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are configured for this deployment.",
      },
      { status: 503 },
    );
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: Boolean(data.session),
    needsEmailConfirmation: !data.session,
  });
}
