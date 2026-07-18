import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect, useRef} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { motion, AnimatePresence} from 'framer-motion';
import { cn} from '@/lib/utils';
import {
 Hash, MessageSquare, Send, Paperclip, Smile,
 MoreVertical, Hash as HashIcon, Plus, X, Search,
 ChevronRight, Reply, ThumbsUp, Heart, Laugh
} from 'lucide-react';

export default function UnivChat({
 title = 'Internal Chat',
 companyId,
 pageName,
 tableName
}) {
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'chat';
 const targetTable = tableName || 'industry_records';
 const queryClient = useQueryClient();

 const [currentUser, setCurrentUser] = useState(null);
 const [activeChannelId, setActiveChannelId] = useState(null);
 const [messageInput, setMessageInput] = useState('');
 const [isCreatingChannel, setIsCreatingChannel] = useState(false);
 const [newChannelName, setNewChannelName] = useState('');
 const messagesEndRef = useRef(null);

 useEffect(() => {
 supabase.auth.getUser().then(({ data}) => {
 if (data?.user) setCurrentUser(data.user);
});
}, []);

 // Fetch Channels
 const { data: channels = []} = useQuery({
 queryKey: ['chat_channels', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_channels`);
}
 const { data, error} = await query.order('created_at', { ascending: true});
 if (error && error.code !== '42P01') throw error;
 const parsed = (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
 return parsed;
},
 enabled: !!effectiveCompanyId
});

 // Set default active channel
 useEffect(() => {
 if (channels.length > 0 && !activeChannelId) {
 setActiveChannelId(channels[0].id);
}
}, [channels, activeChannelId]);

 // Fetch Messages for active channel
 const { data: messages = []} = useQuery({
 queryKey: ['chat_messages', effectiveCompanyId, activeChannelId],
 queryFn: async () => {
 if (!effectiveCompanyId || !activeChannelId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${activeChannelId}_messages`);
}
 const { data, error} = await query.order('created_at', { ascending: true});
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ 
 id: r.id, 
 created_at: r.created_at,
 ...(targetTable === 'industry_records' ? r.data : r) 
}));
},
 enabled: !!effectiveCompanyId && !!activeChannelId
});

 // Real-time subscription for messages
 useEffect(() => {
 if (!effectiveCompanyId || !activeChannelId) return;
 const channel = supabase.channel(`chat_${activeChannelId}`)
 .on('postgres_changes', { 
 event: '*', 
 schema: 'public', 
 table: targetTable,
 filter: `company_id=eq.${effectiveCompanyId}`
}, () => {
 queryClient.invalidateQueries(['chat_messages', effectiveCompanyId, activeChannelId]);
}).subscribe();
 return () => { supabase.removeChannel(channel);};
}, [effectiveCompanyId, activeChannelId, targetTable, queryClient]);

 // Scroll to bottom on new message
 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
}, [messages]);

 const createChannelMutation = useMutation({
 mutationFn: async (name) => {
 const channelData = { name: name.trim().toLowerCase().replace(/\s+/g, '-'), description: ''};
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_channels`, data: channelData};
} else {
 payload = { ...channelData, company_id: effectiveCompanyId};
}
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
},
 onSuccess: () => {
 queryClient.invalidateQueries(['chat_channels', effectiveCompanyId, effectivePageName]);
 setIsCreatingChannel(false);
 setNewChannelName('');
}
});

 const sendMessageMutation = useMutation({
 mutationFn: async (content) => {
 const msgData = {
 channel_id: activeChannelId,
 sender_email: currentUser?.email || 'Anonymous',
 content: content.trim(),
 reactions: {},
 thread_count: 0
};
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${activeChannelId}_messages`, data: msgData};
} else {
 payload = { ...msgData, company_id: effectiveCompanyId};
}
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
},
 onSuccess: () => {
 setMessageInput('');
 queryClient.invalidateQueries(['chat_messages', effectiveCompanyId, activeChannelId]);
}
});

 const handleSendMessage = (e) => {
 e.preventDefault();
 if (messageInput.trim() && activeChannelId) {
 sendMessageMutation.mutate(messageInput);
}
};

 const activeChannel = channels.find(c => c.id === activeChannelId);

 return (
 <div className="flex h-full w-full bg-background font-sans overflow-hidden">
 
 {/* Sidebar - Channels */}
 <div className="w-64 bg-slate-50 dark:bg-card border-r border-primary/40 flex flex-col shrink-0">
 <div className="h-14 px-4 flex items-center justify-between border-b border-primary/40 bg-card z-10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="font-semibold text-foreground flex items-center gap-2">
 <MessageSquare className="w-5 h-5 text-primary" /> {title}
 </h2>
 </div>
 
 <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
 <div>
 <div className="flex items-center justify-between px-2 mb-2 group">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Channels</h3>
 <button 
 onClick={() => setIsCreatingChannel(true)}
 className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted text-[#71717a] dark:text-gray-400 transition-all"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </div>
 
 {isCreatingChannel && (
 <div className="px-2 mb-2">
 <input
 
 type="text"
 placeholder="channel-name..."
 value={newChannelName}
 onChange={e => setNewChannelName(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter' && newChannelName.trim()) createChannelMutation.mutate(newChannelName);
 if (e.key === 'Escape') setIsCreatingChannel(false);
}}
 className="w-full h-8 px-2 text-sm bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md focus:outline-none focus:border-primary"
 />
 </div>
 )}
 
 <div className="space-y-0.5">
 {channels.map(channel => (
 <button
 key={channel.id}
 onClick={() => setActiveChannelId(channel.id)}
 className={cn(
 "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
 activeChannelId === channel.id 
 ? "bg-primary/10 text-primary font-semibold" 
 : "text-[#71717a] dark:text-gray-400 hover:bg-muted hover:text-foreground"
 )}
 >
 <HashIcon className="w-4 h-4 opacity-70" />
 <span className="truncate">{channel.name || 'general'}</span>
 </button>
 ))}
 {channels.length === 0 && !isCreatingChannel && (
 <div className="px-2 text-xs text-[#71717a] dark:text-gray-400 italic tracking-[0.04em]">No channels yet.</div>
 )}
 </div>
 </div>
 </div>
 
 {/* Current User footer */}
 <div className="p-3 border-t border-primary/40 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center gap-2 px-2">
 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs relative tracking-[0.04em]">
 {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500/10 border-2 border-card rounded-full hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"></div>
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-foreground truncate">{currentUser?.email?.split('@')[0] || 'User'}</p>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 truncate">Online</p>
 </div>
 </div>
 </div>
 </div>

 {/* Main Chat Area */}
 <div className="flex-1 flex flex-col bg-background relative">
 {activeChannelId ? (
 <>
 {/* Header */}
 <div className="h-14 px-6 flex items-center justify-between border-b border-primary/40 shrink-0 bg-card/80 backdrop-blur-md z-10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center gap-2">
 <Hash className="w-5 h-5 text-[#71717a] dark:text-gray-400" />
 <h3 className="font-semibold text-foreground">{activeChannel?.name || 'general'}</h3>
 </div>
 <div className="flex items-center gap-3 text-[#71717a] dark:text-gray-400">
 <Search className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" />
 <MoreVertical className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" />
 </div>
 </div>

 {/* Messages List */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
 <div className="text-center py-10">
 <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <Hash className="w-8 h-8 text-primary" />
 </div>
 <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-[-0.02em]">Welcome to #{activeChannel?.name || 'general'}</h2>
 <p className="text-[#71717a] dark:text-gray-400 text-sm max-w-md mx-auto">This is the start of the #{activeChannel?.name || 'general'} channel. Messages are real-time.</p>
 </div>

 {messages.map((msg, idx) => {
 const showHeader = idx === 0 || messages[idx - 1].sender_email !== msg.sender_email || 
 (new Date(msg.created_at) - new Date(messages[idx - 1].created_at) > 300000); // 5 mins
 
 return (
 <div key={msg.id} className={cn("group flex gap-4 hover:bg-muted/30 -mx-4 px-4 py-1 rounded-xl transition-colors", showHeader ? "mt-6" : "mt-1")}>
 {/* Avatar */}
 <div className="w-10 shrink-0">
 {showHeader ? (
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm ">
 {msg.sender_email?.charAt(0).toUpperCase() || 'U'}
 </div>
 ) : (
 <div className="w-10 text-[10px] text-[#71717a] dark:text-gray-400 opacity-0 group-hover:opacity-100 text-right pr-2 pt-1">
 {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
 </div>
 )}
 </div>
 
 {/* Content */}
 <div className="flex-1 min-w-0">
 {showHeader && (
 <div className="flex items-baseline gap-2 mb-1">
 <span className="font-semibold text-foreground">{msg.sender_email?.split('@')[0]}</span>
 <span className="text-xs text-[#71717a] dark:text-gray-400 font-medium tracking-[0.04em]">
 {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
 </span>
 </div>
 )}
 <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
 </div>

 {/* Quick Actions (Hover) */}
 <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl px-1 py-1 h-8 self-start -mt-3 relative z-10">
 <button className="p-1.5 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 hover:text-foreground"><Smile className="w-4 h-4" /></button>
 <button className="p-1.5 hover:bg-muted rounded-md text-[#71717a] dark:text-gray-400 hover:text-foreground"><Reply className="w-4 h-4" /></button>
 </div>
 </div>
 );
})}
 <div ref={messagesEndRef} />
 </div>

 {/* Message Input */}
 <div className="p-4 bg-background shrink-0 pb-6">
 <form 
 onSubmit={handleSendMessage}
 className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="px-4 py-3">
 <textarea
 value={messageInput}
 onChange={e => setMessageInput(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSendMessage(e);
}
}}
 placeholder={`Message #${activeChannel?.name || 'general'}`}
 className="w-full bg-transparent border-none outline-none text-foreground resize-none max-h-32 min-h-[24px] focus:ring-0 p-0"
 rows="1"
 />
 </div>
 <div className="bg-muted/30 px-3 py-2 flex items-center justify-between border-t border-primary/40">
 <div className="flex items-center gap-2 text-[#71717a] dark:text-gray-400">
 <button type="button" className="p-1.5 hover:bg-muted rounded-md hover:text-foreground transition-colors"><Plus className="w-4 h-4" /></button>
 <button type="button" className="p-1.5 hover:bg-muted rounded-md hover:text-foreground transition-colors"><Smile className="w-4 h-4" /></button>
 <button type="button" className="p-1.5 hover:bg-muted rounded-md hover:text-foreground transition-colors"><Paperclip className="w-4 h-4" /></button>
 </div>
 <button 
 type="submit"
 disabled={!messageInput.trim() || sendMessageMutation.isPending}
 className="p-1.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors flex items-center gap-2 px-3 text-sm font-medium"
 >
 <Send className="w-4 h-4" /> 
 <span className="hidden sm:inline">Send</span>
 </button>
 </div>
 </form>
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-[#71717a] dark:text-gray-400 p-8">
 <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
 <p>Select a channel or create a new one to start chatting.</p>
 </div>
 )}
 </div>
 </div>
 );
}
