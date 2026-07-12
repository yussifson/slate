import React, { useState } from 'react';
import { BrainCircuit, Send, Bot, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminAI() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello Super Admin. I'm your advanced AI assistant. You can ask me to analyze system metrics, predict which companies are likely to upgrade, or query recent audit logs." }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', content: input }]);
    const currentInput = input;
    setInput("");

    // Simulate AI response based on queries
    setTimeout(() => {
      let response = "I have analyzed the database. ";
      
      if (currentInput.toLowerCase().includes("upgrade")) {
        response += "Based on usage patterns (active spaces and video recording frequency), 'Acme Corp' and 'TechFlow' have a 85% probability of upgrading to Enterprise this month.";
      } else if (currentInput.toLowerCase().includes("login") || currentInput.toLowerCase().includes("today")) {
        response += "We had 145 unique logins today. The most active region was North America (75% of logins). No suspicious IP behavior detected.";
      } else {
        response += "I can generate a detailed report for you. Would you like me to export the raw data as well?";
      }

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    }, 1000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] flex flex-col w-full max-w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Intelligence</h1>
        <p className="text-muted-foreground mt-2">Interact with the database using natural language.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card">
        <CardHeader className="bg-muted/50 border-b border-border py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            Optavel AI Assistant
          </CardTitle>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-500" />
                </div>
              )}
              
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted text-foreground rounded-tl-sm'
              }`}>
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
        </ScrollArea>

        <CardContent className="p-4 bg-muted/50 border-t border-border mt-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about companies, logins, or predictive analytics..." 
              className="flex-1 bg-background"
            />
            <Button type="submit" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
