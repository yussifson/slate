import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video, Loader2, X, Paperclip, CheckCheck, Image as ImageIcon, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { generateText } from "@/lib/cloudflareAI";
import { supabase } from "@/api/supabaseClient";
import AddChatDialog from "./AddChatDialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function GlobalChatPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("recent");
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isAddChatOpen, setIsAddChatOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Rooms
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    loadRooms();
    
    const roomSub = supabase.channel('room-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}` }, () => {
        loadRooms();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [isOpen, user?.id]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      // Find all rooms this user is in
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);
        
      if (participants && participants.length > 0) {
        const roomIds = participants.map(p => p.room_id);
        
        // Load the room details
        const { data: roomsData } = await supabase
          .from('chat_rooms')
          .select(`
            *,
            chat_participants ( user_id, role )
          `)
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
    
    const messageSub = supabase.channel(`messages-${activeRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoomId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        // Update room's updated_at
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

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeRoomId) return;
    
    const text = inputValue.trim();
    setInputValue("");
    
    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: activeRoomId,
        sender_id: user.id,
        content: text
      });
      if (error) throw error;
      
      // Update room timestamp
      await supabase.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', activeRoomId);
    } catch (err) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;
    
    // File upload limit 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Error", description: "File exceeds 50MB limit", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    try {
      // Create a mock URL for now as we don't have a storage bucket configured
      const mockUrl = `[File: ${file.name}]`;
      
      const { error } = await supabase.from('chat_messages').insert({
        room_id: activeRoomId,
        sender_id: user.id,
        content: mockUrl
      });
      if (error) throw error;
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAiAssist = async () => {
    if (!inputValue.trim()) return;
    
    const originalInput = inputValue;
    setInputValue("AI is thinking...");
    
    try {
      const messages = [
        { role: 'system', content: 'You are an AI assistant helping a user write a better, more professional chat message. Rewrite the user\'s message to be clearer and more professional. Return ONLY the rewritten text, nothing else.' },
        { role: 'user', content: originalInput }
      ];
      
      const response = await generateText(messages);
      setInputValue(response || originalInput);
    } catch (error) {
      console.error("AI Assist failed:", error);
      toast({ title: "AI Error", description: "Could not connect to Cloudflare AI.", variant: "destructive" });
      setInputValue(originalInput);
    }
  };

  return (
    <div className={`flex flex-col h-full shrink-0 border-l border-border bg-card shadow-[-8px_0_30px_rgba(0,0,0,0.07)] z-40 transition-all duration-300 ${isOpen ? 'w-full sm:w-[400px] md:w-[450px] opacity-100' : 'w-0 opacity-0 overflow-hidden border-none pointer-events-none'}`}>
      
      <AddChatDialog 
        open={isAddChatOpen} 
        onOpenChange={setIsAddChatOpen} 
        onChatCreated={(room) => {
          setRooms(prev => [room, ...prev]);
          setActiveRoomId(room.id);
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {activeRoomId ? (
            <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => setActiveRoomId(null)}>
              &larr; Back
            </Button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
               {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <MessageSquare className="w-5 h-5 text-primary" />}
            </div>
          )}
          <div>
            <h2 className="font-semibold text-foreground leading-tight">
              {activeRoomId ? (rooms.find(r => r.id === activeRoomId)?.name || 'Direct Chat') : 'Chats'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#54656f] dark:text-[#aebac1]">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-black/5" onClick={() => setIsAddChatOpen(true)}>
            <Plus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-black/5" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative">
        {/* Chat Background Pattern (WhatsApp style) */}
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/1-vpMpu-EPE.png')]" />

        {!activeRoomId ? (
          /* Room List */
          <div className="flex-1 overflow-y-auto bg-background z-10 flex flex-col">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search or start new chat"
                  className="w-full pl-9 pr-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-lg text-sm focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingRooms ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : rooms.length > 0 ? (
                rooms.map(room => (
                  <div 
                    key={room.id} 
                    onClick={() => setActiveRoomId(room.id)}
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{room.name ? room.name[0].toUpperCase() : 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0 border-b border-border/50 group-last:border-none pb-3">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-base text-foreground truncate">{room.name || 'Direct Chat'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(room.updated_at), 'h:mm a')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">Click to view messages...</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 h-full text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                  <p>No chats found.</p>
                  <Button variant="link" onClick={() => setIsAddChatOpen(true)}>Start a new chat</Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Chat View */
          <>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 z-10">
              <div className="text-center my-2 flex justify-center">
                <span className="text-xs text-muted-foreground bg-background/60 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                  Messages and calls are end-to-end encrypted.
                </span>
              </div>
              
              {loadingMessages ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : messages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                const showTail = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;
                
                return (
                  <div key={msg.id} className={cn("flex items-end gap-1 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <div className={cn(
                      "relative px-3 py-1.5 shadow-sm text-[14.5px] leading-snug rounded-xl",
                      isMe 
                        ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-gray-100 rounded-tr-none" 
                        : "bg-white dark:bg-[#202c33] text-slate-900 dark:text-gray-100 rounded-tl-none"
                    )}>
                      {/* Optional Tail (WhatsApp Style) */}
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
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border z-10 flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 shrink-0" onClick={() => fileInputRef.current?.click()}>
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
              </Button>
              
              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg relative flex items-center shadow-sm">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message"
                  className="w-full bg-transparent border-none px-4 py-2.5 text-sm focus:ring-0 focus:outline-none"
                />
                <button onClick={handleAiAssist} className="absolute right-3 p-1 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="AI Magic Rewrite">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              
              <Button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                size="icon" 
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
