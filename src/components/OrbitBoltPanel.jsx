import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Maximize2, Minimize2, Loader2, Zap, RotateCcw, User, Mic, Paperclip, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';

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
    content: "Hello! I'm **OrbitBolt** — your AI module architect.\n\nDescribe any workflow, database, or business process and I'll instantly design a complete, professional module schema for you.\n\nTry something like: *\"Build me a Client CRM with deal tracking\"* or *\"Create an HR Leave Management module\"*"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSchema, setLastSchema] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

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
      let contextNote = '';
      if (currentSchema) {
        contextNote = `\n\n[CONTEXT: The user is currently editing an existing module. Current module: ${JSON.stringify(currentSchema)}. Refine or modify it based on the user's request.]`;
      }

      const apiMessages = [
        { role: 'system', content: BOLT_SYSTEM_PROMPT + contextNote },
        ...newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      ];

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
      content: "Hello! I'm **OrbitBolt** — your AI module architect.\n\nWhat would you like to build?"
    }]);
    setLastSchema(null);
    setInput('');
  };

  const handleNotSupported = (feature) => {
    toast(`OrbitBolt is optimized for text descriptions. ${feature} is not needed for module generation.`, { icon: 'ℹ️' });
  };

  if (!isOpen) return null;

  return (
    <div className={`flex h-full shrink-0 border-l-[3px] border-l-blue-500 bg-card shadow-[-8px_0_30px_rgba(0,0,0,0.07)] z-40 transition-all duration-300 ${isOpen ? (isExpanded ? 'w-[680px] opacity-100' : 'w-[400px] opacity-100') : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'}`}>
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header - Styled like AiAssistant */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-gradient-to-r from-blue-500/8 to-indigo-500/5 shrink-0 justify-between">
          <div className="flex items-center gap-2 mb-0">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-600/20 text-blue-600 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <p className="text-[11px] font-bold text-foreground leading-none">OrbitBolt</p>
              <div className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white truncate">AI Builder</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handleReset}
              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
              title="Start fresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages - Styled like AiAssistant */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] [background-size:18px_18px]">
          <div className="absolute inset-0 bg-card/65 pointer-events-none z-0"></div>
          <div className="relative z-10 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                </div>
                <div className={`flex flex-col gap-2 max-w-[88%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-card border border-border rounded-tl-sm text-foreground'
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
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] transition-all duration-200"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Apply to Builder
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">OrbitBolt is thinking...</p>
                </div>
              </div>
            )}

            {/* Starter Prompts */}
            {messages.length <= 1 && (
              <div className="pt-2 flex flex-wrap gap-1.5 shrink-0">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors truncate max-w-[200px]"
                  >
                    ⚡ {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Styled exactly like AiAssistant */}
        <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="border border-border focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15 rounded-xl bg-background transition-all overflow-hidden shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? ' Listening speak now' : 'Ask anything or give a command'}
              rows={2}
              className={`w-full bg-transparent border-none focus:ring-0 resize-none px-3 pt-3 pb-1 text-sm text-foreground outline-none leading-relaxed ${
                isRecording ? 'placeholder:text-red-400 placeholder:animate-pulse' : 'placeholder:text-muted-foreground/50'
              }`}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleNotSupported('File upload')}
                  className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                  title="Attach file or image"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNotSupported('Voice input')}
                  className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                  title="Voice input"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider hidden sm:block"> Send  Shift+ Newline</span>
                <button
                  type="button"
                  disabled={!input.trim() || isLoading}
                  onClick={() => handleSend()}
                  className="h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
