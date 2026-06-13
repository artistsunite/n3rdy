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
  agentProfile?: Array<{ question: string; answer: string }>;
}): Promise<MarketingAgentResult> {
  const { agentSystemPrompt, brief, userContext, agentProfile } = params;

  const contextBlock = userContext?.businessType || userContext?.industry
    ? `\nUSER CONTEXT\nBusiness type: ${userContext.businessType ?? 'not specified'}\nIndustry: ${userContext.industry ?? 'not specified'}\n`
    : '';

  const profileBlock = agentProfile && agentProfile.length > 0
    ? `\n=== User Business Profile ===\n${agentProfile.map(a => `Q: ${a.question}\n→ ${a.answer}`).join('\n')}\n`
    : '';

  const userMessage = `${contextBlock}${profileBlock}\n=== User's Brief ===\n${brief}`;

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

export interface TrendingPostResult {
  post: string;
  hashtags: string[];
  tip: string;
}

export async function generateTrendingPost(params: {
  topic: string;
  topicSentiment?: string;
  businessType?: string | null;
  industry?: string | null;
}): Promise<TrendingPostResult> {
  const { topic, topicSentiment, businessType, industry } = params;
  const prompt = `You are a social media copywriter for small businesses. Write ONE engaging social post about "${topic}" (sentiment: ${topicSentiment ?? 'neutral'}) for a ${businessType ?? 'small business'} in the ${industry ?? 'general'} industry.
Include 3-5 relevant hashtags. Keep the post under 280 characters.
Return ONLY valid JSON in this exact format: {"post":"...","hashtags":["#tag1","#tag2","#tag3"],"tip":"one short tip on when/how to post this"}`;

  let text: string;
  try {
    const message = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 400, messages: [{ role: 'user', content: prompt }] });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 400); }
      catch { text = await callGemini(prompt, 400); }
    } else throw err;
  }
  return JSON.parse(extractJSON(text)) as TrendingPostResult;
}

export interface ProfileQuestion {
  question: string;
  category: string;
}

export async function generateProfileQuestions(params: {
  existingAnswers: Array<{ question: string; answer: string; category: string }>;
  businessType?: string | null;
  industry?: string | null;
  neededCategory: string;
}): Promise<ProfileQuestion[]> {
  const { existingAnswers, businessType, industry, neededCategory } = params;
  const answeredTopics = existingAnswers.map(a => a.question).join('\n- ');
  const prompt = `You generate qualifying questions for a business intelligence app aimed at small business owners.
Business type: ${businessType ?? 'unknown'}. Industry: ${industry ?? 'unknown'}. Category needed: ${neededCategory}.
Questions already answered (do NOT repeat or closely paraphrase these topics):
- ${answeredTopics || 'none yet'}
Generate exactly 3 new YES/NO qualifying questions for category "${neededCategory}". Each should reveal something useful about the owner's business situation.
Return ONLY valid JSON array: [{"question":"...","category":"${neededCategory}"},...]`;

  let text: string;
  try {
    const message = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 400, messages: [{ role: 'user', content: prompt }] });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 400); }
      catch { text = await callGemini(prompt, 400); }
    } else throw err;
  }
  return JSON.parse(extractJSON(text)) as ProfileQuestion[];
}

export interface AIProfileResult {
  summary: string;
  interests: string[];
  businessFocus: string[];
  profileScore: number;
}

