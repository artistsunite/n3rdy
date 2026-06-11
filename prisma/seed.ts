import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const DEFAULT_SOURCES = [
  { name: 'Reuters', url: 'https://reuters.com', rssUrl: 'https://feeds.reuters.com/reuters/businessNews', category: 'markets', region: 'global', trustScore: 0.92, biasTag: 'center' },
  { name: 'Bloomberg', url: 'https://bloomberg.com', rssUrl: 'https://feeds.bloomberg.com/markets/news.rss', category: 'markets', region: 'global', trustScore: 0.90, biasTag: 'financial' },
  { name: 'Financial Times', url: 'https://ft.com', rssUrl: 'https://www.ft.com/world?format=rss', category: 'markets', region: 'global', trustScore: 0.91, biasTag: 'financial' },
  { name: 'The Wall Street Journal', url: 'https://wsj.com', rssUrl: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'markets', region: 'us', trustScore: 0.89, biasTag: 'financial' },
  { name: 'CoinDesk', url: 'https://coindesk.com', rssUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto', region: 'global', trustScore: 0.80, biasTag: 'technical' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com', rssUrl: 'https://cointelegraph.com/rss', category: 'crypto', region: 'global', trustScore: 0.75, biasTag: 'technical' },
  { name: 'The Block', url: 'https://theblock.co', rssUrl: 'https://www.theblock.co/rss.xml', category: 'crypto', region: 'global', trustScore: 0.82, biasTag: 'technical' },
  { name: 'CNBC', url: 'https://cnbc.com', rssUrl: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'markets', region: 'us', trustScore: 0.78, biasTag: 'financial' },
  { name: 'MarketWatch', url: 'https://marketwatch.com', rssUrl: 'https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines', category: 'markets', region: 'us', trustScore: 0.80, biasTag: 'financial' },
  { name: 'Seeking Alpha', url: 'https://seekingalpha.com', rssUrl: 'https://seekingalpha.com/market_currents.xml', category: 'markets', region: 'us', trustScore: 0.72, biasTag: 'financial' },
  { name: 'Ars Technica', url: 'https://arstechnica.com', rssUrl: 'https://feeds.arstechnica.com/arstechnica/index', category: 'technology', region: 'global', trustScore: 0.85, biasTag: 'technical' },
  { name: 'TechCrunch', url: 'https://techcrunch.com', rssUrl: 'https://techcrunch.com/feed/', category: 'technology', region: 'global', trustScore: 0.80, biasTag: 'technical' },
  { name: 'The Guardian Business', url: 'https://theguardian.com/business', rssUrl: 'https://www.theguardian.com/business/rss', category: 'macro', region: 'global', trustScore: 0.83, biasTag: 'left' },
  { name: 'BBC News Business', url: 'https://bbc.com/news/business', rssUrl: 'http://feeds.bbci.co.uk/news/business/rss.xml', category: 'macro', region: 'global', trustScore: 0.87, biasTag: 'center' },
  { name: 'Al Jazeera', url: 'https://aljazeera.com', rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'geopolitics', region: 'global', trustScore: 0.78, biasTag: 'center' },
  { name: 'Oil Price', url: 'https://oilprice.com', rssUrl: 'https://oilprice.com/rss/main', category: 'markets', region: 'global', trustScore: 0.76, biasTag: 'technical' },
  { name: 'Federal Reserve', url: 'https://federalreserve.gov', rssUrl: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'macro', region: 'us', trustScore: 0.99, biasTag: 'official' },
  { name: 'Australian Financial Review', url: 'https://afr.com', rssUrl: 'https://www.afr.com/rss', category: 'markets', region: 'au', trustScore: 0.84, biasTag: 'financial' },
];

async function main() {
  console.log('Seeding default sources...');

  for (const source of DEFAULT_SOURCES) {
    await db.source.upsert({
      where: { url: source.url },
      create: { ...source, isDefault: true },
      update: { trustScore: source.trustScore, rssUrl: source.rssUrl },
    });
  }

  console.log(`Seeded ${DEFAULT_SOURCES.length} default sources`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
