import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, PhoneCall, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SupportAIChat({ onEscalate }) {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! I'm the CliPad Support Assistant. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = "I understand. I can help with general questions about CliPad's features, pricing, or getting started.";
      
      const lowerInput = userMessage.text.toLowerCase();
      if (lowerInput.includes('pricing') || lowerInput.includes('cost')) {
        aiResponse = "CliPad is free for everyone! We also have a Pro plan for $2/mo and an Enterprise plan. You can view them on the pricing section of our homepage.";
      } else if (lowerInput.includes('record') || lowerInput.includes('video')) {
        aiResponse = "You can record HD video messages by logging in and navigating to the 'Record' section in your dashboard. You'll need to select a Space to save it in.";
      } else if (lowerInput.includes('human') || lowerInput.includes('agent') || lowerInput.includes('help')) {
        aiResponse = "It looks like you might need to speak with a live agent for this. Click the button below to escalate your request.";
      } else {
        aiResponse = "That's a great question! While I'm still learning, if my answers aren't quite hitting the mark, you can always escalate this chat to a human agent.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: aiResponse, sender: 'ai' }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.sender === 'ai' ? <Bot className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 opacity-70" />}
                <span className="text-[10px] font-semibold opacity-70 uppercase tracking-wider">{msg.sender === 'ai' ? 'Support AI' : 'You'}</span>
              </div>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
        {messages.length >= 3 && (
          <Button 
            variant="outline" 
            onClick={onEscalate}
            className="w-full text-xs font-semibold gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Talk to a Human Agent
          </Button>
        )}
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-full text-sm outline-none transition-all"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 p-2 bg-primary text-white rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