export async function updateUserProfile(params: {
  allAnswers: Array<{ question: string; answer: string; category: string }>;
  businessType?: string | null;
  industry?: string | null;
  country?: string | null;
}): Promise<AIProfileResult> {
  const { allAnswers, businessType, industry, country } = params;
  const answersText = allAnswers.map(a => `[${a.category}] Q: ${a.question} → ${a.answer}`).join('\n');
  const prompt = `You are analysing a small business owner's profile based on their answers.
Business type: ${businessType ?? 'unknown'}. Industry: ${industry ?? 'unknown'}. Country: ${country ?? 'unknown'}.
Their answers:
${answersText}

Write a 2-3 sentence profile summary as if speaking directly to them ("You run a...").
Extract their top interests (3-5 short phrases) and key business focus areas (3-5 short phrases).
Calculate a profile completeness score 0-100 based on how many answers are filled and how detailed they are (${allAnswers.length} answers given).
Return ONLY valid JSON: {"summary":"...","interests":["..."],"businessFocus":["..."],"profileScore":number}`;

  let text: string;
  try {
    const message = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 600, messages: [{ role: 'user', content: prompt }] });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 600); }
      catch { text = await callGemini(prompt, 600); }
    } else throw err;
  }
  return JSON.parse(extractJSON(text)) as AIProfileResult;
}

// ─── Growth Intelligence Functions ────────────────────────────────────────────

export interface CompetitorScanResult {
  summary: string;
  importance: 'low' | 'medium' | 'high';
  eventType: string;
}

export async function scanCompetitorPage(params: {
  competitorName: string;
  pageType: string;
  url: string;
  previousText: string;
  currentText: string;
}): Promise<CompetitorScanResult> {
  const { competitorName, pageType, url, previousText, currentText } = params;
  const prompt = `You detect meaningful changes on a competitor's ${pageType} page.
Competitor: ${competitorName}
URL: ${url}
PREVIOUS CONTENT (excerpt):
${previousText.slice(0, 2000)}
CURRENT CONTENT (excerpt):
${currentText.slice(0, 2000)}

Describe the most important change in 1-2 sentences. Classify importance (low/medium/high) and event type (one of: pricing_change, content_change, new_post, product_change, hiring, funding).
Return ONLY valid JSON: {"summary":"...","importance":"medium","eventType":"content_change"}`;

  let text: string;
  try {
    const message = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 400, messages: [{ role: 'user', content: prompt }] });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 400); }
      catch { text = await callGemini(prompt, 400); }
    } else throw err;
  }
  return JSON.parse(extractJSON(text)) as CompetitorScanResult;
}

export interface GrowthOpportunityResult {
  type: string;
  title: string;
  description: string;
  reason: string;
  confidenceScore: number;
  impactScore: number;
  urgencyScore: number;
  difficultyScore: number;
  potentialRevenue?: string;
  timeHorizon?: number;
  suggestedActions: string[];
  dataSources: string[];
}

