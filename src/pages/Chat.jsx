import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/api/supabaseClient";
import AddChatDialog from "@/components/chat/AddChatDialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function Chat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isAddChatOpen, setIsAddChatOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load Rooms
  useEffect(() => {
    if (!user?.id) return;
    loadRooms();
    
    const roomSub = supabase.channel('chat-rooms-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}` }, () => {
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
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);
        
      if (participants && participants.length > 0) {
        const roomIds = participants.map(p => p.room_id);
        const { data: roomsData } = await supabase
          .from('chat_rooms')
          .select(`*, chat_participants ( user_id, role )`)
          .in('id', roomIds)
          .order('updated_at', { ascending: false });
          
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoomId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, updated_at: new Date().toISOString() } : r));
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messageSub);
    };
  }, [activeRoomId]);

  const loadMessages = async (roomId) => {
    setLoadingMessages(true);
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
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
      const { error } = await supabase.from('chat_messages').insert({ room_id: activeRoomId, sender_id: user.id, content: text });
      if (error) throw error;
      await supabase.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', activeRoomId);
    } catch (err) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Error", description: "File exceeds 50MB limit", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const mockUrl = `[File: ${file.name}]`;
      const { error } = await supabase.from('chat_messages').insert({ room_id: activeRoomId, sender_id: user.id, content: mockUrl });
      if (error) throw error;
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiAssist = () => {
    if (!inputValue.trim()) return;
    setInputValue(`(AI Enhanced) ${inputValue}`);
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mb-6 md:-mb-0 md:-mt-0 md:rounded-xl overflow-hidden bg-background border border-border shadow-sm flex flex-col md:flex-row">
      <AddChatDialog 
        open={isAddChatOpen} 
        onOpenChange={setIsAddChatOpen} 
        onChatCreated={(room) => {
          setRooms(prev => [room, ...prev]);
          setActiveRoomId(room.id);
        }}
      />
      
      {/* Sidebar - Channels & DMs */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border bg-[#f0f2f5] dark:bg-[#202c33] flex flex-col h-[40%] md:h-full z-10 shadow-sm relative">
        <div className="p-4 bg-background dark:bg-[#202c33] border-b border-border flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
             {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <MessageSquare className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex items-center gap-1 text-[#54656f] dark:text-[#aebac1]">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-black/5" onClick={() => setIsAddChatOpen(true)}>
              <Plus className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-black/5">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-3 bg-background dark:bg-[#111b21] border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={t("search_chats", "Search or start new chat")} 
              className="w-full bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-0 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-background dark:bg-[#111b21]">
          {loadingRooms ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : rooms.map(room => (
            <div 
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors group",
                activeRoomId === room.id ? "bg-[#f0f2f5] dark:bg-[#2a3942]" : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
              )}
            >
              <div className="relative flex-shrink-0">
                {room.room_type === "group" ? (
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <UserCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 border-b border-border/50 group-last:border-none pb-3">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="text-base text-foreground truncate">{room.name || 'Direct Chat'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(room.updated_at), 'h:mm a')}</p>
                </div>
                <p className="text-sm text-muted-foreground truncate">Click to view messages...</p>
              </div>
            </div>
          ))}
          {!loadingRooms && rooms.length === 0 && (
             <div className="flex flex-col items-center justify-center p-8 h-full text-center text-muted-foreground">
               <p>No chats found.</p>
               <Button variant="link" onClick={() => setIsAddChatOpen(true)}>Start a new chat</Button>
             </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[60%] md:h-full bg-[#efeae2] dark:bg-[#0b141a] relative">
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/1-vpMpu-EPE.png')]" />

        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] z-10 shadow-sm">
              <div className="flex items-center gap-3">
                {activeRoom.room_type === "group" ? (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground leading-tight">{activeRoom.name || 'Direct Chat'}</h3>
                  <p className="text-[12px] text-muted-foreground">click here for contact info</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[#54656f] dark:text-[#aebac1]">
                <button className="hover:text-foreground transition-colors"><Search className="w-5 h-5" /></button>
                <button className="hover:text-foreground transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 z-10">
              <div className="text-center my-2 flex justify-center">
                <span className="text-xs text-muted-foreground bg-[#ffeecd] dark:bg-[#182229] px-3 py-1.5 rounded-lg shadow-sm border border-[#ffebc6] dark:border-[#202c33]">
                  Messages and calls are end-to-end encrypted. No one outside of this chat, not even Optalflow, can read or listen to them.
                </span>
              </div>

              {loadingMessages ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                const showTail = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;
                
                return (
                  <div key={msg.id} className={cn("flex items-end gap-1 max-w-[70%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <div className={cn(
                      "relative px-3 py-1.5 shadow-sm text-[14.5px] leading-snug rounded-xl",
                      isMe 
                        ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-gray-100 rounded-tr-none" 
                        : "bg-white dark:bg-[#202c33] text-slate-900 dark:text-gray-100 rounded-tl-none"
                    )}>
                      {showTail && (
                        <svg viewBox="0 0 8 13" width="8" height="13" className={cn("absolute top-0", isMe ? "-right-2 text-[#d9fdd3] dark:text-[#005c4b]" : "-left-2 text-white dark:text-[#202c33]")}>
                          <path opacity="0.13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                          <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
                        </svg>
                      )}
                      
                      <div className="whitespace-pre-wrap pr-12">{msg.content}</div>
                      
                      <div className="float-right -mb-1 ml-2 text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        {format(new Date(msg.created_at), 'h:mm a')}
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] z-10 flex items-center gap-3">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              
              <button 
                className="text-[#54656f] dark:text-[#aebac1] hover:text-foreground transition-colors shrink-0" 
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
              </button>
              
              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg relative flex items-center shadow-sm">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message"
                  className="w-full bg-transparent border-none px-4 py-2.5 text-[15px] focus:ring-0 focus:outline-none"
                />
                <button onClick={handleAiAssist} className="absolute right-3 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="AI Magic Rewrite">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              
              {inputValue.trim() ? (
                <button 
                  onClick={handleSend}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 shadow-sm shrink-0 transition-transform hover:scale-105"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              ) : (
                <button className="text-[#54656f] dark:text-[#aebac1] hover:text-foreground transition-colors shrink-0">
                  <span className="w-6 h-6 block rounded-full border-2 border-current" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
            <div className="w-32 h-32 bg-background/50 rounded-full flex items-center justify-center mb-8 shadow-sm">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4">Optalflow Web</h2>
            <p className="text-sm text-[#8696a0] max-w-md leading-relaxed mb-8">
              Send and receive messages seamlessly without keeping your phone online.<br/>
              Use Optalflow Web on up to 4 linked devices and 1 phone at the same time.
            </p>
            <div className="flex items-center gap-2 text-[13px] text-[#8696a0]">
              <span className="w-3 h-3 bg-[#d9fdd3] rounded flex items-center justify-center"><Check className="w-2 h-2 text-[#005c4b]" /></span>
              End-to-end encrypted
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
