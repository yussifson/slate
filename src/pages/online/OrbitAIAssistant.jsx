import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function OrbitAIAssistant({ isOpen = true, onClose }) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Hello! I am Orbit, your personal AI learning assistant. How can I help you with your coursework today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'This is a simulated AI response. In a production environment, this would call an LLM API to provide tutoring context based on your current course.'
      }]);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-module-online)] to-[var(--color-success)] p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold font-display leading-tight flex items-center gap-1">Orbit AI <Sparkles className="w-3 h-3 text-[var(--color-warning)] fill-[var(--color-warning)]" /></h3>
            <p className="text-[10px] opacity-90 uppercase tracking-wider font-semibold">Tutor Assistant</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-surface-1)]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]' : 'bg-[var(--color-module-online)] text-white'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-tr-sm' : 'bg-[var(--color-module-online)] text-white rounded-tl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-[var(--color-module-online)] text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-[var(--color-module-online)] text-white shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--color-surface-0)] border-t border-[var(--color-border-subtle)] shrink-0">
        <div className="relative flex items-end">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Orbit a question..."
            className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[var(--radius-xl)] pl-4 pr-12 py-3 min-h-[50px] max-h-32 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-module-online)] focus:ring-1 focus:ring-[var(--color-module-online)] resize-none"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 w-8 h-8 bg-[var(--color-module-online)] text-white rounded-full flex items-center justify-center hover:bg-[var(--color-success)] transition-colors disabled:opacity-50 disabled:hover:bg-[var(--color-module-online)]"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-[var(--color-text-tertiary)] flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Orbit AI can make mistakes. Verify important info.
          </span>
        </div>
      </div>
    </div>
  );
}
