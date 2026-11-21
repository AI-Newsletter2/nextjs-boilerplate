import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient({ writeCookies: true });
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      { error: "Unable to sign out. Please try again." },
      { status: 503 },
    );
  }
  return NextResponse.json({ success: true });
}