export async function generateOpportunities(params: {
  businessProfile: {
    businessName?: string | null;
    businessType?: string | null;
    industry?: string | null;
    description?: string | null;
    products: unknown;
    services: unknown;
    targetAudience?: string | null;
    revenueGoal?: string | null;
    growthGoal?: string | null;
    keywords: unknown;
  };
  recentArticles: Array<{ title: string; summary?: string | null }>;
  competitorEvents: Array<{ title: string; eventType: string; aiSummary: string }>;
  trendingTopics: Array<{ name: string; category: string }>;
  userInsights: Array<{ question: string; answer?: string | null }>;
}): Promise<GrowthOpportunityResult[]> {
  const { businessProfile, recentArticles, competitorEvents, trendingTopics, userInsights } = params;

  const articlesText = recentArticles.slice(0, 15).map(a => `- ${a.title}: ${a.summary ?? ''}`).join('\n');
  const eventsText = competitorEvents.slice(0, 8).map(e => `- [${e.eventType}] ${e.title}: ${e.aiSummary}`).join('\n');
  const topicsText = trendingTopics.slice(0, 8).map(t => `- ${t.name} (${t.category})`).join('\n');
  const insightsText = userInsights.slice(0, 10).filter(i => i.answer).map(i => `- Q: ${i.question} → ${i.answer}`).join('\n');

  const prompt = `You are a growth strategist. Analyze the following context for a business and identify 3-7 specific, actionable growth opportunities.

BUSINESS:
Name: ${businessProfile.businessName ?? 'Unknown'}
Type: ${businessProfile.businessType ?? 'Unknown'}
Industry: ${businessProfile.industry ?? 'Unknown'}
Description: ${businessProfile.description ?? 'N/A'}
Products: ${JSON.stringify(businessProfile.products)}
Services: ${JSON.stringify(businessProfile.services)}
Target Audience: ${businessProfile.targetAudience ?? 'N/A'}
Revenue Goal: ${businessProfile.revenueGoal ?? 'N/A'}
Growth Goal: ${businessProfile.growthGoal ?? 'N/A'}
Keywords: ${JSON.stringify(businessProfile.keywords)}

RECENT NEWS (last 24h):
${articlesText || 'None'}

COMPETITOR CHANGES:
${eventsText || 'None'}

TRENDING TOPICS:
${topicsText || 'None'}

OWNER INSIGHTS:
${insightsText || 'None'}

For each opportunity, provide:
- type: one of revenue|marketing|pricing|market_gap|competitor_weakness|trend|partnership|geographic
- title: concise opportunity name (max 10 words)
- description: what the opportunity is (2-3 sentences)
- reason: why it exists right now (1-2 sentences, reference specific context above)
- confidenceScore: 0.0-1.0
- impactScore: 0.0-1.0
- urgencyScore: 0.0-1.0 (1.0 = act now, 0.0 = no rush)
- difficultyScore: 0.0-1.0 (1.0 = very hard)
- potentialRevenue: estimated $ impact (optional string like "$5k-$20k/mo")
- timeHorizon: days to see results (number, optional)
- suggestedActions: array of 2-4 specific action strings
- dataSources: array of context items that support this (reference news/trends/competitors)

Return ONLY valid JSON array of opportunity objects.`;

  let text: string;
  try {
    const message = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 2500); }
      catch { text = await callGemini(prompt, 2500); }
    } else throw err;
  }
  return JSON.parse(extractJSON(text)) as GrowthOpportunityResult[];
}

export interface GrowthExperimentResult {
  hypothesis: string;
  expectedOutcome: string;
  difficulty: 'low' | 'medium' | 'high';
  expectedRevenue?: string;
  successMetrics: string[];
  estimatedDays: number;
  requiredActions: string[];
  priorityScore: number;
}

export async function generateExperiments(params: {
  businessProfile: {
    businessName?: string | null;
    businessType?: string | null;
    industry?: string | null;
    growthGoal?: string | null;
  };
  topOpportunities: GrowthOpportunityResult[];
  userInsights: Array<{ question: string; answer?: string | null }>;
}): Promise<GrowthExperimentResult[]> {
  const { businessProfile, topOpportunities, userInsights } = params;

  const oppsText = topOpportunities.slice(0, 5).map((o, i) => `${i + 1}. [${o.type}] ${o.title}: ${o.description}`).join('\n');
  const insightsText = userInsights.slice(0, 10).filter(i => i.answer).map(i => `- ${i.question}: ${i.answer}`).join('\n');

  const prompt = `You are a growth experimentation expert. Design 3-5 specific, time-boxed growth experiments for this business based on their top opportunities.

BUSINESS:
Name: ${businessProfile.businessName ?? 'Unknown'}
Type: ${businessProfile.businessType ?? 'Unknown'}
Industry: ${businessProfile.industry ?? 'Unknown'}
Growth Goal: ${businessProfile.growthGoal ?? 'N/A'}

TOP OPPORTUNITIES:
${oppsText}

OWNER CONTEXT:
${insightsText || 'None'}

For each experiment:
- hypothesis: "If we [action], then [outcome] because [reason]" (1 sentence)
- expectedOutcome: measurable result to expect (1 sentence)
- difficulty: low|medium|high
- expectedRevenue: estimated $ impact (optional)
- successMetrics: array of 2-3 specific KPIs to track
- estimatedDays: realistic days to run the experiment (14-90)
- requiredActions: array of 3-5 concrete steps to implement
- priorityScore: 0.0-1.0 based on impact × confidence ÷ difficulty

Return ONLY valid JSON array of experiment objects.`;

  let text: string;
  try {
    const message = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 2000); }
      catch { text = await callGemini(prompt, 2000); }
    } else throw err;
  }
  return JSON.parse(extractJSON(text)) as GrowthExperimentResult[];
}

