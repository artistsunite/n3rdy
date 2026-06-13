export interface MarketingDate {
  date: string; // YYYY-MM-DD
  name: string;
  emoji: string;
  type: 'holiday' | 'retail' | 'awareness' | 'seasonal' | 'business';
  country: 'AU' | 'US' | 'UK' | 'global';
  tip: string;
}

const DATES_2026: MarketingDate[] = [
  // January 2026
  { date: '2026-01-01', name: "New Year's Day", emoji: '🎆', type: 'holiday', country: 'global', tip: 'Launch New Year promotions and resolutions-themed offers.' },
  { date: '2026-01-13', name: 'Australia Day', emoji: '🇦🇺', type: 'holiday', country: 'AU', tip: 'Celebrate Aussie culture with local-pride campaigns and summer deals.' },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day', emoji: '✊', type: 'holiday', country: 'US', tip: 'Acknowledge with purpose-driven content around equality and community.' },
  { date: '2026-01-20', name: 'Blue Monday (Most Depressing Day)', emoji: '💙', type: 'awareness', country: 'global', tip: 'Counter with uplifting content, wellness offers, or "cheer up" discounts.' },

  // February 2026
  { date: '2026-02-02', name: 'Groundhog Day', emoji: '🦔', type: 'retail', country: 'US', tip: 'Use "no more repeating the same mistakes" angle for service businesses.' },
  { date: '2026-02-14', name: "Valentine's Day", emoji: '❤️', type: 'retail', country: 'global', tip: 'Push gifting, experiences, and couples-themed bundles 2 weeks in advance.' },
  { date: '2026-02-16', name: 'Presidents Day', emoji: '🇺🇸', type: 'holiday', country: 'US', tip: 'Run Presidents Day sales — great for retail and home goods.' },

  // March 2026
  { date: '2026-03-01', name: 'St David\'s Day', emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', type: 'holiday', country: 'UK', tip: 'Celebrate Welsh culture with themed content if relevant to your audience.' },
  { date: '2026-03-08', name: "International Women's Day", emoji: '♀️', type: 'awareness', country: 'global', tip: 'Highlight women in your team, industry, or community. Collaborate with female-led businesses.' },
  { date: '2026-03-17', name: "St Patrick's Day", emoji: '☘️', type: 'holiday', country: 'global', tip: 'Green-themed promos, Irish-inspired content, or lucky deals.' },
  { date: '2026-03-20', name: 'First Day of Autumn (AU)', emoji: '🍂', type: 'seasonal', country: 'AU', tip: 'Transition messaging — new season, new collection, clearance of summer stock.' },
  { date: '2026-03-20', name: 'First Day of Spring (US/UK)', emoji: '🌸', type: 'seasonal', country: 'US', tip: 'Spring cleaning offers, fresh start messaging, outdoor products.' },
  { date: '2026-03-29', name: 'Easter Sunday', emoji: '🐰', type: 'holiday', country: 'global', tip: 'Easter gift guides, long-weekend promotions, family-focused content.' },

  // April 2026
  { date: '2026-04-01', name: "April Fools' Day", emoji: '🃏', type: 'retail', country: 'global', tip: 'Light-hearted content, playful campaigns, or a fun "prank" promotion.' },
  { date: '2026-04-04', name: 'Easter Saturday', emoji: '🐣', type: 'holiday', country: 'AU', tip: 'Promote long-weekend deals and last-minute Easter gifts.' },
  { date: '2026-04-06', name: 'Easter Monday', emoji: '🐣', type: 'holiday', country: 'AU', tip: 'Post-Easter clearance and back-to-work content.' },
  { date: '2026-04-22', name: 'Earth Day', emoji: '🌍', type: 'awareness', country: 'global', tip: 'Showcase sustainability practices, eco-friendly products, or charitable giving.' },
  { date: '2026-04-25', name: 'Anzac Day', emoji: '🌺', type: 'holiday', country: 'AU', tip: 'Respectful acknowledgement; avoid promotional tone. Support veteran causes.' },

  // May 2026
  { date: '2026-05-04', name: "Mother's Day (US/UK)", emoji: '🌹', type: 'retail', country: 'US', tip: 'Gift guides, brunch ideas, and heartfelt content 2 weeks ahead.' },
  { date: '2026-05-04', name: 'Star Wars Day', emoji: '⭐', type: 'retail', country: 'global', tip: '"May the 4th be with you" — fun brand tie-ins if relevant to your audience.' },
  { date: '2026-05-11', name: "Mother's Day (AU)", emoji: '🌹', type: 'retail', country: 'AU', tip: 'Gift guides, experiences, and heartfelt storytelling for Aussie mums.' },
  { date: '2026-05-25', name: 'Memorial Day (US)', emoji: '🇺🇸', type: 'holiday', country: 'US', tip: 'Long-weekend sales and "unofficial start of summer" campaigns.' },

  // June 2026
  { date: '2026-06-01', name: 'Pride Month begins', emoji: '🏳️‍🌈', type: 'awareness', country: 'global', tip: 'Inclusive campaigns, rainbow branding (authentic), spotlight LGBTQ+ voices.' },
  { date: '2026-06-08', name: "Father's Day (US/UK)", emoji: '👨', type: 'retail', country: 'US', tip: 'Father\'s Day gift guides and dad-joke content marketing.' },
  { date: '2026-06-19', name: 'Juneteenth (US)', emoji: '✊', type: 'holiday', country: 'US', tip: 'Acknowledge with culturally respectful content; support Black-owned businesses.' },
  { date: '2026-06-21', name: 'Winter Solstice (AU)', emoji: '❄️', type: 'seasonal', country: 'AU', tip: 'Cosy winter messaging, warm-up deals, mid-year check-in content.' },
  { date: '2026-06-21', name: 'Summer Solstice (US/UK)', emoji: '☀️', type: 'seasonal', country: 'US', tip: 'Longest day of the year — summer campaigns, outdoor activities, sunshine branding.' },
  { date: '2026-06-30', name: 'End of Financial Year (AU)', emoji: '💰', type: 'business', country: 'AU', tip: 'Tax-time promos, "last chance to claim" messaging, EOFY sales closing push.' },

  // July 2026
  { date: '2026-07-01', name: 'New Financial Year (AU)', emoji: '📊', type: 'business', country: 'AU', tip: 'New year, fresh goals — position your product as the solution for the year ahead.' },
  { date: '2026-07-04', name: 'Independence Day (US)', emoji: '🎇', type: 'holiday', country: 'US', tip: '4th of July sales, patriotic themes, summer BBQ culture content.' },

  // August 2026
  { date: '2026-08-03', name: 'Summer Bank Holiday (UK)', emoji: '☀️', type: 'holiday', country: 'UK', tip: 'End-of-summer campaigns and long-weekend deals.' },
  { date: '2026-08-07', name: 'National Day for Aboriginal and Torres Strait Islander Children (AU)', emoji: '🟡🔴⚫', type: 'awareness', country: 'AU', tip: 'Respectful acknowledgement; partner with Indigenous organisations if genuine.' },
  { date: '2026-08-21', name: "Father's Day (AU)", emoji: '👨', type: 'retail', country: 'AU', tip: 'Aussie Father\'s Day is in September — start campaigns 2 weeks ahead.' },

  // September 2026
  { date: '2026-09-01', name: "Father's Day (AU)", emoji: '👨', type: 'retail', country: 'AU', tip: 'Gift guides and heartfelt content for Australian Father\'s Day.' },
  { date: '2026-09-07', name: 'Labor Day (US)', emoji: '🛠️', type: 'holiday', country: 'US', tip: 'End-of-summer sales and worker appreciation content.' },
  { date: '2026-09-22', name: 'First Day of Spring (AU)', emoji: '🌸', type: 'seasonal', country: 'AU', tip: 'Spring refresh messaging — new collections, cleaning, outdoor activities.' },
  { date: '2026-09-23', name: 'First Day of Autumn (US/UK)', emoji: '🍂', type: 'seasonal', country: 'US', tip: 'Harvest themes, cosy content, autumn product launches.' },

  // October 2026
  { date: '2026-10-05', name: 'World Teachers Day', emoji: '📚', type: 'awareness', country: 'global', tip: 'Appreciate educators — useful for ed-tech, tutoring, or community businesses.' },
  { date: '2026-10-10', name: 'World Mental Health Day', emoji: '🧠', type: 'awareness', country: 'global', tip: 'Promote wellbeing, support resources, and empathetic brand positioning.' },
  { date: '2026-10-12', name: 'Columbus Day / Indigenous Peoples Day (US)', emoji: '🏔️', type: 'holiday', country: 'US', tip: 'Acknowledge Indigenous Peoples\' Day with respectful content.' },
  { date: '2026-10-31', name: 'Halloween', emoji: '🎃', type: 'retail', country: 'global', tip: 'Spooky-themed promos, costume content, limited edition seasonal offers.' },

  // November 2026
  { date: '2026-11-01', name: "Melbourne Cup (AU)", emoji: '🏇', type: 'retail', country: 'AU', tip: 'Fashion, racing, and celebration content — great for hospitality and retail.' },
  { date: '2026-11-05', name: 'Guy Fawkes Night (UK)', emoji: '🎆', type: 'holiday', country: 'UK', tip: 'Bonfire night content — fireworks themes, winter warmth products.' },
  { date: '2026-11-11', name: 'Remembrance Day', emoji: '🌺', type: 'holiday', country: 'global', tip: 'Solemn acknowledgement — minimal promotional content; respect the occasion.' },
  { date: '2026-11-11', name: 'Singles Day (11.11)', emoji: '🛍️', type: 'retail', country: 'global', tip: 'Massive global shopping day — self-gifting promotions and flash sales.' },
  { date: '2026-11-26', name: 'Thanksgiving (US)', emoji: '🦃', type: 'holiday', country: 'US', tip: 'Gratitude content, family themes, and tease your Black Friday deals.' },
  { date: '2026-11-27', name: 'Black Friday', emoji: '🛒', type: 'retail', country: 'global', tip: 'Biggest sale day of the year — plan campaigns 3-4 weeks in advance.' },
  { date: '2026-11-30', name: 'Cyber Monday', emoji: '💻', type: 'retail', country: 'global', tip: 'Online-specific deals, digital products, and email/social campaigns.' },

  // December 2026
  { date: '2026-12-01', name: 'World AIDS Day', emoji: '🎗️', type: 'awareness', country: 'global', tip: 'Support health awareness organisations — relevant for health/wellness brands.' },
  { date: '2026-12-21', name: 'Summer Solstice (AU)', emoji: '☀️', type: 'seasonal', country: 'AU', tip: 'Longest day — festive summer content, holiday vibe, outdoor activities.' },
  { date: '2026-12-21', name: 'Winter Solstice (US/UK)', emoji: '❄️', type: 'seasonal', country: 'US', tip: 'Cosy Christmas content, gifting campaigns, year-end reflection.' },
  { date: '2026-12-24', name: 'Christmas Eve', emoji: '🎄', type: 'holiday', country: 'global', tip: 'Last-minute gift ideas, heartfelt brand messages, festive atmosphere.' },
  { date: '2026-12-25', name: 'Christmas Day', emoji: '🎁', type: 'holiday', country: 'global', tip: 'Warm wishes; schedule in advance. Minimal promotional tone on the day.' },
  { date: '2026-12-26', name: 'Boxing Day', emoji: '📦', type: 'retail', country: 'AU', tip: 'Boxing Day sales — one of the biggest retail days in Australia.' },
  { date: '2026-12-31', name: "New Year's Eve", emoji: '🥂', type: 'holiday', country: 'global', tip: 'Reflection + anticipation content; tease your January new year offers.' },
];

const DATES_2027: MarketingDate[] = [
  { date: '2027-01-01', name: "New Year's Day", emoji: '🎆', type: 'holiday', country: 'global', tip: 'Launch New Year promotions and resolutions-themed offers.' },
  { date: '2027-01-26', name: 'Australia Day', emoji: '🇦🇺', type: 'holiday', country: 'AU', tip: 'Celebrate Aussie culture with local-pride campaigns and summer deals.' },
  { date: '2027-02-14', name: "Valentine's Day", emoji: '❤️', type: 'retail', country: 'global', tip: 'Push gifting, experiences, and couples-themed bundles 2 weeks in advance.' },
  { date: '2027-03-08', name: "International Women's Day", emoji: '♀️', type: 'awareness', country: 'global', tip: 'Highlight women in your team, industry, or community.' },
  { date: '2027-03-17', name: "St Patrick's Day", emoji: '☘️', type: 'holiday', country: 'global', tip: 'Green-themed promos, Irish-inspired content, or lucky deals.' },
  { date: '2027-04-22', name: 'Earth Day', emoji: '🌍', type: 'awareness', country: 'global', tip: 'Showcase sustainability practices, eco-friendly products.' },
  { date: '2027-04-25', name: 'Anzac Day', emoji: '🌺', type: 'holiday', country: 'AU', tip: 'Respectful acknowledgement; avoid promotional tone.' },
  { date: '2027-06-30', name: 'End of Financial Year (AU)', emoji: '💰', type: 'business', country: 'AU', tip: 'EOFY sales closing push and tax-time promos.' },
  { date: '2027-07-01', name: 'New Financial Year (AU)', emoji: '📊', type: 'business', country: 'AU', tip: 'New year, fresh goals — position your product as the solution.' },
  { date: '2027-07-04', name: 'Independence Day (US)', emoji: '🎇', type: 'holiday', country: 'US', tip: '4th of July sales and patriotic themes.' },
  { date: '2027-10-31', name: 'Halloween', emoji: '🎃', type: 'retail', country: 'global', tip: 'Spooky-themed promos and limited edition seasonal offers.' },
  { date: '2027-11-26', name: 'Black Friday', emoji: '🛒', type: 'retail', country: 'global', tip: 'Biggest sale day — plan campaigns 3-4 weeks in advance.' },
  { date: '2027-11-29', name: 'Cyber Monday', emoji: '💻', type: 'retail', country: 'global', tip: 'Online-specific deals and digital campaigns.' },
  { date: '2027-12-25', name: 'Christmas Day', emoji: '🎁', type: 'holiday', country: 'global', tip: 'Warm wishes; schedule in advance.' },
  { date: '2027-12-26', name: 'Boxing Day', emoji: '📦', type: 'retail', country: 'AU', tip: 'Boxing Day sales — one of the biggest retail days in Australia.' },
];

const ALL_DATES = [...DATES_2026, ...DATES_2027];

export function getUpcomingDates(daysAhead: number, country?: string | null): MarketingDate[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return ALL_DATES
    .filter(d => {
      if (d.date < todayStr || d.date > cutoffStr) return false;
      if (!country) return d.country === 'global';
      return d.country === 'global' || d.country === country;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
