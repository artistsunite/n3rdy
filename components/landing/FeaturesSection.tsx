'use client';

import { motion } from 'framer-motion';
import { Rss, Brain, TrendingUp, Bell, BarChart2, Globe } from 'lucide-react';

const FEATURES = [
  {
    icon: Rss,
    title: 'Custom Source Engine',
    description:
      'Add any RSS feed, news site, competitor page, or government source. Organise by category, region, and trust level.',
  },
  {
    icon: Brain,
    title: 'AI Article Analysis',
    description:
      'Every article is scored for sentiment, market impact, urgency, and risk. Entities, sectors, and second-order effects extracted automatically.',
  },
  {
    icon: TrendingUp,
    title: 'Trending Intelligence',
    description:
      'Detect what\'s accelerating across your sources before it reaches mainstream media. Velocity-weighted topic tracking.',
  },
  {
    icon: BarChart2,
    title: 'Sentiment Dashboards',
    description:
      'Live sentiment across markets, crypto, macro, geopolitics, and technology. Visualised as trends over time with source weighting.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description:
      'Get notified when keywords spike, sentiment shifts, or high-impact stories emerge. Configurable thresholds per topic.',
  },
  {
    icon: Globe,
    title: 'Executive Briefings',
    description:
      'AI-generated briefings delivered daily or on-demand. Top stories, market forecasts, risk signals, bull/bear outlook.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-n3-bg">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-n3-text mb-4">
            Intelligence, not just news
          </h2>
          <p className="text-n3-muted text-lg max-w-xl mx-auto">
            We turn thousands of daily signals into structured intelligence you can act on.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-n3-card border border-n3-border rounded-xl p-6 hover:border-n3-primary/40 transition-colors group"
            >
              <div className="w-10 h-10 bg-n3-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-n3-primary/20 transition-colors">
                <Icon size={20} className="text-n3-primary" />
              </div>
              <h3 className="font-semibold text-n3-text mb-2">{title}</h3>
              <p className="text-n3-muted text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
