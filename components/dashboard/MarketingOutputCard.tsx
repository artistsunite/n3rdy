'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { MARKETING_AGENTS } from '@/lib/marketing-agents';

interface Props {
  agentId: string;
  content: string;
  aiProvider: string;
  createdAt: string;
  brief?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MarketingOutputCard({ agentId, content, aiProvider, createdAt, brief }: Props) {
  const [copied, setCopied] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const agent = MARKETING_AGENTS.find(a => a.id === agentId);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="liquid-glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {agent && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agent.color} ${agent.textColor}`}>
              {agent.emoji} {agent.name}
            </span>
          )}
          <span className="text-xs text-n3-muted/60">{timeAgo(createdAt)}</span>
          <span className="text-xs text-n3-muted/40">· via {aiProvider}</span>
        </div>
        <div className="flex items-center gap-2">
          {brief && (
            <button
              onClick={() => setBriefOpen(v => !v)}
              className="text-xs text-n3-muted hover:text-n3-text transition-colors"
            >
              {briefOpen ? 'Hide brief' : 'Show brief'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-n3-muted hover:text-n3-text transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            {copied ? <Check size={12} className="text-n3-success" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Brief (collapsible) */}
      {brief && briefOpen && (
        <div className="px-4 py-3 bg-white/3 border-b border-white/10">
          <p className="text-xs text-n3-muted uppercase tracking-wider mb-1.5 font-semibold">Your Brief</p>
          <p className="text-xs text-n3-text/80 leading-relaxed">{brief}</p>
        </div>
      )}

      {/* Output content */}
      <div className="px-4 py-4">
        <div className="text-sm text-n3-text leading-relaxed whitespace-pre-wrap font-sans">
          {content}
        </div>
      </div>
    </div>
  );
}
