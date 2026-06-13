import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ArticleCardProps {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  shortSummary?: string;
  sentiment?: string;
  sentimentScore?: number;
  marketImpactScore?: number;
  riskLevel?: string;
  bullishBearish?: string;
  sectorsAffected?: string[];
  compact?: boolean;
}

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'text-n3-success bg-n3-success/10 border-n3-success/20',
  negative: 'text-n3-danger bg-n3-danger/10 border-n3-danger/20',
  neutral: 'text-white/50 bg-white/5 border-white/10',
};

const RISK_STYLES: Record<string, string> = {
  low: 'text-n3-success',
  medium: 'text-n3-warning',
  high: 'text-n3-danger',
  critical: 'text-red-400',
};

function SentimentIcon({ value }: { value?: string }) {
  if (value === 'bullish') return <TrendingUp size={12} className="text-n3-success" />;
  if (value === 'bearish') return <TrendingDown size={12} className="text-n3-danger" />;
  return <Minus size={12} className="text-white/50" />;
}

export default function ArticleCard({
  title,
  url,
  sourceName,
  publishedAt,
  shortSummary,
  sentiment = 'neutral',
  sentimentScore,
  marketImpactScore,
  riskLevel,
  bullishBearish,
  sectorsAffected = [],
  compact = false,
}: ArticleCardProps) {
  const timeAgo = (() => {
    const diff = Date.now() - new Date(publishedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
  })();

  return (
    <div className="liquid-glass-card rounded-xl p-4 hover:shadow-[inset_0_1px_0_rgba(0,229,255,0.15)] transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-white/50">{sourceName}</span>
            <span className="text-xs text-white/20">·</span>
            <span className="text-xs text-white/50">{timeAgo}</span>
            {riskLevel && riskLevel !== 'low' && (
              <>
                <span className="text-xs text-white/20">·</span>
                <span className={`text-xs font-medium ${RISK_STYLES[riskLevel] ?? 'text-white/50'}`}>
                  {riskLevel.toUpperCase()} RISK
                </span>
              </>
            )}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white group-hover:text-n3-primary transition-colors line-clamp-2 leading-snug"
          >
            {title}
          </a>

          {!compact && shortSummary && (
            <p className="text-xs text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
              {shortSummary}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {sentiment && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${SENTIMENT_STYLES[sentiment] ?? SENTIMENT_STYLES.neutral}`}>
                <SentimentIcon value={bullishBearish} />
                {sentiment}
                {sentimentScore !== undefined && (
                  <span className="opacity-60">({sentimentScore > 0 ? '+' : ''}{sentimentScore.toFixed(2)})</span>
                )}
              </span>
            )}

            {marketImpactScore !== undefined && (
              <span className="text-xs text-white/50">
                Impact:{' '}
                <span className={marketImpactScore >= 0.7 ? 'text-n3-warning' : marketImpactScore >= 0.4 ? 'text-white' : 'text-white/50'}>
                  {(marketImpactScore * 10).toFixed(1)}/10
                </span>
              </span>
            )}

            {sectorsAffected.slice(0, 2).map((s) => (
              <span key={s} className="text-xs bg-white/5 text-white/50 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 text-white/50 hover:text-n3-primary transition-colors flex-shrink-0"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
