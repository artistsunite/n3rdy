'use client';

import { motion } from 'framer-motion';

const USE_CASES = [
  {
    persona: 'Founder',
    quote: 'Competitor launched a new feature at 7am. I had the full market context and competitor analysis in my briefing by 7:05.',
    tags: ['Competitor monitoring', 'Industry alerts', 'Strategic briefings'],
  },
  {
    persona: 'Investor',
    quote: 'I track 40 companies. N3RDY surfaces the signal across earnings, management changes, and macro shifts — before my Bloomberg terminal does.',
    tags: ['Watchlist tracking', 'Earnings alerts', 'Sentiment shifts'],
  },
  {
    persona: 'Trader',
    quote: 'Geopolitical events move commodities in minutes. Having AI pre-analyse the impact across my positions changes everything.',
    tags: ['Breaking news alerts', 'Market impact scores', 'Risk signals'],
  },
  {
    persona: 'Analyst',
    quote: 'I used to spend 3 hours reading before writing a report. Now I get a structured briefing and spend that time on actual analysis.',
    tags: ['Structured summaries', 'Source credibility', 'Export reports'],
  },
];

export default function UseCasesSection() {
  return (
    <section className="py-24 bg-n3-card/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-n3-text mb-4">
            Built for people who need to know
          </h2>
          <p className="text-n3-muted text-lg">
            From solo founders to institutional analysts, N3RDY adapts to how you work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {USE_CASES.map(({ persona, quote, tags }, i) => (
            <motion.div
              key={persona}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-n3-card border border-n3-border rounded-xl p-6"
            >
              <div className="text-xs font-semibold text-n3-primary uppercase tracking-wider mb-3">
                {persona}
              </div>
              <p className="text-n3-text text-sm leading-relaxed mb-4 italic">"{quote}"</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-n3-primary/10 text-n3-primary px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
