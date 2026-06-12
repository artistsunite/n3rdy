'use client';

import type { MarketingAgent } from '@/lib/marketing-agents';

interface Props {
  agent: MarketingAgent;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function MarketingAgentCard({ agent, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(agent.id)}
      className={`
        w-full text-left p-3 rounded-xl border transition-all duration-150
        ${selected
          ? `${agent.color} ${agent.borderColor} ${agent.textColor}`
          : 'bg-n3-card border-n3-border text-n3-muted hover:border-white/20 hover:text-n3-text'
        }
      `}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{agent.emoji}</span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold leading-tight ${selected ? agent.textColor : 'text-n3-text'}`}>
            {agent.name}
          </p>
          <p className="text-xs mt-0.5 leading-snug line-clamp-2 opacity-80">
            {agent.description}
          </p>
        </div>
      </div>
    </button>
  );
}