export interface AdvisorReportContent {
  whatChanged: string;
  whyItMatters: string;
  topOpportunities: Array<{ title: string; impact: string; action: string }>;
  topThreats: Array<{ title: string; risk: string; mitigation: string }>;
  recommendedActions: string[];
  outlook7d: string;
  outlook30d: string;
}

export async function generateAdvisorReport(params: {
  businessProfile: {
    businessName?: string | null;
    businessType?: string | null;
    industry?: string | null;
    description?: string | null;
    growthGoal?: string | null;
    revenueGoal?: string | null;
  };
  recentBriefingSummary: string;
  opportunities: Array<{ title: string; type: string; description: string; impactScore: number; urgencyScore: number }>;
  competitorEvents: Array<{ title: string; eventType: string; aiSummary: string; importance: string }>;
  trendingTopics: Array<{ name: string; category: string }>;
}): Promise<AdvisorReportContent> {
  const { businessProfile, recentBriefingSummary, opportunities, competitorEvents, trendingTopics } = params;

  const oppsText = opportunities.slice(0, 5).map(o => `- [${o.type}] ${o.title} (impact: ${o.impactScore.toFixed(1)}, urgency: ${o.urgencyScore.toFixed(1)}): ${o.description}`).join('\n');
  const eventsText = competitorEvents.slice(0, 5).map(e => `- [${e.importance}] ${e.title}: ${e.aiSummary}`).join('\n');
  const topicsText = trendingTopics.slice(0, 8).map(t => t.name).join(', ');

  const prompt = `You are an elite business growth advisor. Write a strategic weekly intelligence report for this business owner.

BUSINESS:
Name: ${businessProfile.businessName ?? 'Unknown'}
Type: ${businessProfile.businessType ?? 'Unknown'}
Industry: ${businessProfile.industry ?? 'Unknown'}
Description: ${businessProfile.description ?? 'N/A'}
Revenue Goal: ${businessProfile.revenueGoal ?? 'N/A'}
Growth Goal: ${businessProfile.growthGoal ?? 'N/A'}

RECENT NEWS SUMMARY:
${recentBriefingSummary || 'No recent briefing available.'}

TOP GROWTH OPPORTUNITIES DETECTED:
${oppsText || 'None identified yet.'}

COMPETITOR INTELLIGENCE:
${eventsText || 'No recent competitor changes.'}

TRENDING TOPICS:
${topicsText || 'None'}

Write a strategic advisor report with these sections:
- whatChanged: 2-3 sentences on the most important market developments this week relevant to this business
- whyItMatters: 2-3 sentences explaining the strategic significance for this specific business
- topOpportunities: array of 3 objects {title, impact, action} — the top opportunities to act on NOW
- topThreats: array of 2-3 objects {title, risk, mitigation} — biggest risks to watch
- recommendedActions: numbered array of 5-7 specific, actionable recommendations for this week
- outlook7d: 2-3 sentence short-term outlook for the next 7 days
- outlook30d: 2-3 sentence medium-term strategic outlook for the next 30 days

Speak directly to the business owner in a confident, strategic tone. Be specific and reference actual news/trends/competitor data from above.
Return ONLY valid JSON matching this structure.`;

  let text: string;
  try {
    const message = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] });
    text = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    if (isCreditsError(err)) {
      try { text = await callOpenAI(prompt, 3000); }
      catch { text = await callGemini(prompt, 3000); }
    } else throw err;
  }
  return JSON.parse(extractJSON(text)) as AdvisorReportContent;
}
