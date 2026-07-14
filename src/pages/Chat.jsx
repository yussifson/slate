import { supabase} from '@/api/supabaseClient';
import React, { useState, useEffect, useRef} from "react";
import { useTranslation} from "react-i18next";
import {Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video, CheckCheck, Check, Smile, Paperclip, ImageIcon, FileText, File, X, PanelLeftClose, PanelLeftOpen} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button} from "@/components/ui/button";
import { useAuth} from "@/lib/AuthContext";
import { cn} from "@/lib/utils";
import { generateText} from "@/lib/cloudflareAI";
import { powerSync} from "@/api/PowerSyncConnector";
import AddChatDialog from "@/components/chat/AddChatDialog";
import { useToast} from "@/components/ui/use-toast";
import { format} from "date-fns";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useUIPreference } from "@/hooks/useUIPreference";

export default function Chat() {
 const { t} = useTranslation();
 const { user, isPortalUser } = useAuth();
 const { toast} = useToast();
 
 const [activeRoomId, setActiveRoomId] = useState(null);
 const [rooms, setRooms] = useState([]);
 const [messages, setMessages] = useState([]);
 const [participantProfiles, setParticipantProfiles] = useState({});
 const [replyTo, setReplyTo] = useState(null);
 const [editingMsg, setEditingMsg] = useState(null);
 const [inputValue, setInputValue] = useState("");
 const [isAddChatOpen, setIsAddChatOpen] = useState(false);
 const [loadingRooms, setLoadingRooms] = useState(false);
 const [loadingMessages, setLoadingMessages] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [showEmojiPicker, setShowEmojiPicker] = useState(false);
 const [showAttachMenu, setShowAttachMenu] = useState(false);
 const [isSummarizing, setIsSummarizing] = useState(false);
 const [chatSummary, setChatSummary] = useState(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [isSidebarCollapsed, setIsSidebarCollapsed] = useUIPreference(user, 'chatSidebarCollapsed', false);

 const messagesEndRef = useRef(null);
 const fileInputRef = useRef(null);

 useEffect(() => {
 if (messagesEndRef.current) {
 messagesEndRef.current.scrollIntoView({ behavior: "smooth"});
}
}, [messages]);

 // Load Rooms
 useEffect(() => {
 if (!user?.id) return;
 loadRooms();
 
 const roomSub = supabase.channel('chat-rooms-page')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}`}, () => {
 loadRooms();
})
 .subscribe();
 
 return () => {
 supabase.removeChannel(roomSub);
};
}, [user?.id]);

 const loadRooms = async () => {
 setLoadingRooms(true);
 try {
 const { data: participants} = await supabase
 .from('chat_participants')
 .select('room_id')
 .eq('user_id', user.id);
 
 if (participants && participants.length > 0) {
 const roomIds = participants.map(p => p.room_id);
 const { data: roomsData} = await supabase
 .from('chat_rooms')
 .select(`*, chat_participants ( user_id, role )`)
 .in('id', roomIds)
 .order('updated_at', { ascending: false});
 
 if (roomsData) {
   const allUserIds = [...new Set(roomsData.flatMap(r => r.chat_participants?.map(p => p.user_id) || []))];
   if (allUserIds.length > 0) {
     const __res = await powerSync.execute(`SELECT id, full_name, avatar_url FROM profiles WHERE id IN (${allUserIds.map(()=>'?').join(',')})`, allUserIds);
     const profiles = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
     if (profiles) {
       setParticipantProfiles(prev => {
         const pMap = { ...prev };
         profiles.forEach(p => pMap[p.id] = p);
         return pMap;
       });
     }
   }
 }
 
 setRooms(roomsData || []);
} else {
 setRooms([]);
}
} catch (err) {
 console.error(err);
} finally {
 setLoadingRooms(false);
}
};

 // Load Messages for Active Room
 useEffect(() => {
 if (!activeRoomId) return;
 loadMessages(activeRoomId);
 
 const messageSub = supabase.channel(`chat-page-messages-${activeRoomId}`)
 .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoomId}`}, (payload) => {
 setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
 setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, updated_at: new Date().toISOString()} : r));
})
 .subscribe();
 
 return () => {
 supabase.removeChannel(messageSub);
};
}, [activeRoomId]);

 const loadMessages = async (roomId) => {
 setLoadingMessages(true);
 try {
 const { data} = await supabase
 .from('chat_messages')
 .select('*')
 .eq('room_id', roomId)
 .order('created_at', { ascending: true});
 setMessages(data || []);

 if (data && data.length > 0) {
 const senderIds = [...new Set(data.map(m => m.sender_id).filter(Boolean))];
 if (senderIds.length > 0) {
 const __res = await powerSync.execute(`SELECT id, full_name, avatar_url FROM profiles WHERE id IN (${senderIds.map(()=>'?').join(',')})`, senderIds);
 const profiles = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 if (profiles) {
 const pMap = {};
 profiles.forEach(p => pMap[p.id] = p);
 setParticipantProfiles(pMap);
}
}
}
} catch (err) {
 console.error(err);
} finally {
 setLoadingMessages(false);
}
};

 const handleSend = async () => {
 if (!inputValue.trim() || !activeRoomId) return;
 const text = inputValue.trim();
 setInputValue("");
 try {
 if (editingMsg) {
 (async () => {
 const _payload = {
 content: text,
 is_edited: true
};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`UPDATE chat_messages SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, editingMsg.id]);
})();
 const error = null;
 if (error) throw error;
 setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: text, is_edited: true} : m));
 setEditingMsg(null);
} else {
 (async () => {
 const _payload = {
 id: crypto.randomUUID(),
 room_id: activeRoomId,
 sender_id: user.id,
 content: text,
 reply_to_id: replyTo?.id || null
};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO chat_messages (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
})();
 const error = null;
 if (error) throw error;
 setReplyTo(null);
}
 await (async () => {
 const _payload = { updated_at: new Date().toISOString()};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`UPDATE chat_rooms SET ${_keys.map(k => k+' = ?').join(', ')} WHERE id = ?`, [..._vals, activeRoomId]);
})();
} catch (err) {
 toast({ title: "Error", description: "Failed to send message", variant: "destructive"});
}
};

 const handleFileUpload = async (e, type = 'file') => {
 const file = e.target.files?.[0];
 if (!file || !activeRoomId) return;
 if (file.size > 50 * 1024 * 1024) {
 toast({ title: "Error", description: "File exceeds 50MB limit", variant: "destructive"});
 return;
}
 setIsUploading(true);
 try {
 
 let mockUrl = `[Attachment|${file.name}|url]`;
 if (type === 'image') {
 mockUrl = `[Attachment|${file.name}|data:image/png;base64,mock]`;
}
 
 (async () => {
 const _payload = { id: crypto.randomUUID(), room_id: activeRoomId, sender_id: user.id, content: mockUrl};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO chat_messages (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
})();
 const error = null;
 if (error) throw error;
} catch (err) {
 toast({ title: "Error", description: "Failed to upload file", variant: "destructive"});
} finally {
 setIsUploading(false);
}
};

 const handleAiAssist = async () => {
 if (!inputValue.trim()) return;
 
 // Simple UI state change to indicate loading
 const originalInput = inputValue;
 setInputValue("AI is thinking...");
 
 try {
 const messages = [
 { role: 'system', content: 'You are an AI assistant helping a user write a better, more professional chat message. Rewrite the user\'s message to be clearer and more professional. Return ONLY the rewritten text, nothing else.'},
 { role: 'user', content: originalInput}
 ];
 
 const response = await generateText(messages);
 setInputValue(response || originalInput);
} catch (error) {
 console.error("AI Assist failed:", error);
 toast({ title: "AI Error", description: "Could not connect to Cloudflare AI.", variant: "destructive"});
 setInputValue(originalInput);
}
};

 const handleSummarizeChat = async () => {
    if (chatSummary) {
      setChatSummary(null);
      return;
    }
    if (messages.length === 0) {
      toast({ title: "No messages to summarize" });
      return;
    }
    setIsSummarizing(true);
    const tId = toast({ title: "AI is summarizing this chat..." });
    try {
      const recentMsgs = messages.slice(-50).map(m => {
        const sender = participantProfiles[m.sender_id]?.full_name || 'User';
        return `${sender}: ${m.content}`;
      });
      const prompt = `Summarize the following chat conversation into a brief, easy-to-read recap (3-4 bullet points max) of decisions made and outstanding items:\n\n${recentMsgs.join('\n')}`;
      
      const response = await generateText([{ role: 'user', content: prompt }]);
      setChatSummary(response);
      toast({ title: "Summary generated!" });
    } catch (err) {
      toast({ title: "Failed to summarize chat", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

 const activeRoom = rooms.find(r => r.id === activeRoomId);
 const filteredRooms = rooms.filter(r => {
   const otherParticipant = r.chat_participants?.find(p => p.user_id !== user.id);
   const otherProfile = otherParticipant ? participantProfiles[otherParticipant.user_id] : null;
   const roomName = r.name || otherProfile?.full_name || 'Direct Chat';
   return roomName.toLowerCase().includes(searchQuery.toLowerCase());
 });

 return (
 <div className="flex-1 w-full h-full min-h-0 overflow-hidden bg-background flex flex-col md:flex-row">
 <AddChatDialog 
 open={isAddChatOpen} 
 onOpenChange={setIsAddChatOpen} 
 onChatCreated={(room) => {
 setRooms(prev => [room, ...prev]);
 setActiveRoomId(room.id);
}}
 />
 
 {/* Sidebar - Channels & DMs */}
 <div className={cn(
   "flex-shrink-0 border-r border-primary/40 bg-background dark:bg-[#202c33] flex flex-col h-[40%] md:h-full z-10 relative transition-all duration-300",
   isSidebarCollapsed ? "w-0 md:w-16 overflow-hidden" : "w-full md:w-80 lg:w-96"
 )}>
 <div className={cn(
   "border-b border-primary/40 flex items-center justify-between shrink-0",
   isSidebarCollapsed ? "p-2 flex-col gap-2" : "p-4"
 )}>
 {!isSidebarCollapsed ? (
   <div className="flex items-center justify-between w-full">
     <div className="flex items-center gap-3">
       <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
         {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <MessageSquare className="w-5 h-5 text-primary" />}
       </div>
       <h2 className="font-semibold text-lg">Chats</h2>
     </div>
     <div className="flex items-center gap-1">
       <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(true)} className="w-9 h-9 rounded-full hover:bg-primary/10" title="Collapse Sidebar">
         <PanelLeftClose className="w-5 h-5" />
       </Button>
       {!isPortalUser && (
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-primary/10">
             <MoreVertical className="w-5 h-5" />
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-48">
           <DropdownMenuItem onClick={() => setIsAddChatOpen(true)}>New Chat</DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>
       )}
     </div>
   </div>
 ) : (
   <>
     <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(false)} className="w-10 h-10 rounded-full hover:bg-primary/10 mx-auto" title="Expand Sidebar">
       <PanelLeftOpen className="w-5 h-5" />
     </Button>
     {!isPortalUser && (
       <Button variant="ghost" size="icon" onClick={() => setIsAddChatOpen(true)} className="w-10 h-10 rounded-full hover:bg-primary/10 mx-auto" title="New Chat">
         <Plus className="w-5 h-5" />
       </Button>
     )}
   </>
 )}
 </div>
 
 {!isSidebarCollapsed && (
 <div className="p-3 bg-background dark:bg-[#111b21] border-b border-primary/40">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
 <input 
 type="text" 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder={t("search_chats", "Search or start new chat")} 
 className="w-full bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-0 focus:outline-none transition-all"
 />
 </div>
 </div>
 )}

 <div className="flex-1 overflow-y-auto bg-background dark:bg-[#111b21]">
 {loadingRooms ? (
 <div className="flex justify-center p-8"><OrbitLoader size="md" /></div>
 ) : filteredRooms.map(room => {
   const otherParticipant = room.chat_participants?.find(p => p.user_id !== user.id);
   const otherProfile = otherParticipant ? participantProfiles[otherParticipant.user_id] : null;
   const roomName = room.name || otherProfile?.full_name || 'Direct Chat';
   const avatarUrl = otherProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${roomName}`;

   return (
 <div 
 key={room.id}
 onClick={() => setActiveRoomId(room.id)}
 className={cn(
 "flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors group",
 activeRoomId === room.id ? "bg-[#f0f2f5] dark:bg-[#2a3942]" : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]",
 isSidebarCollapsed && "justify-center px-1"
 )}
 >
 <div className="relative flex-shrink-0" title={isSidebarCollapsed ? roomName : undefined}>
 {room.room_type === "group" ? (
 <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-primary/30 flex items-center justify-center overflow-hidden">
 <Users className="w-6 h-6 text-primary dark:text-primary/70" />
 </div>
 ) : (
 <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
  <img src={avatarUrl} alt={roomName} className="w-full h-full object-cover"/>
</div>
 )}
 </div>
 {!isSidebarCollapsed && (
 <div className="flex-1 min-w-0 border-b border-primary/40 group-last:border-none pb-3">
 <div className="flex justify-between items-baseline mb-0.5">
 <p className="text-base text-foreground truncate">{roomName}</p>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{format(new Date(room.updated_at), 'h:mm a')}</p>
 </div>
 <p className="text-sm text-[#71717a] dark:text-gray-400 truncate">Click to view messages...</p>
 </div>
 )}
 </div>
 );
 })}
 {!loadingRooms && rooms.length === 0 && !isSidebarCollapsed && (
 <div className="flex flex-col items-center justify-center p-8 h-full text-center text-[#71717a] dark:text-gray-400">
 <p>No chats found.</p>
 { !isPortalUser && (
 <Button variant="link" onClick={() => setIsAddChatOpen(true)}>Start a new chat</Button>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Main Chat Area */}
 <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative w-full h-full">
 <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/1-vpMpu-EPE.png')]" />

 {activeRoom ? (
 <>
 {/* Chat Header */}
 <div className="px-4 py-3 border-b border-primary/40 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] z-10 ">
 {(() => {
   const otherParticipant = activeRoom?.chat_participants?.find(p => p.user_id !== user.id);
   const otherProfile = otherParticipant ? participantProfiles[otherParticipant.user_id] : null;
   const roomName = activeRoom?.name || otherProfile?.full_name || 'Direct Chat';
   const avatarUrl = otherProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${roomName}`;
   
   return (
 <>
 <div className="flex items-center gap-3">
 {activeRoom?.room_type === "group" ? (
 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-primary/30 flex items-center justify-center overflow-hidden">
 <Users className="w-5 h-5 text-primary dark:text-primary/70" />
 </div>
 ) : (
 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
  <img src={avatarUrl} alt={roomName} className="w-full h-full object-cover"/>
</div>
 )}
 <div>
 <h3 className="font-semibold text-foreground leading-tight">{roomName}</h3>
 <p className="text-[12px] text-[#71717a] dark:text-gray-400">click here for contact info</p>
 </div>
 </div>
 <div className="flex items-center gap-4 text-[#54656f] dark:text-[#aebac1]">
    {messages.length > 0 && (
      <Button onClick={handleSummarizeChat} disabled={isSummarizing} variant="ghost" size="sm" className="h-8 gap-2 hover:bg-primary/10 hover:text-primary">
        <Sparkles className={cn("w-4 h-4", isSummarizing && "animate-pulse")} />
        <span className="hidden sm:inline">{isSummarizing ? "Summarizing..." : "Summarize"}</span>
      </Button>
    )}
 <button className="hover:text-foreground transition-colors"><Search className="w-5 h-5" /></button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="hover:text-foreground transition-colors"><MoreVertical className="w-5 h-5" /></button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuItem>Contact Info</DropdownMenuItem>
 <DropdownMenuItem>Clear Chat</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </>
   );
 })()}
 </div>

 {/* AI Summary Banner */}
 {chatSummary && (
   <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-200 dark:border-indigo-500/30 p-4 relative z-10 flex gap-3 items-start">
     <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
     <div className="flex-1 min-w-0">
       <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Chat Summary</h4>
       <div className="text-sm text-foreground/90 whitespace-pre-wrap">{chatSummary}</div>
     </div>
     <Button variant="ghost" size="icon" onClick={() => setChatSummary(null)} className="shrink-0 h-6 w-6"><X className="w-4 h-4"/></Button>
   </div>
 )}

 {/* Chat Messages */}
 <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 z-10">
 <div className="text-center my-2 flex justify-center">
 <span className="text-xs text-[#71717a] dark:text-gray-400 bg-[#ffeecd] dark:bg-[#182229] px-3 py-1.5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-[#ffebc6] dark:border-[#202c33] tracking-[0.04em]">
 Messages and calls are end-to-end encrypted. No one outside of this chat, not even Slate, can read or listen to them.
 </span>
 </div>

 {loadingMessages ? (
 <div className="flex justify-center p-4"><OrbitLoader size="md" /></div>
 ) : messages.map((msg, idx) => {
 const isMe = msg.sender_id === user.id;
 const showTail = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;
 const profile = participantProfiles[msg.sender_id];
 const senderName = profile?.full_name || 'User';
 const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${senderName}`;
 
 return (
 <div key={msg.id} id={`msg-${msg.id}`} className={cn("flex items-end gap-2 max-w-[85%] group", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
 {!isMe && showTail ? (
 <img src={avatarUrl} alt={senderName} className="w-7 h-7 rounded-full shrink-0 " />
 ) : (
 !isMe && <div className="w-7 shrink-0" />
 )}

 <div className={cn(
 "relative px-3 py-1.5 text-[14.5px] leading-snug rounded-xl",
 isMe 
 ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 dark:text-gray-100 rounded-tr-none" 
 : "bg-white dark:bg-card/40 dark:bg-[#202c33] text-slate-900 dark:text-slate-100 dark:text-gray-100 rounded-tl-none"
 )}>
 {msg.reply_to_id && (
 <div className="bg-primary/20 dark:bg-white dark:bg-card/40/5 border-l-4 border-primary rounded-md p-1.5 mb-1.5 text-xs opacity-80 cursor-pointer tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" onClick={() => {
 const el = document.getElementById(`msg-${msg.reply_to_id}`);
 if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center'});
}}>
 <span className="font-semibold text-primary block">{participantProfiles[messages.find(m => m.id === msg.reply_to_id)?.sender_id]?.full_name || 'User'}</span>
 <span className="truncate block max-w-[200px]">{messages.find(m => m.id === msg.reply_to_id)?.content || 'Message'}</span>
 </div>
 )}
 
 {!isMe && showTail && activeRoom?.name !== null && (
 <div className="text-[11px] font-semibold text-primary mb-0.5">{senderName}</div>
 )}

 {showTail && (
 <svg viewBox="0 0 8 13" width="8" height="13" className={cn("absolute top-0", isMe ? "-right-2 text-[#d9fdd3] dark:text-[#005c4b]" : "-left-2 text-white dark:text-[#202c33]")}>
 <path opacity="0.13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
 <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
 </svg>
 )}
 
 {msg.content.startsWith('[Attachment|') ? (
 <div className="pr-12 pt-1 pb-1">
 <div className="flex items-center gap-2 bg-primary/20 dark:bg-white dark:bg-card/40/5 p-2 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {msg.content.split('|')[3] === 'data:image' ? (
 <img src={msg.content.split('|')[2]} alt="attachment" className="max-w-[200px] rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.content.split('|')[2], '_blank')} />
 ) : msg.content.split('|')[3] === 'data:video' ? (
 <video src={msg.content.split('|')[2]} controls className="max-w-[250px] rounded-md" />
 ) : (
 <a href={msg.content.split('|')[2]} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:bg-primary/20 dark:hover:bg-white dark:bg-card/40/5 rounded-lg p-1 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <FileText className="w-8 h-8 text-primary shrink-0" />
 <div className="flex flex-col min-w-0">
 <span className="text-sm font-semibold truncate max-w-[150px] text-primary hover:underline">{msg.content.split('|')[1]}</span>
 <span className="text-xs text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{msg.content.split('|')[1]?.split('.').pop() || 'DOCUMENT'}</span>
 </div>
 </a>
 )}
 </div>
 </div>
 ) : (
 <div className="whitespace-pre-wrap pr-12">{msg.content}</div>
 )}
 
 <div className="float-right -mb-1 ml-2 text-[10px] text-[#71717a] dark:text-gray-400 flex items-center gap-2 mt-1">
 {msg.is_edited && <span className="mr-1 italic">edited</span>}
 {format(new Date(msg.created_at), 'h:mm a')}
 {isMe && (() => {
 const otherParticipants = activeRoom?.chat_participants?.filter(p => p.user_id !== user.id) || [];
 const isReadByAny = otherParticipants.some(p => p.last_read_at && new Date(p.last_read_at) >= new Date(msg.created_at));
 if (isReadByAny) return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
 return <CheckCheck className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400" />;
})()}
 </div>
 </div>
 
 {/* Message Actions */}
 <div className="opacity-40 hover:opacity-100 transition-opacity flex flex-wrap items-center gap-2 bg-white dark:bg-card/40/50 dark:bg-black/20 rounded-full px-1 py-0.5 mb-1 self-center hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <button onClick={() => setReplyTo(msg)} className="p-1 hover:bg-primary/20 rounded-full text-[#71717a] dark:text-gray-400" title="Reply">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
 </button>
 <button 
 onClick={async () => {
 const currentLikes = msg.reactions?.likes || 0;
 await (async () => {
 const _payload = {
 reactions: { ...msg.reactions, likes: currentLikes + 1}
};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`UPDATE chat_messages SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, msg.id]);
})();
 const error = null;
 if (!error) {
 setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: { ...m.reactions, likes: currentLikes + 1}} : m));
}
}} 
 className="p-1 hover:bg-primary/20 rounded-full text-[#71717a] dark:text-gray-400 flex items-center gap-0.5" 
 title="Like"
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
 {msg.reactions?.likes > 0 && <span className="text-[10px]">{msg.reactions.likes}</span>}
 </button>
 {isMe && (
 <>
 <button onClick={() => { setEditingMsg(msg); setInputValue(msg.content);}} className="p-1 hover:bg-primary/20 rounded-full text-[#71717a] dark:text-gray-400" title="Edit">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
 </button>
 <button 
 className="p-1 hover:bg-rose-100 hover:text-rose-500 rounded-full text-[#71717a] dark:text-gray-400" 
 title="Delete"
 onClick={() => {
 powerSync.execute(`DELETE FROM chat_messages WHERE id = ?`, [msg.id]).then(() => {
 setMessages(prev => prev.filter(m => m.id !== msg.id));
});
}}
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
 </button>
 </>
 )}
 </div>
 </div>
 );
})}
 <div ref={messagesEndRef} className="h-2" />
 </div>

 {(replyTo || editingMsg) && (
 <div className="px-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-primary/40 flex items-center justify-between z-10 text-sm">
 <div className="flex-1 min-w-0 border-l-4 border-primary pl-3">
 <p className="font-semibold text-primary">{editingMsg ? "Editing Message" : `Replying to ${participantProfiles[replyTo?.sender_id]?.full_name || 'User'}`}</p>
 <p className="text-[#71717a] dark:text-gray-400 truncate">{editingMsg ? editingMsg.content : replyTo?.content}</p>
 </div>
 <button onClick={() => { setReplyTo(null); setEditingMsg(null); setInputValue('');}} className="p-2 hover:bg-primary/20 rounded-full">
 <X className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
 </button>
 </div>
 )}

 {/* Input Area */}
 <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] z-10 flex items-center gap-2 border-t border-primary/40">
 <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
 <input type="file" accept="image/*" id="chat-image-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
 <input type="file" accept=".pdf,.doc,.docx,.txt" id="chat-doc-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'doc')} />
 
 <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-primary/20 shrink-0">
 <Smile className="w-6 h-6" />
 </Button>
 </PopoverTrigger>
 <PopoverContent side="top" align="start" className="w-auto p-0 border-none bg-transparent mb-2">
 <EmojiPicker onEmojiClick={(e) => setInputValue(prev => prev + e.emoji)} />
 </PopoverContent>
 </Popover>

 <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-primary/20 shrink-0">
 {isUploading ? <OrbitLoader size="md" /> : <Paperclip className="w-6 h-6" />}
 </Button>
 </PopoverTrigger>
 <PopoverContent side="top" align="start" className="w-48 p-2 mb-2 rounded-2xl flex flex-col gap-2 ">
 <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 hover:text-primary" onClick={() => document.getElementById('chat-doc-upload')?.click()}>
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary"><FileText className="w-4 h-4"/></div>
 Document
 </Button>
 <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-rose-50 hover:text-rose-600" onClick={() => document.getElementById('chat-image-upload')?.click()}>
 <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><ImageIcon className="w-4 h-4"/></div>
 Photos & Videos
 </Button>
 <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 hover:text-primary" onClick={() => fileInputRef.current?.click()}>
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary"><File className="w-4 h-4"/></div>
 File
 </Button>
 </PopoverContent>
 </Popover>
 
 <div className="flex-1 bg-white dark:bg-card/40 dark:bg-[#2a3942] rounded-xl relative flex items-center  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <input
 type="text"
 value={inputValue}
 onChange={e => setInputValue(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && handleSend()}
 placeholder="Type a message"
 className="w-full bg-transparent border-none px-4 py-2.5 text-sm focus:ring-0 focus:outline-none"
 />
 <button onClick={handleAiAssist} className="absolute right-3 p-1 text-primary hover:bg-slate-100 rounded-full transition-colors" title="AI Magic Rewrite">
 <Sparkles className="w-4 h-4" />
 </button>
 </div>
 
 <Button 
 onClick={handleSend}
 disabled={!inputValue.trim()}
 size="icon" 
 className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 shrink-0"
 >
 <Send className="w-4 h-4" />
 </Button>
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
 <div className="w-32 h-32 bg-background/50 rounded-full flex items-center justify-center mb-8 ">
 <MessageSquare className="w-12 h-12 text-[#71717a] dark:text-gray-400/30" />
 </div>
 <h2 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4 tracking-[-0.02em]">Slate Web</h2>
 <p className="text-sm text-[#8696a0] max-w-md leading-relaxed mb-8">
 Send and receive messages seamlessly without keeping your phone online.<br/>
 Use Slate Web on up to 4 linked devices and 1 phone at the same time.
 </p>
 <div className="flex items-center gap-2 text-[13px] text-[#8696a0]">
 <span className="w-3 h-3 bg-[#d9fdd3] rounded-md flex items-center justify-center"><Check className="w-2 h-2 text-[#005c4b]" /></span>
 End-to-end encrypted
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
