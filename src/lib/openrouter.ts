import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
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

export default openrouter;