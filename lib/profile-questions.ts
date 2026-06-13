export interface ProfileQuestion {
  question: string;
  category: string;
}

export const SEED_QUESTIONS: ProfileQuestion[] = [
  // foundation
  { question: 'Is your business primarily product-based or service-based?', category: 'foundation' },
  { question: 'Do you sell online, in-store, or both?', category: 'foundation' },
  { question: 'Are you a solo operator or do you have a team?', category: 'foundation' },
  { question: 'Has your business been operating for more than 2 years?', category: 'foundation' },
  { question: 'Do you have a clear target customer or ideal client profile?', category: 'foundation' },

  // marketing
  { question: 'Do you currently use social media to market your business?', category: 'marketing' },
  { question: 'Are you running any paid advertising (Google Ads, Meta Ads, etc.)?', category: 'marketing' },
  { question: 'Do you have an email list you send newsletters or updates to?', category: 'marketing' },
  { question: 'Have you ever worked with a marketing agency or consultant?', category: 'marketing' },
  { question: 'Do you track where your customers or leads come from?', category: 'marketing' },

  // market
  { question: 'Do you monitor your competitors regularly?', category: 'market' },
  { question: 'Is your business affected by seasonal demand?', category: 'market' },
  { question: 'Do interest rate or economic changes directly impact your business?', category: 'market' },
  { question: 'Is your industry undergoing significant disruption or change right now?', category: 'market' },
  { question: 'Do you regularly review industry news relevant to your sector?', category: 'market' },

  // goals
  { question: 'Is customer acquisition your main growth focus right now?', category: 'goals' },
  { question: 'Are you planning to launch any new products or services this year?', category: 'goals' },
  { question: 'Is building brand awareness a key goal for you at the moment?', category: 'goals' },
  { question: 'Are you looking to expand into new markets or locations?', category: 'goals' },
  { question: 'Is improving customer retention or repeat business a priority for you?', category: 'goals' },

  // lifestyle
  { question: 'Do you regularly read business or industry news?', category: 'lifestyle' },
  { question: 'Are you interested in passive income or diversifying revenue streams?', category: 'lifestyle' },
  { question: 'Is sustainability or community values important to your brand?', category: 'lifestyle' },
  { question: 'Do you prioritise work-life balance when making business decisions?', category: 'lifestyle' },
  { question: 'Are you open to experimenting with new tools or technology in your business?', category: 'lifestyle' },
];

export const AGENT_PROFILE_QUESTIONS: Record<string, ProfileQuestion[]> = {
  'content-creator': [
    { question: 'Do you currently create content for your business (blogs, posts, videos, newsletters)?', category: 'marketing' },
    { question: 'Do you have an established brand voice or tone guide?', category: 'marketing' },
    { question: 'Is your content goal primarily educational, promotional, or engagement-driven?', category: 'marketing' },
  ],
  'seo-specialist': [
    { question: 'Does your business have a website you want to rank in search engines?', category: 'marketing' },
    { question: 'Have you done any SEO work before (keywords, meta tags, backlinks)?', category: 'marketing' },
    { question: 'Do you produce written content (blogs, articles) for your site?', category: 'marketing' },
  ],
  'email-strategist': [
    { question: 'Do you have an email list of customers or subscribers?', category: 'marketing' },
    { question: 'Do you currently send email newsletters or campaigns?', category: 'marketing' },
    { question: 'Is growing your email list a current priority?', category: 'marketing' },
  ],
  'social-media-strategist': [
    { question: 'Is social media a key marketing channel for your business?', category: 'marketing' },
    { question: 'Do you post on social media at least once per week?', category: 'marketing' },
    { question: 'Are you open to using short-form video (Reels, TikTok) in your strategy?', category: 'marketing' },
  ],
  'linkedin-creator': [
    { question: 'Do you have an active LinkedIn profile for professional or business networking?', category: 'marketing' },
    { question: 'Is your target audience primarily professional or B2B?', category: 'marketing' },
    { question: 'Do you currently share insights or content on LinkedIn?', category: 'marketing' },
  ],
  'pr-manager': [
    { question: 'Has your business received any media coverage or press mentions before?', category: 'marketing' },
    { question: 'Do you have a newsworthy story, launch, or milestone coming up?', category: 'marketing' },
    { question: 'Are you open to pitching journalists or media outlets?', category: 'marketing' },
  ],
  'growth-hacker': [
    { question: 'Are you in an active growth phase looking to scale quickly?', category: 'marketing' },
    { question: 'Are you comfortable running experiments and testing new channels?', category: 'marketing' },
    { question: 'Do you track metrics like conversion rate, customer acquisition cost, or lifetime value?', category: 'marketing' },
  ],
  'ppc-strategist': [
    { question: 'Do you currently run or have you run paid ads (Google, Meta, etc.)?', category: 'marketing' },
    { question: 'Do you have a monthly advertising budget you are willing to invest?', category: 'marketing' },
    { question: 'Do you have a landing page or product page ready for ad traffic?', category: 'marketing' },
  ],
};
