import { NextResponse } from "next/server";
import {
  isNewsletterFrequency,
  isNewsletterModule,
  isValidTimeZone,
} from "@/src/lib/newsletters";
import { requireUser } from "@/src/lib/supabase/request";
import { newsletterDatabaseError } from "@/src/lib/supabase/newsletter-error";

const newsletterFields =
  "id, title, description, thumbnail_url, publish_time, timezone, frequency, layout, template, created_at, updated_at";

type RouteContext = { params: Promise<{ id: string }> };

function isValidUpdate(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const update = value as Record<string, unknown>;
  const entries = Object.entries(update);
  if (entries.length === 0) return false;

  return entries.every(([key, field]) => {
    switch (key) {
      case "title":
        return (
          typeof field === "string" &&
          field.trim().length > 0 &&
          field.length <= 120
        );
      case "description":
        return typeof field === "string" && field.length <= 1000;
      case "publish_time":
        return (
          typeof field === "string" &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(field)
        );
      case "timezone":
        return typeof field === "string" && isValidTimeZone(field);
      case "frequency":
        return isNewsletterFrequency(field);
      case "layout":
        return (
          Array.isArray(field) &&
          field.length <= 50 &&
          field.every(isNewsletterModule)
        );
      case "template":
        return ["editorial", "minimal", "classic"].includes(String(field));
      case "thumbnail_url":
        return (
          field === null ||
          (typeof field === "string" && field.length <= 2048)
        );
      default:
        return false;
    }
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { supabase, user, response } = await requireUser();
  if (!user) return response;
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("newsletters")
    .select(newsletterFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return newsletterDatabaseError("load", error);
  }
  if (!data) {
    return NextResponse.json({ error: "Newsletter not found." }, { status: 404 });
  }
  return NextResponse.json({ newsletter: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { supabase, user, response } = await requireUser();
  if (!user) return response;

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!isValidUpdate(update)) {
    return NextResponse.json(
      { error: "Check the newsletter details and try again." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const { data, error } = await supabase
    .from("newsletters")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(newsletterFields)
    .maybeSingle();

  if (error) {
    return newsletterDatabaseError("update", error);
  }
  if (!data) {
    return NextResponse.json({ error: "Newsletter not found." }, { status: 404 });
  }
  return NextResponse.json({ newsletter: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { supabase, user, response } = await requireUser();
  if (!user) return response;
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("newsletters")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return newsletterDatabaseError("delete", error);
  }
  if (!data) {
    return NextResponse.json({ error: "Newsletter not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
