const fs = require('fs');

let content = fs.readFileSync('src/components/chat/GlobalChatPanel.jsx', 'utf8');

// Add Emoji Picker and Popover imports
content = content.replace(
  'import { Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video, Loader2, X, Paperclip, CheckCheck, Image as ImageIcon, FileText, Check } from "lucide-react";',
  'import { Search, Plus, MessageSquare, MoreVertical, Send, Sparkles, Hash, Users, UserCircle, Phone, Video, Loader2, X, Paperclip, CheckCheck, Image as ImageIcon, FileText, Check, Smile, File } from "lucide-react";\nimport EmojiPicker from "emoji-picker-react";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";'
);

// Update loadRooms to include last_read_at in select
content = content.replace(
  'chat_participants ( user_id, role )',
  'chat_participants ( user_id, role, last_read_at )'
);

// Update Realtime subscription to remove filter and update last_read_at
content = content.replace(
  /const messageSub = supabase\.channel\(`messages-\$\{activeRoomId\}`\)\s*\.on\('postgres_changes', \{ event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq\.\$\{activeRoomId\}` \}, \(payload\) => \{\s*setMessages\(prev => \[\.\.\.prev, payload\.new\]\);\s*\/\/ Update room's updated_at\s*setRooms\(prev => prev\.map\(r => r\.id === activeRoomId \? \{ \.\.\.r, updated_at: new Date\(\)\.toISOString\(\) \} : r\)\);\s*\}\)\s*\.subscribe\(\);/,
  `// Update last_read_at when opening room
    supabase.from('chat_participants').update({ last_read_at: new Date().toISOString() })
      .eq('room_id', activeRoomId).eq('user_id', user.id).then();

    const messageSub = supabase.channel(\`messages-\${activeRoomId}\`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (payload.new.room_id === activeRoomId) {
          setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          // Mark as read immediately if we are in the room
          if (payload.new.sender_id !== user.id) {
            supabase.from('chat_participants').update({ last_read_at: new Date().toISOString() })
              .eq('room_id', activeRoomId).eq('user_id', user.id).then();
          }
        }
        setRooms(prev => prev.map(r => r.id === payload.new.room_id ? { ...r, updated_at: new Date().toISOString() } : r));
      })
      .subscribe();`
);

// Add state for emoji/attachment
content = content.replace(
  'const [isUploading, setIsUploading] = useState(false);',
  'const [isUploading, setIsUploading] = useState(false);\n  const [showEmojiPicker, setShowEmojiPicker] = useState(false);\n  const [showAttachMenu, setShowAttachMenu] = useState(false);'
);

// Update handleFileUpload to base64 encoding
content = content.replace(
  /const handleFileUpload = async \(e\) => \{[\s\S]*?\}\s*const handleAiAssist/,
  `const handleFileUpload = async (e, type = 'file') => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;
    
    // File upload limit 5MB for base64
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File exceeds 5MB limit", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        const mockUrl = \`[Attachment|\${file.name}|\${base64data}]\`;
        
        const { error } = await supabase.from('chat_messages').insert({
          room_id: activeRoomId,
          sender_id: user.id,
          content: mockUrl
        });
        if (error) throw error;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setShowAttachMenu(false);
    }
  };

  const handleAiAssist`
);

// Render Messages Content logic
content = content.replace(
  '<div className="whitespace-pre-wrap pr-12">{msg.content}</div>',
  `{msg.content.startsWith('[Attachment|') ? (
                          <div className="pr-12 pt-1 pb-1">
                            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                              {msg.content.split('|')[2].startsWith('data:image') ? (
                                <img src={msg.content.split('|')[2].slice(0, -1)} alt="attachment" className="max-w-[200px] rounded object-cover" />
                              ) : (
                                <>
                                  <FileText className="w-8 h-8 text-blue-500" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold truncate max-w-[150px]">{msg.content.split('|')[1]}</span>
                                    <span className="text-xs text-muted-foreground">Document</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap pr-12">{msg.content}</div>
                        )}`
);

// Update render checks
content = content.replace(
  '{isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}',
  `{isMe && (() => {
                          const room = rooms.find(r => r.id === activeRoomId);
                          if (!room) return <Check className="w-3.5 h-3.5" />;
                          const otherParticipants = room.chat_participants?.filter(p => p.user_id !== user.id) || [];
                          const isReadByAny = otherParticipants.some(p => p.last_read_at && new Date(p.last_read_at) >= new Date(msg.created_at));
                          if (isReadByAny) return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
                          return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
                        })()}`
);

// Update input area (Emoji picker and Attachment Popover)
content = content.replace(
  /<div className="px-4 py-3 bg-\[#f0f2f5\] dark:bg-\[#202c33\] border-t border-border z-10 flex items-center gap-2">[\s\S]*?<Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-\[#54656f\] dark:text-\[#aebac1\] hover:bg-black\/5 shrink-0" onClick=\{\(\) => fileInputRef.current\?\.click\(\)\}>/,
  `<div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border z-10 flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
              <input type="file" accept="image/*" id="chat-image-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
              <input type="file" accept=".pdf,.doc,.docx,.txt" id="chat-doc-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'doc')} />
              
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 shrink-0">
                    <Smile className="w-6 h-6" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-0 border-none bg-transparent shadow-none mb-2">
                  <EmojiPicker onEmojiClick={(e) => setInputValue(prev => prev + e.emoji)} />
                </PopoverContent>
              </Popover>

              <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 shrink-0">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-48 p-2 mb-2 rounded-2xl flex flex-col gap-1 shadow-xl">
                   <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-blue-50 hover:text-blue-600" onClick={() => document.getElementById('chat-doc-upload')?.click()}>
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><FileText className="w-4 h-4"/></div>
                     Document
                   </Button>
                   <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-rose-50 hover:text-rose-600" onClick={() => document.getElementById('chat-image-upload')?.click()}>
                     <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><ImageIcon className="w-4 h-4"/></div>
                     Photos & Videos
                   </Button>
                   <Button variant="ghost" className="justify-start gap-3 w-full rounded-xl hover:bg-violet-50 hover:text-violet-600" onClick={() => fileInputRef.current?.click()}>
                     <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600"><File className="w-4 h-4"/></div>
                     File
                   </Button>
                </PopoverContent>
              </Popover>`
);

// Fix AI Assist context
content = content.replace(
  /const messages = \[\s*\{ role: 'system', content: 'You are an AI assistant helping a user write a better, more professional chat message\. Rewrite the user\\'s message to be clearer and more professional\. Return ONLY the rewritten text, nothing else\.' \},\s*\{ role: 'user', content: originalInput \}\s*\];/,
  `// Provide recent chat history for context if available
      const chatHistory = messages.slice(-5).map(m => \`\${m.sender_id === user.id ? 'Me' : 'Them'}: \${m.content}\`).join('\\n');
      const messagesPayload = [
        { role: 'system', content: \`You are an AI assistant embedded in a chat app. Your job is to rewrite the user's DRAFT message to be clearer, more professional, and contextually appropriate based on the recent chat history. Return ONLY the rewritten text.\\n\\nRecent Chat History:\\n\${chatHistory}\` },
        { role: 'user', content: originalInput }
      ];`
);

content = content.replace('generateText(messages)', 'generateText(messagesPayload)');

fs.writeFileSync('src/components/chat/GlobalChatPanel.jsx', content);
console.log('Done rewriting GlobalChatPanel.jsx');
