export const newsletterFrequencies = [
  "daily",
  "every_other_day",
  "weekly",
  "monthly",
] as const;

export type NewsletterFrequency = (typeof newsletterFrequencies)[number];

export type NewsletterModule = {
  id: string;
  type: "topic" | "title" | "text";
  title: string;
  description: string;
  content: string;
};

export type NewsletterInput = {
  title: string;
  description: string;
  publish_time: string;
  timezone: string;
  frequency: NewsletterFrequency;
  layout: NewsletterModule[];
  template: "editorial" | "minimal" | "classic";
  thumbnail_url: string | null;
};

export function isNewsletterFrequency(
  value: unknown,
): value is NewsletterFrequency {
  return (
    newsletterFrequencies.some((frequency) => frequency === value)
  );
}

export function isNewsletterModule(value: unknown): value is NewsletterModule {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  return (
    typeof block.id === "string" &&
    block.id.length <= 80 &&
    ["topic", "title", "text"].includes(String(block.type)) &&
    typeof block.title === "string" &&
    block.title.length <= 100 &&
    typeof block.description === "string" &&
    block.description.length <= 280 &&
    typeof block.content === "string" &&
    block.content.length <= 600
  );
}

export function validateNewsletterInput(
  value: unknown,
): value is NewsletterInput {
  if (!value || typeof value !== "object") return false;
  const newsletter = value as Record<string, unknown>;
  return (
    typeof newsletter.title === "string" &&
    newsletter.title.trim().length > 0 &&
    newsletter.title.length <= 120 &&
    typeof newsletter.description === "string" &&
    newsletter.description.length <= 1000 &&
    typeof newsletter.publish_time === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(newsletter.publish_time) &&
    typeof newsletter.timezone === "string" &&
    isValidTimeZone(newsletter.timezone) &&
    isNewsletterFrequency(newsletter.frequency) &&
    ["editorial", "minimal", "classic"].includes(String(newsletter.template)) &&
    Array.isArray(newsletter.layout) &&
    newsletter.layout.length <= 50 &&
    newsletter.layout.every(isNewsletterModule) &&
    (newsletter.thumbnail_url === null ||
      (typeof newsletter.thumbnail_url === "string" &&
        newsletter.thumbnail_url.length <= 2048))
  );
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
