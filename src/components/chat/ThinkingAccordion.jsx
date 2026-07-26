import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Parse reasoning/thinking tags emitted by models like QwQ, DeepSeek-R1, Qwen3, or Kimi.
 * Handles:
 * 1. Explicit <think>...</think> or <thought>...</thought> tags.
 * 2. In-progress (streaming) open <think> tags.
 * 3. Plain text headers like "Thinking Process:" or "Thought:".
 * 4. Untagged 1st-person reasoning monologues ("Okay, let me tackle...", "The user is asking...").
 */
export function parseThinking(text) {
  if (!text || typeof text !== 'string') {
    return { thinking: null, content: text || '', isThinkingDone: true };
  }

  const trimmed = text.trim();

  // 1. Explicit <think>...</think> or <thought>...</thought> tags
  const thinkRegex = /<(think|thought)>([\s\S]*?)(?:<\/\1>|$)/i;
  const match = trimmed.match(thinkRegex);

  if (match) {
    const thinking = match[2].trim();
    const content = trimmed.replace(match[0], '').trim();
    const isThinkingDone = trimmed.includes('</think>') || trimmed.includes('</thought>');
    return { thinking: thinking || null, content, isThinkingDone };
  }

  // 2. Explicit headers: "Thinking Process:" or "Thought:" or "Reasoning:"
  const headerRegex = /^(Thinking Process|Thought|Reasoning):\s*([\s\S]*?)(?:\n\n(?=[A-Z0-9#\*])|$)/i;
  const headerMatch = trimmed.match(headerRegex);
  if (headerMatch) {
    const thinking = headerMatch[2].trim();
    const content = trimmed.replace(headerMatch[0], '').trim();
    return { thinking, content, isThinkingDone: true };
  }

  // 3. Monologue reasoning at start of response without XML tags
  // (e.g., "Okay, let me tackle this query. The user is asking... First, I need to...")
  const monologueStartRegex = /^(okay,?\s+let\s+me|let's\s+analyze|the\s+user\s+is\s+asking|first,?\s+i\s+need\s+to|looking\s+at\s+the|to\s+answer\s+this|i\s+should\s+focus\s+on)/i;

  if (monologueStartRegex.test(trimmed)) {
    // Look for paragraph split where actual response begins
    const splitRegex = /\n\n(?=(?:here\s+|based\s+on\s+|the\s+following|your\s+|active\s+|=|#|\*|-|\d+\.))/i;
    const splitIdx = trimmed.search(splitRegex);

    if (splitIdx !== -1) {
      const thinking = trimmed.substring(0, splitIdx).trim();
      const content = trimmed.substring(splitIdx).trim();
      return { thinking, content, isThinkingDone: true };
    } else {
      // Fallback: if there are multiple paragraphs, treat the first paragraph as internal reasoning
      const paragraphs = trimmed.split(/\n\n+/);
      if (paragraphs.length > 1) {
        const thinking = paragraphs[0].trim();
        const content = paragraphs.slice(1).join('\n\n').trim();
        return { thinking, content, isThinkingDone: true };
      }
    }
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
