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

// Robustly extract a JSON object or array from a model response that may include
// markdown code fences, thinking tokens, or surrounding prose
function extractJSON(text: string): string {
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  // Use whichever comes first: array [...] or object {...}
  const arrayIdx = text.indexOf('[');
  const objIdx = text.indexOf('{');
  if (arrayIdx !== -1 && (objIdx === -1 || arrayIdx < objIdx)) {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  throw new Error('No JSON in AI response');
}

// Returns true for Anthropic billing / quota errors that warrant an OpenAI fallback
function isCreditsError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? '';
  return (
    msg.includes('credit balance') ||
    msg.includes('insufficient_quota') ||
    msg.includes('billing') ||
    msg.includes('rate_limit') ||
    msg.includes('overloaded')
  );
}

// OpenAI fallback via raw fetch — no extra package needed
async function callOpenAI(prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `OpenAI HTTP ${res.status}`);
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '';
}

// Gemini fallback via raw fetch — tries GEMINI_API_KEY then GEMINI_API_KEY_2
async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean) as string[];
  if (keys.length === 0) throw new Error('No GEMINI_API_KEY set');

  let lastErr: Error = new Error('Gemini: no keys available');
  for (const key of keys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } }).error?.message ?? `Gemini HTTP ${res.status}`
        );
      }
      const data = await res.json() as {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      };
      return data.candidates[0]?.content?.parts[0]?.text ?? '';
    } catch (err) {
      console.warn(`[ai] Gemini key failed: ${(err as Error).message}`);
      lastErr = err as Error;
    }
  }
  throw lastErr;
}

export async function analyzeArticle(article: {
  title: string;
  summary?: string | null;
  fullText?: string | null;
  sourceName: string;
}): Promise<ArticleAnalysisResult> {
  const content = article.fullText || article.summary || article.title;

  const prompt = `Analyze this news article and return a JSON object with the following structure. Be precise and objective.

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
}`;

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      console.warn('[ai] Claude unavailable — trying OpenAI for article analysis');
      try {
        text = await callOpenAI(prompt, 1024);
      } catch (openaiErr) {
        console.warn('[ai] OpenAI unavailable — trying Gemini for article analysis');
        text = await callGemini(prompt, 1024);
      }
    } else {
      throw err;
    }
  }

  return JSON.parse(extractJSON(text)) as ArticleAnalysisResult;
}

export interface PredictionSignals {
  sentiment: number;       // 0–1 from recent article sentiment
  velocity: number;        // 0–1 from trending topic velocity
  sourceQuality: number;   // 0–1 weighted by source trustScore
  calendarContext: number; // 0–1 from upcoming economic events relevance
}

export interface PredictionSubQuestion {
  question: string;
  answer: string;
  confidence: number; // 0–1
}

export interface PredictionResult {
  target: string;
  targetType: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  baseRate: number;
  contrarianFlag: boolean;
  reasoning: string;
  bullCase: string;
  bearCase: string;
  signals: PredictionSignals;
  subQuestions: PredictionSubQuestion[];
  timeframe: string;
}

export async function generatePredictions(params: {
  watchlistItems: Array<{ type: string; value: string; label: string }>;
  articles: Array<{
    title: string;
    shortSummary: string;
    sentiment: string;
    sentimentScore: number;
    bullishBearish: string;
    marketImpactScore: number;
    sourceName: string;
    sourceReliabilityScore: number;
    publishedAt: string;
    sectorsAffected: string[];
  }>;
  userProfile?: { businessType?: string | null; industry?: string | null };
  accuracyContext?: string;
  overallSentimentScore?: number;
}): Promise<PredictionResult[]> {
  const { watchlistItems, articles, userProfile, accuracyContext, overallSentimentScore } = params;

  const profileDesc = userProfile?.businessType || userProfile?.industry
    ? `User profile: ${[userProfile.businessType, userProfile.industry].filter(Boolean).join(', ')}.`
    : 'User profile: general market watcher.';

  const watchlistDesc = watchlistItems.length > 0
    ? watchlistItems.map(w => `${w.type}: ${w.label}`).join(', ')
    : 'No watchlist items set — use top market topics from articles.';

  const recentArticles = articles.slice(0, 15).map((a, i) =>
    `${i + 1}. [${a.bullishBearish.toUpperCase()} | Score:${(a.marketImpactScore * 10).toFixed(1)}] ${a.title} (${a.sourceName})`
  ).join('\n');

  const contrarianNote = overallSentimentScore !== undefined && Math.abs(overallSentimentScore) > 0.8
    ? `CONTRARIAN ALERT: Overall market sentiment is at an extreme (${overallSentimentScore.toFixed(2)}). Flag contrarianFlag:true on all calls in the dominant direction and reduce confidence by 15%.`
    : '';

  const prompt = `You are an elite market intelligence analyst. Generate 4-6 structured predictions personalised to this user.

${profileDesc}
Watchlist: ${watchlistDesc}

RECENT NEWS (last 24h):
${recentArticles}

${accuracyContext || ''}
${contrarianNote}

For each prediction, score 4 ensemble signals independently (0.0-1.0):
- sentiment: strength of bullish/bearish signal in recent articles for this target
- velocity: how fast mentions/discussion is accelerating for this target
- sourceQuality: average trustworthiness of sources covering this target (0=low, 1=high)
- calendarContext: relevance of upcoming economic events to this target

Then decompose each call into exactly 3 sub-questions. Answer each with Yes/No/Unclear and a confidence score.
Synthesise the sub-answers into a final direction.

Always write BOTH a bull case AND bear case, even when direction is BULLISH or BEARISH.

Return ONLY a JSON array:
[
  {
    "target": "BTC",
    "targetType": "ASSET",
    "direction": "BULLISH",
    "confidence": 0.72,
    "baseRate": 0.58,
    "contrarianFlag": false,
    "reasoning": "2-3 sentences explaining the call",
    "bullCase": "2-3 sentences on the bullish scenario",
    "bearCase": "2-3 sentences on the bearish scenario",
    "signals": { "sentiment": 0.75, "velocity": 0.60, "sourceQuality": 0.80, "calendarContext": 0.45 },
    "subQuestions": [
      { "question": "Is macro environment supportive?", "answer": "Yes", "confidence": 0.80 },
      { "question": "Is momentum accelerating?", "answer": "Yes", "confidence": 0.65 },
      { "question": "Are there near-term catalysts?", "answer": "Unclear", "confidence": 0.50 }
    ],
    "timeframe": "7d"
  }
]`;

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 3000); }
      catch { text = await callGemini(prompt, 3000); }
    } else { throw err; }
  }

  const raw = JSON.parse(extractJSON(text));
  return Array.isArray(raw) ? raw as PredictionResult[] : [raw] as PredictionResult[];
}

