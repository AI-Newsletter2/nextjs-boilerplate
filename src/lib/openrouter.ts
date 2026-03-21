import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generateSummary(
  newsContent: string,
  userPreferences: string[]
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: 'openai/gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that summarizes news articles. Focus on these topics: ${userPreferences.join(', ')}`,
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