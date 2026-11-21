import { spawn } from "node:child_process";
import { join } from "node:path";
import type {
  NewsletterArticle,
  NewsletterTopic,
} from "./openrouter";

type NewsletterModule = {
  id: string;
  type: "topic" | "title" | "text";
  title: string;
  description: string;
  content: string;
};

type NewsletterImage = {
  url: string;
  title: string;
  creator: string;
  license: string;
  licenseUrl: string;
};

type OpenverseResult = {
  url?: unknown;
  title?: unknown;
  creator?: unknown;
  license?: unknown;
  license_url?: unknown;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

async function findImage(query: string): Promise<NewsletterImage> {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "1");

  const response = await fetch(url, {
    headers: { "User-Agent": "Briefly newsletter image search" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Openverse image search failed with status ${response.status}.`);
  }

  const result = (await response.json()) as { results?: OpenverseResult[] };
  const image = result.results?.[0];
  if (
    !image ||
    typeof image.url !== "string" ||
    typeof image.license_url !== "string"
  ) {
    throw new Error(`No licensed image was found for "${query}".`);
  }

  let imageUrl: URL;
  let licenseUrl: URL;
  try {
    imageUrl = new URL(image.url);
    licenseUrl = new URL(image.license_url);
  } catch {
    throw new Error(`Openverse returned an invalid image for "${query}".`);
  }
  if (imageUrl.protocol !== "https:" || licenseUrl.protocol !== "https:") {
    throw new Error(`Openverse returned an insecure image for "${query}".`);
  }

  return {
    url: imageUrl.toString(),
    title: typeof image.title === "string" ? image.title : "Untitled",
    creator: typeof image.creator === "string" ? image.creator : "Unknown creator",
    license: typeof image.license === "string" ? image.license : "Creative Commons",
    licenseUrl: licenseUrl.toString(),
  };
}

function renderArticle(
  article: NewsletterArticle,
  topic: NewsletterTopic,
  image: NewsletterImage,
): string {
  return `
    <article style="margin:32px 0;padding-bottom:28px;border-bottom:1px solid #e5e7eb">
      <p style="margin:0 0 8px;color:#1b2a44;font-size:13px;font-weight:700;text-transform:uppercase">${escapeHtml(topic.title)}</p>
      <h2 style="margin:0 0 14px;color:#000;font-size:23px;line-height:1.3">${escapeHtml(article.title)}</h2>
      <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.title)}" width="640" style="display:block;width:100%;max-width:640px;height:auto;border-radius:8px" />
      <p style="margin:14px 0;color:#252a32;font-size:16px;line-height:1.65">${escapeHtml(article.summary)}</p>
      <p style="margin:0;font-size:13px">
        <a href="${escapeHtml(article.sourceUrl)}" style="color:#1b2a44;font-weight:700">Read the source</a>
        <span style="color:#667085"> · Image: ${escapeHtml(image.title)} by ${escapeHtml(image.creator)} (${escapeHtml(image.license)})</span>
        <a href="${escapeHtml(image.licenseUrl)}" style="color:#667085">License</a>
      </p>
    </article>`;
}

export async function buildNewsletterEmail(input: {
  title: string;
  description: string;
  layout: NewsletterModule[];
  topics: NewsletterTopic[];
  articles: NewsletterArticle[];
}): Promise<{ html: string; text: string }> {
  const articleByTopic = new Map(
    input.articles.map((article) => [article.topicId, article]),
  );
  const topicById = new Map(input.topics.map((topic) => [topic.id, topic]));
  const images = new Map<string, NewsletterImage>();

  for (const article of input.articles) {
    const topic = topicById.get(article.topicId);
    if (!topic) throw new Error("Generated story references an unknown topic.");
    images.set(
      article.topicId,
      await findImage(`${topic.title} ${article.title}`),
    );
  }

  const renderedTopics = new Set<string>();
  const sections = input.layout.map((block) => {
    if (block.type === "title" && block.content.trim()) {
      return `<h2 style="margin:28px 0 10px;color:#000;font-size:24px">${escapeHtml(block.content)}</h2>`;
    }
    if (block.type === "text" && block.content.trim()) {
      return `<p style="margin:14px 0;color:#252a32;font-size:16px;line-height:1.65">${escapeHtml(block.content)}</p>`;
    }
    if (block.type === "topic") {
      const article = articleByTopic.get(block.id);
      const topic = topicById.get(block.id);
      const image = images.get(block.id);
      if (article && topic && image) {
        renderedTopics.add(block.id);
        return renderArticle(article, topic, image);
      }
    }
    return "";
  }).join("");
  const additionalArticles = input.articles
    .filter((article) => !renderedTopics.has(article.topicId))
    .map((article) => {
      const topic = topicById.get(article.topicId);
      const image = images.get(article.topicId);
      return topic && image ? renderArticle(article, topic, image) : "";
    })
    .join("");

  const html = `<!doctype html>
    <html lang="en">
      <body style="margin:0;padding:24px;background:#fff;color:#000;font-family:Arial,sans-serif">
        <main style="max-width:680px;margin:0 auto">
          <p style="margin:0 0 12px;color:#1b2a44;font-size:14px;font-weight:700;letter-spacing:1px">BRIEFLY</p>
          <h1 style="margin:0;color:#000;font-size:32px;line-height:1.2">${escapeHtml(input.title)}</h1>
          ${input.description ? `<p style="color:#667085;font-size:16px;line-height:1.6">${escapeHtml(input.description)}</p>` : ""}
          ${sections}${additionalArticles}
          <footer style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#667085;font-size:13px">
            Briefly newsletter · <a href="https://brieflynews.ai" style="color:#1b2a44">Briefly</a>
          </footer>
        </main>
      </body>
    </html>`;

  const text = [
    input.title,
    input.description,
    ...input.articles.flatMap((article) => [
      article.title,
      article.summary,
      `Source: ${article.sourceUrl}`,
    ]),
  ].filter(Boolean).join("\n\n");

  return { html, text };
}

export async function sendNewsletterEmail(input: {
  subject: string;
  receiverEmail: string;
  html: string;
  text: string;
}): Promise<void> {
  const scriptPath =
    process.env.EMAIL_SENDER_SCRIPT_PATH ||
    join(process.cwd(), "src", "lib", "send_email.py");
  const child = spawn("python3", [scriptPath], {
    env: process.env,
    stdio: ["pipe", "ignore", "pipe"],
  });

  let errorOutput = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    errorOutput = `${errorOutput}${chunk}`.slice(-4000);
  });

  const completion = new Promise<void>((resolve, reject) => {
    child.once("error", (error) => reject(new Error(`Unable to start email sender: ${error.message}`)));
    child.once("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(errorOutput.trim() || `Email sender exited with code ${code}.`));
    });
    child.stdin.once("error", (error) => {
      reject(new Error(`Unable to send email content to the sender: ${error.message}`));
    });
  });

  child.stdin.end(JSON.stringify({
    subject: input.subject,
    receiver_email: input.receiverEmail,
    html_body: input.html,
    text_body: input.text,
  }));
  await completion;
}
