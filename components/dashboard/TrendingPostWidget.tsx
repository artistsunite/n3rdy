'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import ExpandableWidget from './ExpandableWidget';

interface TrendingTopic {
  name: string;
  sentimentScore: number;
  category: string;
  velocity: number;
}

interface PostResult {
  post: string;
  hashtags: string[];
  tip: string;
}

export default function TrendingPostWidget() {
  const [topic, setTopic] = useState<TrendingTopic | null>(null);
  const [post, setPost] = useState<PostResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trending?period=24h')
      .then(r => r.json())
      .then(d => {
        const topics: TrendingTopic[] = d.topics ?? [];
        if (topics.length > 0) setTopic(topics[0]);
      })
      .catch(() => null);
  }, []);

  async function generate() {
    if (!topic || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/marketing/trending-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.name,
          topicSentiment: topic.sentimentScore > 0.1 ? 'bullish' : topic.sentimentScore < -0.1 ? 'bearish' : 'neutral',
        }),
      });
      const data = await res.json() as PostResult;
      setPost(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!post) return;
    const text = `${post.post}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isPositive = (topic?.sentimentScore ?? 0) >= 0;
  const charCount = post ? `${post.post.length}/280` : '';
  const charOver = post ? post.post.length > 280 : false;

  const compactContent = (
    <div className="space-y-3">
      {topic ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-n3-success/15 text-n3-success' : 'bg-n3-danger/15 text-n3-danger'}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isPositive ? 'BULLISH' : 'BEARISH'}
          </span>
          <span className="text-sm text-white font-medium">{topic.name}</span>
          <span className="text-xs text-white/40">{topic.category}</span>
        </div>
      ) : (
        <p className="text-xs text-white/40">No trending topics available.</p>
      )}
      <button
        onClick={generate}
        disabled={!topic || generating}
        className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
      >
        <Sparkles size={11} />
        {generating ? 'Generating…' : 'Generate Post Idea'}
      </button>
    </div>
  );

  const expandedContent = (
    <div className="space-y-4">
      {error && <p className="text-xs text-n3-danger bg-n3-danger/10 rounded-lg px-3 py-2">{error}</p>}

      {!post && !generating && (
        <div className="text-center py-4">
          <p className="text-xs text-white/50 mb-3">Click "Generate" to create an AI post about the top trending topic.</p>
          <button
            onClick={generate}
            disabled={!topic || generating}
            className="inline-flex items-center gap-2 bg-n3-primary text-n3-bg px-4 py-2 rounded-lg text-sm font-semibold hover:bg-n3-primary/90 disabled:opacity-50 transition-colors"
          >
            <Sparkles size={13} />
            Generate Post Idea
          </button>
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-n3-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-white/50">Generating your post…</span>
        </div>
      )}

      {post && (
        <div className="space-y-3">
          {/* Social card mockup */}
          <div className="bg-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-n3-primary/20 flex items-center justify-center">
                <span className="text-n3-primary text-xs font-bold">B</span>
              </div>
              <div>
                <p className="text-xs text-white font-semibold">Your Business</p>
                <p className="text-[10px] text-white/40">@yourbusiness</p>
              </div>
            </div>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{post.post}</p>
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map(h => (
                <span key={h} className="text-xs text-n3-primary">{h}</span>
              ))}
            </div>
            {/* Character count bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className={charOver ? 'text-n3-danger' : 'text-white/40'}>{charCount}</span>
              </div>
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${charOver ? 'bg-n3-danger' : 'bg-n3-success'}`}
                  style={{ width: `${Math.min((post.post.length / 280) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {post.tip && (
            <p className="text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2">
              💡 {post.tip}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs bg-white/8 hover:bg-white/12 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? <Check size={12} className="text-n3-success" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs bg-white/8 hover:bg-white/12 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ExpandableWidget
      title="Post Inspiration"
      icon={<Sparkles size={14} />}
      compactContent={compactContent}
      expandedContent={expandedContent}
    />
  );
}
