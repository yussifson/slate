import React, { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Plus, Search, MoreVertical, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function GlobalChatPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("recent"); // recent, contacts, groups
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text: inputValue, senderId: user.id, isAi: false }]);
    setInputValue("");
  };

  const handleAiAssist = () => {
    if (!inputValue.trim()) return;
    // Mock AI rewrite
    setInputValue(`(AI Enhanced) ${inputValue}`);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] md:w-[450px] bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 transform translate-x-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-md">
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-foreground leading-tight">Messages</h2>
            <p className="text-[11px] text-muted-foreground">Real-time team chat</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-muted/20">
        {/* Mock Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="text-center text-xs text-muted-foreground my-2">Today</div>
          
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
              <span className="text-xs font-bold text-primary">JD</span>
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm text-sm text-foreground">
              Hey! The new feature looks great. Have you tested the video integration yet?
            </div>
          </div>

          {messages.map(msg => (
            <div key={msg.id} className={cn("flex items-start gap-2 max-w-[85%]", msg.senderId === user.id ? "ml-auto flex-row-reverse" : "")}>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-1">
                 <span className="text-xs font-bold text-white">{(user?.full_name?.[0] || 'U').toUpperCase()}</span>
              </div>
              <div className={cn(
                "rounded-2xl px-4 py-2.5 shadow-sm text-sm",
                msg.senderId === user.id 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-card border border-border text-foreground rounded-tl-sm"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-card">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="w-full bg-muted border-transparent focus:bg-background focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-full pl-4 pr-10 py-2.5 text-sm transition-all shadow-sm"
              />
              <button 
                onClick={handleAiAssist}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors group"
                title="AI Magic Rewrite"
              >
                <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
              </button>
            </div>
            <Button 
              onClick={handleSend}
              size="icon" 
              className="rounded-full w-10 h-10 bg-blue-600 hover:bg-blue-700 shadow-sm shrink-0 transition-transform hover:scale-105"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI rewrite available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
