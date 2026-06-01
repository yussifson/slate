import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text: inputValue, senderId: user.id, isAi: false }]);
    setInputValue("");
  };

  const handleAiAssist = () => {
    if (!inputValue.trim()) return;
    setInputValue(`(AI Enhanced) ${inputValue}`);
  };

  // Mock list
  const recentChats = [
    { id: 1, name: "General Team", type: "group", lastMsg: "Let's review the new feature.", time: "10:30 AM", unread: 2 },
    { id: 2, name: "Alice Johnson", type: "direct", lastMsg: "Can you send the report?", time: "Yesterday", unread: 0 },
    { id: 3, name: "Marketing Campaign", type: "group", lastMsg: "Looks good to me.", time: "Tue", unread: 0 },
  ];

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mb-6 md:-mb-0 md:-mt-0 md:rounded-xl overflow-hidden bg-background border border-border shadow-sm flex flex-col md:flex-row">
      
      {/* Sidebar - Channels & DMs */}
      <div className="w-full md:w-72 lg:w-80 flex-shrink-0 border-r border-border bg-card/50 flex flex-col h-[40%] md:h-full">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> 
            {t("chat", "Chat")}
          </h2>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={t("search_chats", "Search messages...")} 
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Recent</h3>
            <div className="space-y-1">
              {recentChats.map(chat => (
                <button 
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors group",
                    activeChat?.id === chat.id ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-muted"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    {chat.type === "group" ? (
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    )}
                    {chat.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm font-medium truncate", activeChat?.id === chat.id ? "text-blue-700 dark:text-blue-400" : "text-foreground")}>{chat.name}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{chat.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMsg}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-[60%] md:h-full bg-background relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                {activeChat.type === "group" ? (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{activeChat.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{activeChat.type === "group" ? "3 members" : "Online"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                  <Video className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1"></div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="text-center my-4">
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  Today
                </span>
              </div>
              
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-primary">AJ</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground ml-1">Alice Johnson · 10:25 AM</span>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm text-sm text-foreground">
                    Hey everyone, checking in on the latest updates. Did we finalize the video integration?
                  </div>
                </div>
              </div>

              {messages.map(msg => (
                <div key={msg.id} className={cn("flex items-start gap-3 max-w-[80%]", msg.senderId === user.id ? "ml-auto flex-row-reverse" : "")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                    msg.senderId === user.id ? "bg-blue-600" : "bg-primary/20"
                  )}>
                     <span className={cn("text-xs font-bold", msg.senderId === user.id ? "text-white" : "text-primary")}>
                       {msg.senderId === user.id ? (user?.full_name?.[0] || 'U').toUpperCase() : 'U'}
                     </span>
                  </div>
                  <div className={cn("flex flex-col gap-1", msg.senderId === user.id ? "items-end" : "items-start")}>
                    <span className="text-[11px] text-muted-foreground mx-1">
                      {msg.senderId === user.id ? "You" : "User"} · Just now
                    </span>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 shadow-sm text-sm",
                      msg.senderId === user.id 
                        ? "bg-blue-600 text-white rounded-tr-sm" 
                        : "bg-card border border-border text-foreground rounded-tl-sm"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background">
              <div className="bg-muted border border-border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-xl flex items-center p-2 transition-all">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0">
                  <Plus className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative mx-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={t("type_a_message", "Type your message here...")}
                    className="w-full bg-transparent border-none focus:outline-none text-sm py-2 placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={handleAiAssist}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group mr-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
                    <span className="hidden sm:inline">AI Magic</span>
                  </button>
                  <Button 
                    onClick={handleSend}
                    size="icon" 
                    className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-transform hover:scale-105"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <MessageSquare className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Team Chat</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Select a conversation from the sidebar to start messaging, or create a new one to connect with your team or clients.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              <Plus className="w-4 h-4 mr-2" /> Start New Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
