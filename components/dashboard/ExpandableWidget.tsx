'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  icon: React.ReactNode;
  compactContent: React.ReactNode;
  expandedContent: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function ExpandableWidget({ title, icon, compactContent, expandedContent, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`liquid-glass-card rounded-2xl overflow-hidden transition-all duration-200 ${expanded ? 'shadow-[0_0_0_1px_rgba(0,229,255,0.15),0_4px_32px_rgba(0,0,0,0.4)]' : ''}`}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-n3-primary">{icon}</span>
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{title}</span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-white/40" />
        </motion.div>
      </button>

      {/* Compact content — always shown unless expanded */}
      <AnimatePresence initial={false}>
        {!expanded && (
          <motion.div
            key="compact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-4"
          >
            {compactContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-white/8">
              {expandedContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
