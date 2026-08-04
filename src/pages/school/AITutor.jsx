import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, User, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function AITutor() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  
  const { data: chatSession } = useQuery({
    queryKey: ['school_ai_chat', companyId, session?.user?.id],
    queryFn: async () => {
      const data = await base44.getEntities('school_ai_chat', companyId);
      const userSession = data.find(s => s.client_id === session?.user?.id);
      return userSession || null;
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const createSession = useMutation({
    pattern: 'school_ai_chat',
    mutationFn: (newMessages) => base44.createEntity({
      company_id: companyId,
      case_type: 'school_ai_chat',
      client_id: session?.user?.id,
      title: 'AI Tutoring Session',
      status: 'active',
      data: { messages: newMessages }
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school_ai_chat', companyId] })
  });

  const updateSession = useMutation({
    mutationFn: ({ id, newMessages }) => base44.updateEntity(id, {
      data: { ...chatSession.data, messages: newMessages }
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school_ai_chat', companyId] })
  });

  const messages = chatSession?.data?.messages || [
    { role: 'ai', content: "Hello! I'm your AI Academic Tutor. I can help you with math problems, essay outlines, or explaining complex science concepts. What would you like to study today?" }
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', content: input };
    const updatedMessages = [...messages, newMsg];
    
    if (chatSession) updateSession.mutate({ id: chatSession.id, newMessages: updatedMessages });
    else createSession.mutate(updatedMessages);
    
    setInput('');
    
    setTimeout(() => {
      const aiReply = {
        role: 'ai',
        content: `I'd be happy to help you understand that topic! Based on your recent curriculum, here is an explanation for "${newMsg.content}"... (Backend saved this chat!)`
      };
      const finalMessages = [...updatedMessages, aiReply];
      if (chatSession) updateSession.mutate({ id: chatSession.id, newMessages: finalMessages });
    }, 1500);
  };

  return (
    <SchoolPageShell
      title="AI Tutor"
      subtitle="Personalized 24/7 academic assistance"
      breadcrumb={['School', 'AI Tutor']}
    >
      <div className="bg-card rounded-xl border border-border/50 shadow-sm flex flex-col h-[calc(100vh-260px)] min-h-[450px] overflow-hidden">
        {/* Header/Status */}
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground">Tutor Online</span>
          </div>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full">Live DB Sync</span>
        </div>

        {/* Message Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-muted text-muted-foreground border-border/50'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-muted/50 text-foreground border border-border/30 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-muted/20 border-t border-border/50">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0 rounded-lg border-border/50 hover:bg-muted"><BookOpen className="w-4 h-4 text-muted-foreground" /></Button>
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about math, science, history..." 
              className="flex-1 bg-background border-border/50 h-10 text-sm rounded-lg"
            />
            <Button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-5 rounded-lg flex items-center gap-2 text-sm font-medium">
              <Send className="w-4 h-4" /> Send
            </Button>
          </div>
        </div>
      </div>
    </SchoolPageShell>
  );
}
