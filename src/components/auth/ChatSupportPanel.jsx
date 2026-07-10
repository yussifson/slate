import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, ShieldAlert, Loader2, Minimize2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
export default function ChatSupportPanel({ isOpen, onClose }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Hello! I am the Optavel Support Assistant. How can I help you today?', time: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState('ai_handling'); // 'ai_handling', 'escalated', 'admin_joined'
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize chat session in DB
  useEffect(() => {
    if (!user?.id || !isOpen) return;
    const initChat = async () => {
      try {
        const { data: existing } = await supabase.from('support_chats')
          .select('id, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        
        if (existing && existing.length > 0) {
          setChatId(existing[0].id);
          setStatus(existing[0].status || 'ai_handling');
          const { data: msgs } = await supabase.from('support_chat_messages')
            .select('*').eq('chat_id', existing[0].id).order('created_at', { ascending: true });
          if (msgs && msgs.length > 0) {
            setMessages(msgs.map(m => ({
               id: m.id, sender: m.sender, text: m.text, time: m.created_at, name: m.sender === 'admin' ? 'Admin' : ''
            })));
          }
        } else {
          const { data: newChat, error } = await supabase.from('support_chats').insert({ user_id: user.id }).select('id').single();
          if (newChat) {
             setChatId(newChat.id);
             await supabase.from('support_chat_messages').insert({ chat_id: newChat.id, sender: 'ai', text: 'Hello! I am the Optavel Support Assistant. How can I help you today?' });
          } else if (error && error.code === '42P01') {
             console.warn("support_chats table does not exist. Using mock data.");
          }
        }
      } catch (err) {
        console.warn("Could not initialize chat session", err);
      }
    };
    initChat();
  }, [user?.id, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const textToSend = input.trim();
    const newMsg = { id: Date.now(), sender: 'user', text: textToSend, time: new Date().toISOString() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Persist user message if chatId exists
    if (chatId) {
       supabase.from('support_chat_messages').insert({ chat_id: chatId, sender: 'user', text: textToSend }).catch(console.error);
    }

    // Mock AI Response or Escalation
    setTimeout(async () => {
      setIsTyping(false);
      
      const lowerInput = newMsg.text.toLowerCase();
      let replyText = '';
      let escalate = false;
      
      if (lowerInput.includes('human') || lowerInput.includes('agent') || lowerInput.includes('admin')) {
        setStatus('escalated');
        replyText = 'I am transferring you to a human Support Admin. Please hold on...';
        escalate = true;
        
        if (chatId) {
           supabase.from('support_chats').update({ status: 'escalated' }).eq('id', chatId).catch(console.error);
        }
        
        // Mock Admin joining after 3 seconds
        setTimeout(() => {
           setStatus('admin_joined');
           const systemMsg = { id: Date.now() + 1, sender: 'system', text: 'Admin "Sarah" has joined the chat.', time: new Date().toISOString() };
           const adminMsg = { id: Date.now() + 2, sender: 'admin', text: 'Hi there! I am Sarah, a Super Admin. How can I assist you with this issue?', time: new Date().toISOString(), name: 'Sarah (Admin)' };
           setMessages(prev => [...prev, systemMsg, adminMsg]);
           
           if (chatId) {
             supabase.from('support_chats').update({ status: 'admin_joined' }).eq('id', chatId).catch(console.error);
             supabase.from('support_chat_messages').insert([
               { chat_id: chatId, sender: 'system', text: systemMsg.text },
               { chat_id: chatId, sender: 'admin', text: adminMsg.text }
             ]).catch(console.error);
           }
        }, 3000);
      } else {
        const lowerText = newMsg.text.toLowerCase().trim();
        if (['hi', 'hello', 'hey', 'greetings'].includes(lowerText)) {
          replyText = "Hello! How can I assist you with Optavel today?";
        } else {
          replyText = `I can certainly help you with that. Optavel provides comprehensive ecosystem tools. Could you provide a bit more detail about your issue, or would you prefer to speak to a human admin?`;
        }
      }
      
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: replyText, time: new Date().toISOString() }]);
      if (chatId) {
         supabase.from('support_chat_messages').insert({ chat_id: chatId, sender: 'ai', text: replyText }).catch(console.error);
      }
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] lg:relative lg:inset-auto lg:z-0 lg:w-[400px] lg:shrink-0 bg-white dark:bg-card lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:shadow-none shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-card/50">
           <div className="flex items-center gap-3">
             <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'admin_joined' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary/10 text-primary'}`}>
                  {status === 'admin_joined' ? <ShieldAlert className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1C1C1E] rounded-full"></div>
             </div>
             <div>
               <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                 {status === 'admin_joined' ? 'Optavel Support (Live)' : 'Optavel AI Assistant'}
               </h3>
               <p className="text-xs text-slate-500 dark:text-slate-400">
                 {status === 'admin_joined' ? 'Connected to Admin' : status === 'escalated' ? 'Connecting to Admin...' : 'Typically replies instantly'}
               </p>
             </div>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-card/10">
           
           <div className="text-center py-4">
             <p className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-full">Today</p>
           </div>
           
           {messages.map(msg => (
             <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'system' ? (
                  <div className="w-full text-center my-2">
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    {msg.sender !== 'user' && (
                       <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 ${msg.sender === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary/10 text-primary'}`}>
                          {msg.sender === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                       </div>
                    )}
                    
                    {/* Bubble */}
                    <div>
                      {msg.sender === 'admin' && <p className="text-[10px] text-slate-400 mb-1 ml-1">{msg.name}</p>}
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-white rounded-tr-sm' 
                          : msg.sender === 'admin'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-slate-800 dark:text-indigo-100 rounded-tl-sm'
                            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <p className={`text-[10px] text-slate-400 mt-1 ${msg.sender === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                        {new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                )}
             </div>
           ))}
           
           {isTyping && (
             <div className="flex w-full justify-start">
                <div className="flex gap-2 max-w-[85%]">
                   <div className="w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0 flex items-center justify-center mt-1">
                      <Bot className="w-4 h-4" />
                   </div>
                   <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex gap-1 items-center h-[42px]">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-card border-t border-slate-100 dark:border-slate-800">
           <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all p-1">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Type your message..."
               className="w-full max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 px-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0"
               rows={1}
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim()}
               className="w-10 h-10 mb-1 mr-1 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex items-center justify-center text-white shrink-0 transition-colors"
             >
               <Send className="w-4 h-4 ml-0.5" />
             </button>
           </div>
           <div className="text-center mt-3">
             <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
               Powered by Optavel AI <ExternalLink className="w-3 h-3" />
             </p>
           </div>
        </div>
      </div>
    </>
  );
}
