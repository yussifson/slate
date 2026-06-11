const fs = require('fs');
const file = 'src/components/universal/UnivMessaging.jsx';
let content = fs.readFileSync(file, 'utf8');

const search = `  const fetchMessages = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*').eq('company_id', companyId)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (error) throw error;
                 <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-5 h-5" /></button>`;

const replace = `  const fetchMessages = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*').eq('company_id', companyId)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeRoomId || !currentUser) return;
    const textToSend = message.trim();
    setMessage('');
    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: activeRoomId,
        sender_id: currentUser.id,
        content: textToSend,
        company_id: companyId
      });
      if (error) throw error;
      
      // Update room updated_at timestamp
      await supabase.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', activeRoomId);
      fetchMessages(activeRoomId);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    \`\${c.email || ''} \${c.phone || ''} \${c.role || ''}\`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingContacts) {
    return (
      <div className="flex h-full items-center justify-center bg-background border border-border rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="view-header flex h-full bg-background overflow-hidden border border-border rounded-2xl shadow-sm">
      
      {/* Sidebar - Contacts List */}
      <div className="w-80 border-r border-border bg-card flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredContacts.map(c => (
            <div 
              key={c.id} 
              onClick={() => setActiveContact(c)}
              className={\`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors \${activeContact?.id === c.id ? 'bg-primary/10' : 'hover:bg-muted'}\`}
            >
               <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-bold text-muted-foreground dark:text-slate-300">
                   {(c.email || 'U').charAt(0).toUpperCase()}
                 </div>
               </div>
               <div className="flex-1 overflow-hidden">
                 <div className="flex justify-between items-center">
                   <h4 className="font-semibold text-sm text-foreground truncate">{c.email}</h4>
                 </div>
                 <p className="text-xs text-muted-foreground truncate uppercase font-bold tracking-wider">{c.role || 'Member'}</p>
               </div>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">No contacts found</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                   {(activeContact.email || 'U').charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h3 className="font-bold text-sm text-foreground truncate max-w-[200px]">{activeContact.email}</h3>
                   <p className="text-xs text-muted-foreground capitalize">{activeContact.role || 'Member'}</p>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/50 dark:bg-background/50">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.map(msg => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={\`flex flex-col max-w-[75%] \${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}\`}
                  >
                    <div className="flex items-end gap-2 mb-1">
                      {!isMe && <span className="text-xs font-semibold text-muted-foreground ml-1">{activeContact.email}</span>}
                      <span className="text-[10px] text-muted-foreground">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className={\`p-3.5 rounded-2xl shadow-sm text-sm \${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-card border border-border text-foreground rounded-bl-none'}\`}>
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })}
              {!loadingMessages && messages.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">No messages yet. Say hello!</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-border bg-card shrink-0">
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                 <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-5 h-5" /></button>`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed UnivMessaging.jsx');
} else {
  console.log('Search string not found!');
}
