import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ArticleAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  bullishBearish: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  marketImpactScore: number;
  relevanceScore: number;
  urgencyScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  shortSummary: string;
  keyFacts: string[];
  entities: {
    companies: string[];
    assets: string[];
    countries: string[];
    people: string[];
  };
  sectorsAffected: string[];
  secondOrderEffects: string;
}

export interface BriefingContent {
  executiveSummary: string;
  topStories: Array<{
    headline: string;
    summary: string;
    impact: string;
    sentiment: string;
    source: string;
  }>;
  marketImpactForecast: string;
  sentimentOverview: {
    overall: string;
    byCategory: Record<string, string>;
  };
  riskSignals: string[];
  bullishDevelopments: string[];
  bearishDevelopments: string[];
  sevenDayOutlook: string;
  watchNext: string[];
}

export async function analyzeArticle(article: {
  title: string;
  summary?: string | null;
  fullText?: string | null;
  sourceName: string;
}): Promise<ArticleAnalysisResult> {
  const content = article.fullText || article.summary || article.title;

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this news article and return a JSON object with the following structure. Be precise and objective.

Article title: ${article.title}
Source: ${article.sourceName}
Content: ${content.slice(0, 3000)}

Return ONLY valid JSON with this exact structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": number between -1.0 and 1.0,
  "bullishBearish": "bullish" | "bearish" | "neutral" | "mixed",
  "marketImpactScore": number between 0 and 1,
  "relevanceScore": number between 0 and 1 (how relevant to finance/markets/business),
  "urgencyScore": number between 0 and 1,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "shortSummary": "2-3 sentence executive summary",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "entities": {
    "companies": ["company names mentioned"],
    "assets": ["stocks, crypto, commodities mentioned"],
    "countries": ["countries mentioned"],
    "people": ["key people mentioned"]
  },
  "sectorsAffected": ["technology", "finance", etc],
  "secondOrderEffects": "Brief analysis of downstream effects"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  return JSON.parse(jsonMatch[0]) as ArticleAnalysisResult;
}

export async function generateBriefing(params: {
  userId: string;
  articles: Array<{
    title: string;
    shortSummary: string;
    sentiment: string;
    marketImpactScore: number;
    sourceName: string;
    publishedAt: string;
    sectorsAffected: string[];
    bullishBearish: string;
  }>;
  preferences?: {
    briefingStyle?: string;
    enabledCategories?: string[];
    businessType?: string;
    industry?: string;
  };
}): Promise<BriefingContent> {
  const { articles, preferences } = params;
  const style = preferences?.briefingStyle ?? 'executive';
  const industry = preferences?.industry ?? 'general';

  const articleList = articles
    .slice(0, 20)
    .map(
      (a, i) =>
        `${i + 1}. [${a.sentiment.toUpperCase()} | Impact: ${(a.marketImpactScore * 10).toFixed(1)}/10] ${a.title}\n   Summary: ${a.shortSummary}\n   Source: ${a.sourceName} | Sectors: ${a.sectorsAffected.join(', ')}`
    )
    .join('\n\n');

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an elite market intelligence analyst. Generate an ${style}-style executive briefing for a professional in ${industry}.

IMPORTANT: This is informational analysis only, not financial advice.

Based on these ${articles.length} articles from the last 24 hours:

${articleList}

Return ONLY valid JSON with this exact structure:
{
  "executiveSummary": "3-4 sentence high-level overview of the most important developments",
  "topStories": [
    {
      "headline": "punchy headline",
      "summary": "2-3 sentence summary",
      "impact": "why this matters to markets/business",
      "sentiment": "bullish | bearish | neutral",
      "source": "source name"
    }
  ],
  "marketImpactForecast": "paragraph on expected near-term market implications",
  "sentimentOverview": {
    "overall": "bullish | bearish | neutral | mixed",
    "byCategory": {
      "markets": "brief sentiment",
      "crypto": "brief sentiment",
      "macro": "brief sentiment",
      "geopolitics": "brief sentiment"
    }
  },
  "riskSignals": ["key risk 1", "key risk 2"],
  "bullishDevelopments": ["positive development 1", "positive development 2"],
  "bearishDevelopments": ["negative development 1", "negative development 2"],
  "sevenDayOutlook": "forward-looking paragraph on what to watch over the next 7 days",
  "watchNext": ["thing to monitor 1", "thing to monitor 2", "thing to monitor 3"]
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  return JSON.parse(jsonMatch[0]) as BriefingContent;
}
