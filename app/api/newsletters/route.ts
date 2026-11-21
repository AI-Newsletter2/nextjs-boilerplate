import { NextResponse } from "next/server";
import { requireUser } from "@/src/lib/supabase/request";
import { validateNewsletterInput } from "@/src/lib/newsletters";
import { newsletterDatabaseError } from "@/src/lib/supabase/newsletter-error";

const newsletterFields =
  "id, title, description, thumbnail_url, publish_time, timezone, frequency, layout, template, created_at, updated_at";

export async function GET() {
  const { supabase, user, response } = await requireUser();
  if (!user) return response;

  const { data, error } = await supabase
    .from("newsletters")
    .select(newsletterFields)
    .order("created_at", { ascending: false });

  if (error) {
    return newsletterDatabaseError("load", error);
  }
  return NextResponse.json({ newsletters: data });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await requireUser();
  if (!user) return response;

  let newsletter: unknown;
  try {
    newsletter = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!validateNewsletterInput(newsletter)) {
    return NextResponse.json(
      { error: "Check the newsletter details and try again." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("newsletters")
    .insert({
      ...newsletter,
      title: newsletter.title.trim(),
      user_id: user.id,
    })
    .select(newsletterFields)
    .single();

  if (error) {
    return newsletterDatabaseError("publish", error);
  }
  return NextResponse.json({ newsletter: data }, { status: 201 });
}
