import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, User, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AITutor() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm your AI Academic Tutor. I can help you with math problems, essay outlines, or explaining complex science concepts. What would you like to study today?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', content: input };
    setMessages([...messages, newMsg]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `I'd be happy to help you understand that topic! Based on your recent curriculum, here's a detailed breakdown of ${newMsg.content}... (AI integration pending)`
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[85vh] space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">AI Tutor</h1>
          <p className="text-sm text-muted-foreground">Personalized 24/7 academic assistance</p>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-primary/20 text-primary'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-background border-t border-border">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0"><BookOpen className="w-4 h-4" /></Button>
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about math, science, history..." 
              className="flex-1 bg-card"
            />
            <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Send className="w-4 h-4" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
