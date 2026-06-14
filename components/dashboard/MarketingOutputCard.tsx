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

function applyInline(text: string): React.ReactNode[] {
  // Handle **bold** and *italic* inline
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    return part;
  });
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={key++} className="space-y-1 my-2 ml-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
            <span className="text-n3-primary mt-0.5 flex-shrink-0">›</span>
            <span className="leading-relaxed">{applyInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^###?\s/.test(line)) {
      flushList();
      const text = line.replace(/^###?\s/, '');
      nodes.push(
        <h4 key={key++} className="text-sm font-bold text-white mt-4 mb-1 first:mt-0">
          {applyInline(text)}
        </h4>
      );
    } else if (/^##?\s/.test(line)) {
      flushList();
      const text = line.replace(/^##?\s/, '');
      nodes.push(
        <h3 key={key++} className="text-base font-bold text-white mt-5 mb-1.5 first:mt-0 border-b border-white/10 pb-1">
          {applyInline(text)}
        </h3>
      );
    } else if (/^[*\-+]\s/.test(line)) {
      listItems.push(line.replace(/^[*\-+]\s/, ''));
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, '');
      const num = line.match(/^(\d+)/)?.[1] ?? '';
      flushList();
      nodes.push(
        <div key={key++} className="flex items-start gap-2 text-sm text-white/80 my-0.5">
          <span className="text-n3-primary font-bold flex-shrink-0 w-4 text-right">{num}.</span>
          <span className="leading-relaxed">{applyInline(text)}</span>
        </div>
      );
    } else if (line === '') {
      flushList();
      nodes.push(<div key={key++} className="h-2" />);
    } else {
      flushList();
      nodes.push(
        <p key={key++} className="text-sm text-white/80 leading-relaxed">
          {applyInline(line)}
        </p>
      );
    }
  }
  flushList();
  return <div className="space-y-0.5">{nodes}</div>;
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
          <span className="text-xs text-white/30">{timeAgo(createdAt)}</span>
          <span className="text-xs text-white/40">· via {aiProvider}</span>
        </div>
        <div className="flex items-center gap-2">
          {brief && (
            <button
              onClick={() => setBriefOpen(v => !v)}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              {briefOpen ? 'Hide brief' : 'Show brief'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            {copied ? <Check size={12} className="text-n3-success" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Brief (collapsible) */}
      {brief && briefOpen && (
        <div className="px-4 py-3 bg-white/3 border-b border-white/10">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5 font-semibold">Your Brief</p>
          <p className="text-xs text-white/80 leading-relaxed">{brief}</p>
        </div>
      )}

      {/* Output content */}
      <div className="px-4 py-4">
        <SimpleMarkdown content={content} />
      </div>
    </div>
  );
}
