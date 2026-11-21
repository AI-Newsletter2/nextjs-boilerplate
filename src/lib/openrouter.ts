import OpenAI from 'openai';

export type NewsletterTopic = {
  id: string;
  title: string;
  description: string;
};

export type NewsletterArticle = {
  topicId: string;
  title: string;
  summary: string;
  sourceUrl: string;
};

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export async function generateSummary(
  newsContent: string,
  userPreferences: string[],
  timeScope: number
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: 'openai/gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an assistant that summarizes news articles from the past ${timeScope} days exclusively. Focus on these topics: ${userPreferences.join(', ')}`,
      },
      {
        role: 'user',
        content: `Pleasee summarize the following news:\n\n${newsContent}`,
      },
    ],
  });

  return response.choices[0]?.message?.content || 'No summary generated';
}

export async function generateNewsletterArticles(
  newsletterTitle: string,
  newsletterDescription: string,
  topics: NewsletterTopic[],
): Promise<NewsletterArticle[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }
  if (topics.length === 0) {
    throw new Error('This newsletter has no topics to search.');
  }

  const response = await openrouter.chat.completions.create({
    model: 'openai/gpt-4o-mini:online',
    messages: [
      {
        role: 'system',
        content:
          'Research current news on the web. Return valid JSON only, shaped as {"articles":[{"topicId":"...","title":"...","summary":"...","sourceUrl":"https://..."}]}. Return exactly one article per supplied topic, use only facts and source URLs from the web search results, write an original concise summary, and never invent a source or URL.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          newsletterTitle,
          newsletterDescription,
          topics,
          instruction: 'Find recent, useful news for each topic.',
        }),
      },
    ],
  });

  const message = response.choices[0]?.message;
  const content = message?.content;
  if (!content) throw new Error('OpenRouter returned no newsletter content.');
  const citationUrls = new Set(
    message.annotations
      ?.filter((annotation) => annotation.type === "url_citation")
      .map((annotation) => new URL(annotation.url_citation.url).toString()) ?? [],
  );
  if (citationUrls.size === 0) {
    throw new Error("OpenRouter returned no web-search citations.");
  }

  const jsonContent = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    throw new Error('OpenRouter returned invalid newsletter JSON.');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { articles?: unknown }).articles)
  ) {
    throw new Error('OpenRouter returned an invalid article list.');
  }

  const articles = (parsed as { articles: unknown[] }).articles;
  const result = articles.flatMap((item): NewsletterArticle[] => {
    if (!item || typeof item !== 'object') return [];
    const article = item as Record<string, unknown>;
    if (
      typeof article.topicId !== 'string' ||
      typeof article.title !== 'string' ||
      typeof article.summary !== 'string' ||
      typeof article.sourceUrl !== 'string'
    ) {
      return [];
    }

    let sourceUrl: URL;
    try {
      sourceUrl = new URL(article.sourceUrl);
    } catch {
      return [];
    }
    if (
      sourceUrl.protocol !== "https:" ||
      !citationUrls.has(sourceUrl.toString()) ||
      !topics.some((topic) => topic.id === article.topicId)
    ) {
      return [];
    }

    return [{
      topicId: article.topicId,
      title: article.title.slice(0, 200),
      summary: article.summary.slice(0, 1600),
      sourceUrl: sourceUrl.toString(),
    }];
  });

  if (
    result.length !== topics.length ||
    new Set(result.map((article) => article.topicId)).size !== topics.length
  ) {
    throw new Error('OpenRouter did not return one valid sourced article per topic.');
  }
  return result;
}

export default openrouter;