export async function generateFeedbackQuestion(params: {
  target: string;
  targetType: string;
  direction: string;
  reasoning: string;
  outcome: string;
  actualDirection?: string | null;
}): Promise<string> {
  const { target, targetType, direction, reasoning, outcome, actualDirection } = params;

  const prompt = `You are a market intelligence analyst reviewing a prediction that turned out ${outcome}.

Prediction: ${target} (${targetType}) would be ${direction}.
Reasoning given: ${reasoning}
Actual outcome: ${actualDirection ?? 'unclear'}

Write ONE concise, specific question to ask the user that would help you understand what you missed or got right.
The question should reference the specific prediction and invite the user to share insight they have that doesn't appear in news articles.
Keep it under 2 sentences. Return only the question, no preamble.`;

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 200); }
      catch { text = await callGemini(prompt, 200); }
    } else { throw err; }
  }

  return text.trim();
}

export async function extractFeedbackInsight(params: {
  question: string;
  answer: string;
  target: string;
  targetType: string;
}): Promise<string> {
  const { question, answer, target, targetType } = params;

  const prompt = `A user answered a follow-up question about a market prediction for ${target} (${targetType}).

Question: ${question}
Answer: ${answer}

Extract a single actionable insight (1-2 sentences) that should be remembered to improve future predictions for this user.
Format: "User [observation] — [how to apply this in future predictions]."
Return only the insight, no preamble.`;

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 150); }
      catch { text = await callGemini(prompt, 150); }
    } else { throw err; }
  }

  return text.trim();
}

// ─── Marketing Agent Runner ───────────────────────────────────────────────────

export interface MarketingAgentResult {
  content: string;
  aiProvider: string;
}

export async function runMarketingAgent(params: {
  agentId: string;
  agentSystemPrompt: string;
  brief: string;
  userContext?: { businessType?: string | null; industry?: string | null };
}): Promise<MarketingAgentResult> {
  const { agentSystemPrompt, brief, userContext } = params;

  const contextBlock = userContext?.businessType || userContext?.industry
    ? `\nUSER CONTEXT\nBusiness type: ${userContext.businessType ?? 'not specified'}\nIndustry: ${userContext.industry ?? 'not specified'}\n`
    : '';

  const userMessage = `${contextBlock}\nBRIEF FROM USER:\n${brief}`;

  let text: string;
  let aiProvider = 'claude';

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: agentSystemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try {
        aiProvider = 'openai';
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o',
            max_tokens: 2048,
            messages: [
              { role: 'system', content: agentSystemPrompt },
              { role: 'user', content: userMessage },
            ],
          }),
        });
        const openAiData = await openAiRes.json() as { choices: Array<{ message: { content: string } }> };
        text = openAiData.choices[0]?.message?.content ?? '';
      } catch {
        aiProvider = 'gemini';
        const combinedPrompt = `${agentSystemPrompt}\n\n---\n\n${userMessage}`;
        text = await callGemini(combinedPrompt, 2048);
      }
    } else {
      throw err;
    }
  }

  return { content: text.trim(), aiProvider };
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

  const prompt = `You are an elite market intelligence analyst. Generate an ${style}-style executive briefing for a professional in ${industry}.

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
}`;

  let text: string;
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      console.warn('[ai] Claude unavailable — trying OpenAI for briefing generation');
      try {
        text = await callOpenAI(prompt, 2048);
      } catch (openaiErr) {
        console.warn('[ai] OpenAI unavailable — trying Gemini for briefing generation');
        text = await callGemini(prompt, 2048);
      }
    } else {
      throw err;
    }
  }

  return JSON.parse(extractJSON(text)) as BriefingContent;
}
