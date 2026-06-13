'use client';

import type { MarketingAgent } from '@/lib/marketing-agents';

interface Props {
  agent: MarketingAgent;
  selected: boolean;
  profileComplete?: boolean;
  onSelect: (id: string) => void;
}

export default function MarketingAgentCard({ agent, selected, profileComplete, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(agent.id)}
      className={`
        w-full text-left p-3 rounded-xl transition-all duration-150
        ${selected
          ? `${agent.color} ${agent.textColor}`
          : 'liquid-glass-card text-white/50 hover:text-white'
        }
      `}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{agent.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold leading-tight ${selected ? agent.textColor : 'text-white'}`}>
            {agent.name}
          </p>
          <p className="text-xs mt-0.5 leading-snug line-clamp-2 opacity-80">
            {agent.description}
          </p>
          {profileComplete !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {profileComplete ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-n3-success" />
                  <span className="text-[10px] text-n3-success">Profile complete</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-[10px] text-white/30">Profile needed</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
