import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Smile, Paperclip, MoreVertical, Search, Phone, Video, Info } from 'lucide-react';

export default function UnivMessaging() {
  const [message, setMessage] = useState('');
  
  const contacts = [
    { id: 1, name: 'Alice Johnson', role: 'Engineering', status: 'online', unread: 2 },
    { id: 2, name: 'Marketing Team', role: 'Channel', status: 'online', unread: 0 },
    { id: 3, name: 'Bob Smith', role: 'Sales', status: 'offline', unread: 0 }
  ];

  const chatHistory = [
    { id: 1, sender: 'Alice Johnson', time: '10:30 AM', text: 'Hey, did you get a chance to review the Phase 2 components?', isMe: false },
    { id: 2, sender: 'You', time: '10:35 AM', text: 'Yes, just checked them out. The DataGrid looks amazing!', isMe: true },
    { id: 3, sender: 'Alice Johnson', time: '10:38 AM', text: 'Great! I will start working on the Enterprise Suite next.', isMe: false }
  ];

  return (
    <div className="flex h-full bg-background overflow-hidden border border-border rounded-2xl shadow-sm">
      
      {/* Sidebar - Contacts List */}
      <div className="w-80 border-r border-border bg-card flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search chats..."
              className="w-full h-9 pl-9 pr-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {contacts.map(c => (
            <div key={c.id} className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${c.id === 1 ? 'bg-primary/10' : 'hover:bg-muted'}`}>
               <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                   {c.name.charAt(0)}
                 </div>
                 {c.status === 'online' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full"></div>}
               </div>
               <div className="flex-1 overflow-hidden">
                 <div className="flex justify-between items-center">
                   <h4 className="font-semibold text-sm text-foreground truncate">{c.name}</h4>
                   <span className="text-[10px] text-muted-foreground">10:38 AM</span>
                 </div>
                 <p className="text-xs text-muted-foreground truncate">{c.role}</p>
               </div>
               {c.unread > 0 && (
                 <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                   {c.unread}
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">A</div>
             <div>
               <h3 className="font-bold text-sm text-foreground">Alice Johnson</h3>
               <p className="text-xs text-emerald-500 font-medium">Online</p>
             </div>
           </div>
           <div className="flex items-center gap-3 text-muted-foreground">
             <button className="p-2 hover:bg-muted rounded-lg transition-colors"><Phone className="w-4 h-4" /></button>
             <button className="p-2 hover:bg-muted rounded-lg transition-colors"><Video className="w-4 h-4" /></button>
             <div className="w-px h-6 bg-border mx-1"></div>
             <button className="p-2 hover:bg-muted rounded-lg transition-colors"><Info className="w-4 h-4" /></button>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-background/50">
          {chatHistory.map(msg => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex flex-col max-w-[75%] ${msg.isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div className="flex items-end gap-2 mb-1">
                {!msg.isMe && <span className="text-xs font-semibold text-muted-foreground ml-1">{msg.sender}</span>}
                <span className="text-[10px] text-slate-400">{msg.time}</span>
              </div>
              <div className={`p-3.5 rounded-2xl shadow-sm text-sm ${msg.isMe ? 'bg-primary text-white rounded-br-none' : 'bg-card border border-border text-foreground rounded-bl-none'}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
             <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-5 h-5" /></button>
             <input 
               type="text" 
               placeholder="Type a message..." 
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               className="flex-1 bg-transparent border-none focus:outline-none text-sm text-foreground px-2"
             />
             <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Smile className="w-5 h-5" /></button>
             <button className={`p-2 rounded-lg transition-colors ${message.trim() ? 'bg-primary text-white' : 'bg-muted text-muted-foreground pointer-events-none'}`}>
               <Send className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
