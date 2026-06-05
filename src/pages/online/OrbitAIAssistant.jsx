import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Sparkles, Send, BrainCircuit, Lightbulb, Code, BookOpen, Bot } from 'lucide-react';

export default function OrbitAIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
      { role: 'ai', content: "Hello! I'm Orbit, your AI study assistant. I can help explain complex topics, review your code, generate practice quizzes, or summarize video lectures. What are we learning today?" }
  ]);

  const handleSend = () => {
      if (!input.trim()) return;
      
      const newMessages = [...messages, { role: 'user', content: input }];
      setMessages(newMessages);
      setInput('');
      
      // Simulate AI response
      setTimeout(() => {
          setMessages([...newMessages, { 
              role: 'ai', 
              content: "That's a great question! Based on your current progress in 'Advanced React Patterns', it seems you're asking about the Context API. Let me break that down for you...\n\nThe Context API is primarily designed to share data that can be considered 'global' for a tree of React components, such as the current authenticated user, theme, or preferred language. It avoids 'prop drilling'."
          }]);
      }, 1500);
  };

  const suggestions = [
      { icon: <BrainCircuit className="w-4 h-4"/>, text: "Explain Flexbox in simple terms" },
      { icon: <Code className="w-4 h-4"/>, text: "Review my React custom hook" },
      { icon: <Lightbulb className="w-4 h-4"/>, text: "Generate a quiz on UI fundamentals" },
      { icon: <BookOpen className="w-4 h-4"/>, text: "Summarize the last lecture" }
  ];

  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      
      {/* Header */}
      <div className="px-8 py-4 border-b border-border bg-overlay shrink-0 flex justify-between items-center z-10 relative">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orbit to-pulse flex items-center justify-center shadow-[0_0_15px_rgba(108,99,255,0.4)]">
                  <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                  <h1 className="text-lg font-display font-medium text-white leading-tight">Orbit AI Assistant</h1>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Online & Ready
                  </p>
              </div>
          </div>
          
          <div className="flex gap-2 text-sm">
              <button className="px-3 py-1.5 text-text-secondary hover:text-white transition-colors">History</button>
              <button className="px-3 py-1.5 text-text-secondary hover:text-white transition-colors">Clear Chat</button>
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          {/* Ambient Background Glow */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orbit/5 rounded-full blur-[150px] pointer-events-none"></div>

          <div className="max-w-4xl mx-auto space-y-6 relative z-10 pb-32">
              
              {messages.length === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-12">
                      {suggestions.map((s, i) => (
                          <button 
                              key={i} 
                              onClick={() => setInput(s.text)}
                              className="bg-surface/50 border border-border hover:border-orbit/50 hover:bg-surface p-4 rounded-xl text-left flex items-start gap-3 transition-all group"
                          >
                              <div className="p-2 bg-overlay rounded-lg text-orbit group-hover:bg-orbit group-hover:text-white transition-colors">
                                  {s.icon}
                              </div>
                              <span className="text-sm font-medium text-text-secondary group-hover:text-white mt-1">{s.text}</span>
                          </button>
                      ))}
                  </div>
              )}

              {messages.map((m, i) => (
                  <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'ai' && (
                          <div className="w-8 h-8 rounded-lg bg-orbit flex items-center justify-center shrink-0 mt-1">
                              <Sparkles className="w-4 h-4 text-white" />
                          </div>
                      )}
                      
                      <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${m.role === 'user' ? 'bg-surface border border-border text-white rounded-tr-sm' : 'bg-orbit-glow border border-orbit/20 text-text-primary rounded-tl-sm'}`}>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {m.content}
                          </div>
                      </div>
                      
                      {m.role === 'user' && (
                          <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 mt-1 text-xs font-bold text-text-muted uppercase">
                              ME
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-overlay border-t border-border shrink-0 absolute bottom-0 w-full z-20">
          <div className="max-w-4xl mx-auto relative">
              <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Orbit to explain a concept, generate a quiz, or review your code..."
                  className="w-full bg-deep border border-border rounded-xl pl-6 pr-14 py-4 text-sm text-text-primary focus:outline-none focus:border-orbit focus:ring-1 focus:ring-orbit transition-all shadow-lg"
              />
              <button 
                  onClick={handleSend}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-orbit hover:bg-orbit-light rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!input.trim()}
              >
                  <Send className="w-4 h-4 text-white -ml-0.5" />
              </button>
          </div>
          <div className="max-w-4xl mx-auto text-center mt-3 text-[10px] text-text-muted">
              Orbit AI can make mistakes. Consider verifying important information with your instructor.
          </div>
      </div>
    </div>
  );
}
