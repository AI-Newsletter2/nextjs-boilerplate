import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/src/lib/supabase/request";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const { supabase, user, response } = await requireUser();
  if (!user) return response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Choose an image to upload." },
      { status: 400 },
    );
  }
  if (!allowedTypes[file.type] || file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Use a PNG, JPEG, or WebP image up to 5 MB." },
      { status: 400 },
    );
  }

  const path = `${user.id}/${randomUUID()}.${allowedTypes[file.type]}`;
  const { error } = await supabase.storage
    .from("newsletter-thumbnails")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json(
      { error: "Unable to upload the thumbnail." },
      { status: 503 },
    );
  }

  const { data } = supabase.storage
    .from("newsletter-thumbnails")
    .getPublicUrl(path);
  return NextResponse.json({ thumbnail_url: data.publicUrl });
}
