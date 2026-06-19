import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { Bot, Send, User, BookOpen} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { useAuth} from "@/lib/AuthContext";

export default function AITutor() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const { session} = useAuth();
 const queryClient = useQueryClient();
 const [input, setInput] = useState('');
 
 // Fetch existing chat session or create one
 const { data: chatSession} = useQuery({
 queryKey: ['school_ai_chat', companyId, session?.user?.id],
 queryFn: async () => {
 const data = await base44.getEntities('school_ai_chat', companyId);
 // Filter by current user
 const userSession = data.find(s => s.client_id === session?.user?.id);
 return userSession || null;
},
 enabled: !!companyId && !!session?.user?.id
});

 const createSession = useMutation({
 mutationFn: (newMessages) => base44.createEntity({
 company_id: companyId,
 case_type: 'school_ai_chat',
 client_id: session?.user?.id,
 title: 'AI Tutoring Session',
 status: 'active',
 data: { messages: newMessages}
}),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school_ai_chat', companyId]})
});

 const updateSession = useMutation({
 mutationFn: ({ id, newMessages}) => base44.updateEntity(id, {
 data: { ...chatSession.data, messages: newMessages}
}),
 onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school_ai_chat', companyId]})
});

 const messages = chatSession?.data?.messages || [
 { role: 'ai', content: "Hello! I'm your AI Academic Tutor. I can help you with math problems, essay outlines, or explaining complex science concepts. What would you like to study today?"}
 ];

 const handleSend = () => {
 if (!input.trim()) return;
 const newMsg = { role: 'user', content: input};
 const updatedMessages = [...messages, newMsg];
 
 // Save user message immediately
 if (chatSession) updateSession.mutate({ id: chatSession.id, newMessages: updatedMessages});
 else createSession.mutate(updatedMessages);
 
 setInput('');
 
 // Simulate AI response logic
 setTimeout(() => {
 const aiReply = {
 role: 'ai',
 content: `I'd be happy to help you understand that topic! Based on your recent curriculum, here is an explanation for "${newMsg.content}"... (Backend saved this chat!)`
};
 const finalMessages = [...updatedMessages, aiReply];
 if (chatSession) updateSession.mutate({ id: chatSession.id, newMessages: finalMessages});
 // If it was just created, we might need to rely on the query invalidation to get the ID, 
 // but for simulation, this timeout is fine.
}, 1500);
};

 return (
 <div className="flex flex-col h-[85vh] space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-md-xl bg-primary/20 flex items-center justify-center">
 <Bot className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h1 className="text-2xl school-heading font-extrabold tracking-tight tracking-[-0.02em]">AI Tutor</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400">Personalized 24/7 academic assistance (Live DB Sync)</p>
 </div>
 </div>

 <div className="flex-1 bg-card rounded-md-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar flex flex-col">
 {messages.map((msg, i) => (
 <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
 <div className={`w-8 h-8 rounded-md-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-primary/20 text-primary'}`}>
 {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
 </div>
 <div className={`max-w-[70%] p-4 rounded-md-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-md-tr-none' : 'bg-muted rounded-md-tl-none'}`}>
 <p className="text-sm leading-relaxed">{msg.content}</p>
 </div>
 </div>
 ))}
 </div>
 
 <div className="p-4 bg-background border-t border-primary/40">
 <div className="flex gap-2">
 <Button variant="outline" size="icon" className="shrink-0"><BookOpen className="w-4 h-4" /></Button>
 <Input 
 value={input} 
 onChange={e => setInput(e.target.value)} 
 onKeyDown={e => e.key === 'Enter' && handleSend()}
 placeholder="Ask a question about math, science, history..." 
 className="flex-1 bg-card border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 text-white gap-2 px-6">
 <Send className="w-4 h-4" /> Send
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
