import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  generateNewsletterArticles,
  type NewsletterTopic,
} from "@/src/lib/openrouter";
import {
  buildNewsletterEmail,
  sendNewsletterEmail,
} from "@/src/lib/newsletter-email";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { isNewsletterModule } from "@/src/lib/newsletters";

export const runtime = "nodejs";
export const maxDuration = 300;

const claimLeaseMilliseconds = 15 * 60 * 1000;
const newslettersPerRun = 5;

type NewsletterModule = {
  id: string;
  type: "topic" | "title" | "text";
  title: string;
  description: string;
  content: string;
};

type NewsletterRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  publish_time: string;
  timezone: string;
  frequency: "daily" | "every_other_day" | "weekly" | "monthly";
  layout: unknown;
  created_at: string;
  last_sent_at: string | null;
  delivery_claimed_at: string | null;
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret) throw new Error("NEWSLETTER_CRON_SECRET is not configured.");

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const expectedBuffer = Buffer.from(secret);
  const receivedBuffer = Buffer.from(token);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function dayDifference(firstDate: string, secondDate: string): number {
  const first = Date.parse(`${firstDate}T00:00:00Z`);
  const second = Date.parse(`${secondDate}T00:00:00Z`);
  return Math.floor((second - first) / 86_400_000);
}

function isDue(newsletter: NewsletterRow, now: Date): boolean {
  if (
    newsletter.delivery_claimed_at &&
    Date.parse(newsletter.delivery_claimed_at) >
      now.getTime() - claimLeaseMilliseconds
  ) {
    return false;
  }

  let current;
  let created;
  let lastSent;
  try {
    current = localParts(now, newsletter.timezone);
    created = localParts(new Date(newsletter.created_at), newsletter.timezone);
    lastSent = newsletter.last_sent_at
      ? localParts(new Date(newsletter.last_sent_at), newsletter.timezone)
      : null;
  } catch {
    throw new Error(`Newsletter ${newsletter.id} has an invalid time zone.`);
  }

  if (lastSent?.date === current.date) return false;
  const [sendHour, sendMinute] = newsletter.publish_time.split(":").map(Number);
  if (
    current.hour * 60 + current.minute <
    sendHour * 60 + sendMinute
  ) {
    return false;
  }

  const elapsedDays = dayDifference(created.date, current.date);
  if (elapsedDays < 0) return false;
  switch (newsletter.frequency) {
    case "daily":
      return true;
    case "every_other_day":
      return elapsedDays % 2 === 0;
    case "weekly":
      return elapsedDays % 7 === 0;
    case "monthly": {
      const [year, month] = current.date.split("-").map(Number);
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const anchorDay = Number(created.date.slice(-2));
      return Number(current.date.slice(-2)) === Math.min(anchorDay, daysInMonth);
    }
  }
}

function getTopics(layout: NewsletterModule[], newsletter: NewsletterRow): NewsletterTopic[] {
  const topics = layout
    .filter((block) => block.type === "topic" && block.title.trim())
    .map((block) => ({
      id: block.id,
      title: block.title.trim(),
      description: block.description.trim(),
    }));

  return topics.length
    ? topics
    : [{
        id: newsletter.id,
        title: newsletter.title,
        description: newsletter.description,
      }];
}

async function loadNewsletters(): Promise<NewsletterRow[]> {
  const supabase = createSupabaseAdminClient();
  const rows: NewsletterRow[] = [];
  const batchSize = 500;

  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await supabase
      .from("newsletters")
      .select(
        "id, user_id, title, description, publish_time, timezone, frequency, layout, created_at, last_sent_at, delivery_claimed_at",
      )
      .range(offset, offset + batchSize - 1);
    if (error) throw new Error(`Unable to load scheduled newsletters: ${error.message}`);
    rows.push(...(data as NewsletterRow[]));
    if (data.length < batchSize) return rows;
  }
}

async function claimNewsletter(
  newsletter: NewsletterRow,
  now: Date,
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const staleClaimBefore = new Date(
    now.getTime() - claimLeaseMilliseconds,
  ).toISOString();
  const claimedAt = now.toISOString();

  const { data, error } = await supabase
    .from("newsletters")
    .update({ delivery_claimed_at: claimedAt })
    .eq("id", newsletter.id)
    .or(`delivery_claimed_at.is.null,delivery_claimed_at.lt.${staleClaimBefore}`)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Unable to claim newsletter ${newsletter.id}: ${error.message}`);
  return Boolean(data);
}

async function releaseClaim(
  newsletterId: string,
  claimedAt: string,
  lastSentAt?: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("newsletters")
    .update({
      delivery_claimed_at: null,
      ...(lastSentAt ? { last_sent_at: lastSentAt } : {}),
    })
    .eq("id", newsletterId)
    .eq("delivery_claimed_at", claimedAt);

  if (error) {
    throw new Error(`Unable to finalize newsletter ${newsletterId}: ${error.message}`);
  }
}

async function deliver(newsletter: NewsletterRow, now: Date): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const claimedAt = now.toISOString();
  const validModules = Array.isArray(newsletter.layout)
    ? newsletter.layout.filter(isNewsletterModule)
    : [];
  const layout = validModules as NewsletterModule[];
  const topics = getTopics(layout, newsletter);
  const articles = await generateNewsletterArticles(
    newsletter.title,
    newsletter.description,
    topics,
  );
  const email = await buildNewsletterEmail({
    title: newsletter.title,
    description: newsletter.description,
    layout,
    topics,
    articles,
  });

  const { data: userResult, error: userError } =
    await supabase.auth.admin.getUserById(newsletter.user_id);
  if (userError) {
    throw new Error(`Unable to load newsletter recipient: ${userError.message}`);
  }
  const receiverEmail = userResult.user?.email;
  if (!receiverEmail) throw new Error("Newsletter recipient has no email address.");

  await sendNewsletterEmail({
    subject: newsletter.title,
    receiverEmail,
    html: email.html,
    text: email.text,
  });
  await releaseClaim(newsletter.id, claimedAt, now.toISOString());
}

export async function POST(request: Request) {
  let authorized: boolean;
  try {
    authorized = isAuthorized(request);
  } catch (error) {
    console.error("Newsletter cron configuration error:", error);
    return NextResponse.json(
      { error: "Newsletter cron is not configured." },
      { status: 503 },
    );
  }
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  let delivered = 0;
  const failures: string[] = [];
  try {
    const newsletters = await loadNewsletters();
    const due = newsletters
      .filter((newsletter) => isDue(newsletter, now))
      .slice(0, newslettersPerRun);

    for (const newsletter of due) {
      const claimed = await claimNewsletter(newsletter, now);
      if (!claimed) continue;

      try {
        await deliver(newsletter, now);
        delivered += 1;
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown delivery error.";
        console.error(`Newsletter ${newsletter.id} delivery failed:`, detail);
        failures.push(newsletter.id);
        await releaseClaim(newsletter.id, now.toISOString()).catch((releaseError) => {
          console.error(`Unable to release newsletter ${newsletter.id}:`, releaseError);
        });
      }
    }
  } catch (error) {
    console.error("Newsletter cron run failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Newsletter delivery failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    delivered,
    failed: failures,
    message: failures.length
      ? "Some newsletters failed; they will be retried on the next cron run."
      : "Newsletter delivery run completed.",
  }, { status: failures.length ? 500 : 200 });
}
