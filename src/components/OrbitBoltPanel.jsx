import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Maximize2, Minimize2, Loader2, ChevronDown, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BOLT_SYSTEM_PROMPT = `You are OrbitBolt — a hyper-intelligent, precision-engineered AI module architect embedded in Optalflow's Module Builder.

Your SOLE PURPOSE is to help users design, build, and refine stunning, powerful, and professional custom modules and pages. You have deep expertise in:
- Data architecture and schema design
- Business workflow optimization
- UX/UI best practices for enterprise software
- Naming conventions that are clear, professional, and scalable

When the user describes a module or page they want to build, you MUST respond with a COMPLETE JSON schema in this EXACT format:

\`\`\`json
{
  "module": {
    "name": "Module Name",
    "description": "A clear, professional description of what this module does",
    "icon": "LucideIconName",
    "layout": "table",
    "theme": "primary",
    "module_type": "data_module"
  },
  "fields": [
    {
      "name": "field_name",
      "field_type": "text|number|date|boolean|select",
      "is_required": true,
      "options": []
    }
  ]
}
\`\`\`

RULES FOR GREAT MODULES:
1. Field names must be lowercase with underscores (snake_case). Example: "client_name", "due_date".
2. Always include at least 5-8 well-thought-out fields that cover the full business use case.
3. For "select" fields, always populate "options" with 3-6 realistic, professional values.
4. Choose the right icon from Lucide React icons (e.g. "Briefcase", "Users", "Package", "Heart", "Truck", "BarChart", "Calendar", "FileText", "ShoppingBag", "Activity").
5. Choose layout: "table" for data-heavy modules, "grid" for card-based views.
6. Choose theme: "primary", "blue", "emerald", "rose", "amber", or "purple".
7. module_type options: "data_module", "dashboard", "kanban", "document_manager"
8. After outputting the JSON, give a brief 2-3 sentence explanation of your design choices.
9. ALWAYS output valid JSON inside the code block. NEVER omit the json code block.

You are building PREMIUM enterprise software. Every module you design should feel professional, complete, and ready to use.`;

function FormatMessage({ content }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mt-1 [&>ul]:mb-2 [&>ol]:mt-1 [&>ol]:mb-2 [&>ul]:pl-4 [&>ol]:pl-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

const STARTER_PROMPTS = [
  "Build me a Client CRM module with contacts, deal stages, and follow-up tracking",
  "Create a Project Management module with tasks, milestones, and team assignments",
  "Design a Inventory module with products, stock levels, reorder alerts, and suppliers",
  "Build a Property Listings module for a real estate agency",
  "Create a Patient Records module for a clinic",
  "Design an Employee Onboarding tracker module",
];

export default function OrbitBoltPanel({ isOpen, onClose, onApplySchema, currentSchema }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "⚡ I'm **OrbitBolt** — your AI module architect.\n\nDescribe any workflow, database, or business process and I'll instantly design a complete, professional module schema for you.\n\nTry something like: *\"Build me a Client CRM with deal tracking\"* or *\"Create an HR Leave Management module\"*"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSchema, setLastSchema] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractJsonSchema = (text) => {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build context-aware prompt with current schema if editing
      let contextNote = '';
      if (currentSchema) {
        contextNote = `\n\n[CONTEXT: The user is currently editing an existing module. Current module: ${JSON.stringify(currentSchema)}. Refine or modify it based on the user's request.]`;
      }

      const apiMessages = [
        { role: 'system', content: BOLT_SYSTEM_PROMPT + contextNote },
        ...newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      ];

      // Call the generate-dynamic-module edge function for consistency
      const response = await supabase.functions.invoke('generate-dynamic-module', {
        body: {
          prompt: text,
          company_id: user?.company_id,
          moduleType: 'data_module',
          isBoltChat: true,
          chatHistory: apiMessages
        }
      });

      let assistantText;
      let schema = null;

      if (response.error || !response.data?.success) {
        // Fallback: construct a direct AI request via Cloudflare or a simple fetch
        // Try to use what we got back
        assistantText = "I encountered an issue. Please try rephrasing your request.";
        if (response.data?.schema) {
          schema = response.data.schema;
          assistantText = `Here's your module schema! I've designed **${schema.module?.name}** with ${schema.fields?.length || 0} fields.`;
        }
      } else {
        const data = response.data;
        if (data.schema) {
          schema = data.schema;
          assistantText = `✅ I've designed **${schema.module?.name}** — ${schema.module?.description}\n\nIt includes **${schema.fields?.length || 0} fields** optimized for your use case.\n\nClick **"Apply to Builder"** to load this into your module builder instantly.`;
        } else {
          assistantText = data.message || "Schema generated. Check the builder.";
        }
      }

      if (schema) {
        setLastSchema(schema);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantText,
        schema: schema 
      }]);

    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Error: ${err.message}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, user?.company_id, currentSchema]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplySchema = (schema) => {
    if (onApplySchema) {
      onApplySchema(schema);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "🎨 Schema applied to your builder! You can now review, customize, and publish your module. Need any adjustments? Just ask!"
      }]);
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "⚡ Ready for a new module design! What would you like to build?"
    }]);
    setLastSchema(null);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className={`flex h-full shrink-0 border-l-[3px] border-l-purple-500 bg-card shadow-[-8px_0_30px_rgba(0,0,0,0.07)] z-40 transition-all duration-300 ${isOpen ? (isExpanded ? 'w-[700px] opacity-100' : 'w-[420px] opacity-100') : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'}`}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-pink-500/5 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground leading-none">OrbitBolt</p>
                <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0"></span>
                  <span className="text-[10px] text-white font-semibold">AI Builder</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Module Architect</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isExpanded ? "Shrink panel" : "Expand panel"}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close OrbitBolt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-muted/60 border border-border text-foreground rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <FormatMessage content={msg.content} />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {/* Apply Schema Button */}
                {msg.schema && (
                  <button
                    onClick={() => handleApplySchema(msg.schema)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-200"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Apply to Builder
                  </button>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-white text-xs font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-muted/60 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-muted-foreground">Designing your module...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts — show only at start */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 shrink-0">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Quick start</p>
            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-purple-400/50 hover:text-purple-600 transition-all duration-150 truncate"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border bg-card shrink-0">
          <div className="flex gap-2 items-end bg-muted/40 rounded-xl border border-border focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/20 transition-all p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe a module to build... (Enter to send)"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[44px] max-h-[120px] leading-relaxed py-1"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">⚡ Shift+Enter for new line • Enter to send</p>
        </div>
      </div>
    </div>
  );
}
