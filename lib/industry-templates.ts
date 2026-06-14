export interface WatchlistSeed {
  type: string;
  value: string;
  label: string;
  priority: number;
}

export interface SourceSeed {
  name: string;
  url: string;
  rssUrl: string;
  category: string;
  region: string;
}

export interface IndustryTemplate {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
  profile: {
    businessType: string;
    industry: string;
    priorityTopics: string[];
    keywords: string[];
    marketRegions: string[];
  };
  watchlist: WatchlistSeed[];
  sourceCategories: string[];       // activates existing default sources by category
  extraSources: SourceSeed[];       // industry-specific RSS feeds to add
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'saas',
    label: 'SaaS / Software',
    emoji: '💻',
    tagline: 'B2B or B2C software, APIs, developer tools',
    profile: {
      businessType: 'SaaS',
      industry: 'Technology',
      priorityTopics: ['product launches', 'AI integration', 'pricing strategy', 'developer tools', 'churn reduction'],
      keywords: ['SaaS', 'MRR', 'ARR', 'churn', 'product-led growth', 'API', 'subscription software'],
      marketRegions: ['US', 'EU'],
    },
    watchlist: [
      { type: 'keyword', value: 'SaaS pricing', label: 'SaaS Pricing', priority: 8 },
      { type: 'keyword', value: 'product-led growth', label: 'Product-Led Growth', priority: 8 },
      { type: 'keyword', value: 'AI software', label: 'AI Software', priority: 9 },
      { type: 'keyword', value: 'developer tools', label: 'Developer Tools', priority: 7 },
      { type: 'sector', value: 'Technology', label: 'Technology Sector', priority: 7 },
    ],
    sourceCategories: ['technology', 'markets'],
    extraSources: [
      { name: 'Hacker News', url: 'https://news.ycombinator.com', rssUrl: 'https://hnrss.org/frontpage', category: 'technology', region: 'global' },
      { name: 'Product Hunt', url: 'https://producthunt.com', rssUrl: 'https://www.producthunt.com/feed', category: 'technology', region: 'global' },
      { name: 'SaaStr', url: 'https://www.saastr.com', rssUrl: 'https://www.saastr.com/feed/', category: 'technology', region: 'global' },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce / Retail',
    emoji: '🛒',
    tagline: 'Online stores, DTC brands, marketplace sellers',
    profile: {
      businessType: 'E-commerce',
      industry: 'Retail',
      priorityTopics: ['consumer spending', 'DTC brands', 'fulfillment', 'customer acquisition', 'seasonal trends'],
      keywords: ['e-commerce', 'DTC', 'Shopify', 'consumer spending', 'retail trends', 'fulfillment', 'CAC', 'LTV'],
      marketRegions: ['US', 'EU', 'APAC'],
    },
    watchlist: [
      { type: 'keyword', value: 'consumer spending', label: 'Consumer Spending', priority: 9 },
      { type: 'keyword', value: 'e-commerce trends', label: 'E-commerce Trends', priority: 8 },
      { type: 'keyword', value: 'Shopify', label: 'Shopify', priority: 7 },
      { type: 'keyword', value: 'Amazon marketplace', label: 'Amazon Marketplace', priority: 7 },
      { type: 'keyword', value: 'retail sales', label: 'Retail Sales', priority: 8 },
      { type: 'sector', value: 'Consumer Discretionary', label: 'Consumer Discretionary', priority: 7 },
    ],
    sourceCategories: ['markets', 'macro'],
    extraSources: [
      { name: 'Retail Dive', url: 'https://www.retaildive.com', rssUrl: 'https://www.retaildive.com/feeds/news/', category: 'markets', region: 'us' },
      { name: 'Digital Commerce 360', url: 'https://www.digitalcommerce360.com', rssUrl: 'https://www.digitalcommerce360.com/feed/', category: 'technology', region: 'us' },
    ],
  },
  {
    id: 'fintech',
    label: 'Finance / FinTech',
    emoji: '💳',
    tagline: 'Financial services, payments, lending, crypto',
    profile: {
      businessType: 'FinTech',
      industry: 'Financial Services',
      priorityTopics: ['interest rates', 'fintech regulation', 'payments innovation', 'open banking', 'crypto markets'],
      keywords: ['fintech', 'payments', 'open banking', 'regulation', 'interest rates', 'digital wallet', 'BNPL'],
      marketRegions: ['US', 'EU', 'UK'],
    },
    watchlist: [
      { type: 'keyword', value: 'fintech regulation', label: 'FinTech Regulation', priority: 9 },
      { type: 'keyword', value: 'interest rates', label: 'Interest Rates', priority: 9 },
      { type: 'keyword', value: 'payments innovation', label: 'Payments Innovation', priority: 8 },
      { type: 'keyword', value: 'open banking', label: 'Open Banking', priority: 8 },
      { type: 'sector', value: 'Financial Services', label: 'Financial Services', priority: 8 },
    ],
    sourceCategories: ['markets', 'crypto', 'macro'],
    extraSources: [
      { name: 'Finextra', url: 'https://www.finextra.com', rssUrl: 'https://www.finextra.com/finextra-rss.xml', category: 'markets', region: 'global' },
      { name: 'The Paypers', url: 'https://thepaypers.com', rssUrl: 'https://thepaypers.com/feed', category: 'markets', region: 'global' },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare / Health Tech',
    emoji: '🏥',
    tagline: 'Digital health, medtech, clinics, wellness',
    profile: {
      businessType: 'Healthcare',
      industry: 'Healthcare',
      priorityTopics: ['FDA approvals', 'telemedicine', 'health AI', 'patient experience', 'healthcare costs'],
      keywords: ['health tech', 'telemedicine', 'FDA', 'digital health', 'patient care', 'healthcare AI', 'medtech'],
      marketRegions: ['US', 'EU'],
    },
    watchlist: [
      { type: 'keyword', value: 'FDA approval', label: 'FDA Approvals', priority: 9 },
      { type: 'keyword', value: 'digital health', label: 'Digital Health', priority: 8 },
      { type: 'keyword', value: 'telemedicine', label: 'Telemedicine', priority: 8 },
      { type: 'keyword', value: 'healthcare AI', label: 'Healthcare AI', priority: 9 },
      { type: 'sector', value: 'Healthcare', label: 'Healthcare Sector', priority: 8 },
    ],
    sourceCategories: ['technology', 'macro'],
    extraSources: [
      { name: 'STAT News', url: 'https://www.statnews.com', rssUrl: 'https://www.statnews.com/feed/', category: 'technology', region: 'us' },
      { name: 'Fierce Healthcare', url: 'https://www.fiercehealthcare.com', rssUrl: 'https://www.fiercehealthcare.com/rss/xml', category: 'technology', region: 'us' },
    ],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    emoji: '🏢',
    tagline: 'Property, PropTech, commercial or residential',
    profile: {
      businessType: 'Real Estate',
      industry: 'Real Estate',
      priorityTopics: ['mortgage rates', 'housing market', 'commercial real estate', 'proptech', 'construction costs'],
      keywords: ['real estate', 'housing market', 'mortgage rates', 'commercial property', 'proptech', 'REITs', 'construction'],
      marketRegions: ['US', 'EU'],
    },
    watchlist: [
      { type: 'keyword', value: 'mortgage rates', label: 'Mortgage Rates', priority: 9 },
      { type: 'keyword', value: 'housing market', label: 'Housing Market', priority: 9 },
      { type: 'keyword', value: 'commercial real estate', label: 'Commercial Real Estate', priority: 8 },
      { type: 'keyword', value: 'Fed interest rates', label: 'Fed Interest Rates', priority: 9 },
      { type: 'sector', value: 'Real Estate', label: 'Real Estate Sector', priority: 8 },
    ],
    sourceCategories: ['markets', 'macro'],
    extraSources: [
      { name: 'The Real Deal', url: 'https://therealdeal.com', rssUrl: 'https://therealdeal.com/feed/', category: 'markets', region: 'us' },
      { name: 'Inman', url: 'https://www.inman.com', rssUrl: 'https://www.inman.com/feed/', category: 'markets', region: 'us' },
    ],
  },
  {
    id: 'media',
    label: 'Media / Content Creator',
    emoji: '🎬',
    tagline: 'Publishers, newsletters, podcasts, creators',
    profile: {
      businessType: 'Media',
      industry: 'Media & Entertainment',
      priorityTopics: ['digital advertising', 'content monetization', 'social media algorithms', 'newsletter growth', 'AI content'],
      keywords: ['digital media', 'content creator', 'newsletter', 'podcast', 'advertising CPM', 'social media', 'SEO'],
      marketRegions: ['US', 'Global'],
    },
    watchlist: [
      { type: 'keyword', value: 'digital advertising', label: 'Digital Advertising', priority: 9 },
      { type: 'keyword', value: 'social media algorithm', label: 'Social Media Algorithm', priority: 8 },
      { type: 'keyword', value: 'AI content creation', label: 'AI Content Creation', priority: 8 },
      { type: 'keyword', value: 'Substack newsletter', label: 'Newsletter Trends', priority: 7 },
      { type: 'sector', value: 'Technology', label: 'Technology Sector', priority: 7 },
    ],
    sourceCategories: ['technology', 'macro'],
    extraSources: [
      { name: 'Nieman Lab', url: 'https://www.niemanlab.org', rssUrl: 'https://www.niemanlab.org/feed/', category: 'technology', region: 'global' },
      { name: 'Marketing Brew', url: 'https://www.marketingbrew.com', rssUrl: 'https://www.marketingbrew.com/feed', category: 'technology', region: 'us' },
    ],
  },
  {
    id: 'agency',
    label: 'Agency / Consulting',
    emoji: '🤝',
    tagline: 'Marketing agencies, consultancies, freelancers',
    profile: {
      businessType: 'Agency',
      industry: 'Professional Services',
      priorityTopics: ['AI automation', 'client acquisition', 'agency pricing', 'B2B marketing', 'remote work trends'],
      keywords: ['agency growth', 'consulting', 'B2B marketing', 'client retention', 'AI tools', 'service pricing', 'lead generation'],
      marketRegions: ['US', 'EU', 'Global'],
    },
    watchlist: [
      { type: 'keyword', value: 'AI marketing tools', label: 'AI Marketing Tools', priority: 9 },
      { type: 'keyword', value: 'B2B lead generation', label: 'B2B Lead Generation', priority: 8 },
      { type: 'keyword', value: 'agency pricing', label: 'Agency Pricing', priority: 8 },
      { type: 'keyword', value: 'marketing automation', label: 'Marketing Automation', priority: 8 },
      { type: 'sector', value: 'Technology', label: 'Technology Sector', priority: 7 },
    ],
    sourceCategories: ['technology', 'markets'],
    extraSources: [
      { name: 'Marketing Week', url: 'https://www.marketingweek.com', rssUrl: 'https://www.marketingweek.com/feed/', category: 'technology', region: 'global' },
      { name: 'Search Engine Journal', url: 'https://www.searchenginejournal.com', rssUrl: 'https://www.searchenginejournal.com/feed/', category: 'technology', region: 'global' },
    ],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing / Supply Chain',
    emoji: '🏭',
    tagline: 'Physical goods, logistics, supply chain, ops',
    profile: {
      businessType: 'Manufacturing',
      industry: 'Manufacturing',
      priorityTopics: ['supply chain disruption', 'manufacturing costs', 'tariffs', 'automation', 'logistics'],
      keywords: ['supply chain', 'manufacturing', 'tariffs', 'logistics', 'automation', 'raw materials', 'reshoring'],
      marketRegions: ['US', 'APAC', 'EU'],
    },
    watchlist: [
      { type: 'keyword', value: 'supply chain', label: 'Supply Chain', priority: 9 },
      { type: 'keyword', value: 'tariffs trade', label: 'Tariffs & Trade', priority: 9 },
      { type: 'keyword', value: 'manufacturing costs', label: 'Manufacturing Costs', priority: 8 },
      { type: 'keyword', value: 'logistics disruption', label: 'Logistics Disruption', priority: 8 },
      { type: 'sector', value: 'Industrials', label: 'Industrials Sector', priority: 8 },
    ],
    sourceCategories: ['markets', 'geopolitics', 'macro'],
    extraSources: [
      { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com', rssUrl: 'https://www.supplychaindive.com/feeds/news/', category: 'markets', region: 'global' },
      { name: 'FreightWaves', url: 'https://www.freightwaves.com', rssUrl: 'https://www.freightwaves.com/news/feed', category: 'markets', region: 'global' },
    ],
  },
];
