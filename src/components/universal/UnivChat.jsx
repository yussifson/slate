import React, { useState, useEffect, useRef } from 'react';

import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser(data.user);
    });
  }, []);

  // Fetch Channels
  const { data: channels = [] } = useQuery({
    queryKey: ['chat_channels', effectiveCompanyId, effectivePageName],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_channels`);
      }
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      const parsed = (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r) }));
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
  const { data: messages = [] } = useQuery({
    queryKey: ['chat_messages', effectiveCompanyId, activeChannelId],
    queryFn: async () => {
      if (!effectiveCompanyId || !activeChannelId) return [];
      let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
      if (targetTable === 'industry_records') {
        query = query.eq('industry', 'orbit_build_data').eq('record_type', `${activeChannelId}_messages`);
      }
      const { data, error } = await query.order('created_at', { ascending: true });
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
    return () => { supabase.removeChannel(channel); };
  }, [effectiveCompanyId, activeChannelId, targetTable, queryClient]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createChannelMutation = useMutation({
    mutationFn: async (name) => {
      const channelData = { name: name.trim().toLowerCase().replace(/\s+/g, '-'), description: '' };
      let payload;
      if (targetTable === 'industry_records') {
        payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_channels`, data: channelData };
      } else {
        payload = { ...channelData, company_id: effectiveCompanyId };
      }
      const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO targetTable (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
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
        payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${activeChannelId}_messages`, data: msgData };
      } else {
        payload = { ...msgData, company_id: effectiveCompanyId };
      }
      const { error } = await (async () => {
        const _p = payload;
        const _k = Object.keys(_p);
        const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _pl = _k.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO targetTable (${_k.join(', ')}) VALUES (${_pl})`, _v);
      })();
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
      <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-border flex flex-col shrink-0">
        <div className="h-14 px-4 flex items-center justify-between border-b border-border shadow-sm bg-card z-10">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> {title}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          <div>
            <div className="flex items-center justify-between px-2 mb-2 group">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Channels</h3>
              <button 
                onClick={() => setIsCreatingChannel(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {isCreatingChannel && (
              <div className="px-2 mb-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="channel-name..."
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newChannelName.trim()) createChannelMutation.mutate(newChannelName);
                    if (e.key === 'Escape') setIsCreatingChannel(false);
                  }}
                  className="w-full h-8 px-2 text-sm bg-background border border-border rounded focus:outline-none focus:border-primary"
                />
              </div>
            )}
            
            <div className="space-y-0.5">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    activeChannelId === channel.id 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <HashIcon className="w-4 h-4 opacity-70" />
                  <span className="truncate">{channel.name || 'general'}</span>
                </button>
              ))}
              {channels.length === 0 && !isCreatingChannel && (
                <div className="px-2 text-xs text-muted-foreground italic">No channels yet.</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Current User footer */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs relative">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{currentUser?.email?.split('@')[0] || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeChannelId ? (
          <>
            {/* Header */}
            <div className="h-14 px-6 flex items-center justify-between border-b border-border shadow-sm shrink-0 bg-card/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-bold text-foreground">{activeChannel?.name || 'general'}</h3>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
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
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to #{activeChannel?.name || 'general'}</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">This is the start of the #{activeChannel?.name || 'general'} channel. Messages are real-time.</p>
              </div>

              {messages.map((msg, idx) => {
                const showHeader = idx === 0 || messages[idx - 1].sender_email !== msg.sender_email || 
                                 (new Date(msg.created_at) - new Date(messages[idx - 1].created_at) > 300000); // 5 mins
                
                return (
                  <div key={msg.id} className={cn("group flex gap-4 hover:bg-muted/30 -mx-4 px-4 py-1 rounded-xl transition-colors", showHeader ? "mt-6" : "mt-1")}>
                    {/* Avatar */}
                    <div className="w-10 shrink-0">
                      {showHeader ? (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {msg.sender_email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      ) : (
                        <div className="w-10 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 text-right pr-2 pt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {showHeader && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-foreground">{msg.sender_email?.split('@')[0]}</span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      )}
                      <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Quick Actions (Hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background border border-border shadow-sm rounded-lg px-1 py-1 h-8 self-start -mt-3 relative z-10">
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Smile className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Reply className="w-4 h-4" /></button>
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
                className="bg-card border border-border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden"
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
                <div className="bg-muted/30 px-3 py-2 flex items-center justify-between border-t border-border/50">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <button type="button" className="p-1.5 hover:bg-muted rounded hover:text-foreground transition-colors"><Plus className="w-4 h-4" /></button>
                    <button type="button" className="p-1.5 hover:bg-muted rounded hover:text-foreground transition-colors"><Smile className="w-4 h-4" /></button>
                    <button type="button" className="p-1.5 hover:bg-muted rounded hover:text-foreground transition-colors"><Paperclip className="w-4 h-4" /></button>
                  </div>
                  <button 
                    type="submit"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors flex items-center gap-2 px-3 text-sm font-medium"
                  >
                    <Send className="w-4 h-4" /> 
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a channel or create a new one to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
