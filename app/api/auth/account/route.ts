import { NextResponse } from "next/server";
import { requireUser } from "@/src/lib/supabase/request";

function isGoogleAccount(user: {
  app_metadata?: Record<string, unknown>;
}) {
  const providers = user.app_metadata?.providers;
  return (
    user.app_metadata?.provider === "google" ||
    (Array.isArray(providers) && providers.includes("google"))
  );
}

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  return NextResponse.json({
    name: user.user_metadata.full_name ?? "",
    email: user.email ?? "",
    isGoogleAccount: isGoogleAccount(user),
  });
}

export async function PATCH(request: Request) {
  const { supabase, user, response } = await requireUser();
  if (!user) return response;

  let details: unknown;
  try {
    details = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!details || typeof details !== "object") {
    return NextResponse.json(
      { error: "Enter your name and email." },
      { status: 400 },
    );
  }

  const input = details as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = input.password;
  if (
    !name ||
    name.length > 100 ||
    !email ||
    email.length > 254 ||
    (password !== undefined && typeof password !== "string")
  ) {
    return NextResponse.json(
      { error: "Enter a valid name and email address." },
      { status: 400 },
    );
  }
  if (password && isGoogleAccount(user)) {
    return NextResponse.json(
      { error: "Google accounts manage passwords with Google." },
      { status: 400 },
    );
  }
  if (typeof password === "string" && password.length > 0 && password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const attributes: {
    email?: string;
    password?: string;
    data: { full_name: string };
  } = {
    data: { full_name: name },
  };
  const emailChanged = email !== user.email;
  if (emailChanged) attributes.email = email;
  if (typeof password === "string" && password.length > 0) {
    attributes.password = password;
  }

  const { error } = await supabase.auth.updateUser(attributes);
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    emailConfirmationPending: emailChanged,
  });
}
