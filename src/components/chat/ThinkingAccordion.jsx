import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

/**
 * Parse reasoning/thinking tags emitted by models like QwQ, DeepSeek-R1, or Kimi.
 * Supports <think>...</think> and <thought>...</thought>.
 * Also handles in-progress (streaming) thinking tags.
 */
export function parseThinking(text) {
  if (!text || typeof text !== 'string') {
    return { thinking: null, content: text || '', isThinkingDone: true };
  }

  // Match complete or open-ended <think> or <thought> tags
  const thinkRegex = /<(think|thought)>([\s\S]*?)(?:<\/\1>|$)/i;
  const match = text.match(thinkRegex);

  if (match) {
    const thinking = match[2].trim();
    // Remove the thought block from the main content
    const content = text.replace(match[0], '').trim();
    const isThinkingDone = text.includes('</think>') || text.includes('</thought>');
    return { thinking: thinking || null, content, isThinkingDone };
  }

  return { thinking: null, content: text, isThinkingDone: true };
}

/**
 * Collapsible Thinking Accordion component (similar to ChatGPT / Claude / Kimi UI)
 */
export default function ThinkingAccordion({ thinking, isThinkingDone = true }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking) return null;

  return (
    <div className="mb-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] overflow-hidden transition-all text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/[0.05] transition-colors font-medium select-none"
      >
        <div className="flex items-center gap-2">
          <Brain className={`w-3.5 h-3.5 ${!isThinkingDone ? 'animate-pulse text-amber-500' : 'text-emerald-500'}`} />
          <span>
            {!isThinkingDone ? 'Reasoning in progress...' : 'Thought process'}
          </span>
          <span className="text-[10px] opacity-60 px-1.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/10 font-mono">
            {!isThinkingDone ? 'Thinking' : 'Reasoning'}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-70">
          <span className="text-[10px]">{isOpen ? 'Hide' : 'View'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3.5 py-3 border-t border-slate-200/60 dark:border-white/5 text-[11.5px] font-mono leading-relaxed opacity-80 whitespace-pre-wrap max-h-64 overflow-y-auto bg-slate-900/5 dark:bg-black/30 text-slate-700 dark:text-slate-300 scrollbar-thin">
          {thinking}
        </div>
      )}
    </div>
  );
}
