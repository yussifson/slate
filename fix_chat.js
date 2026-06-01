const fs = require('fs');
const path = require('path');

const updateFile = (filePath, isGlobal) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Storage Upload implementation
  const uploadRegex = /const handleFileUpload = async[\s\S]*?finally {\s*setIsUploading\(false\);\s*}/;
  const newUpload = `const handleFileUpload = async (e, type = 'file') => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Error", description: "File exceeds 50MB limit", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const fileName = \`\${user.id}_\${Date.now()}_\${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}\`;
      
      // Upload to Supabase Storage (bucket: chat-attachments)
      const { data, error } = await supabase.storage.from('chat-attachments').upload(fileName, file, { upsert: true });
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(data.path);
      
      let attachmentUrl = \`[Attachment|\${file.name}|\${publicUrl}]\`;
      
      const { error: insertError } = await supabase.from('chat_messages').insert({ room_id: activeRoomId, sender_id: user.id, content: attachmentUrl });
      if (insertError) throw insertError;
      
      // Broadcast file message
      supabase.channel(\`room-\${activeRoomId}\`).send({
        type: 'broadcast',
        event: 'new-message',
        payload: { room_id: activeRoomId, sender_id: user.id, content: attachmentUrl, id: Date.now().toString(), created_at: new Date().toISOString() }
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload Failed", description: "Could not upload the file. Make sure 'chat-attachments' bucket exists and is public.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };`;
  content = content.replace(uploadRegex, newUpload);

  // 2. Real-time Broadcast and Loading logic
  const useEffectLoadMsgsRegex = /useEffect\(\(\) => \{\s*if \(\!activeRoomId\).*?removeChannel\(messageSub\);\s*};\s*}, \[activeRoomId\]\);/s;
  
  let msgLoader = `useEffect(() => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    
    ${isGlobal ? `supabase.from('chat_participants').update({ last_read_at: new Date().toISOString() }).eq('room_id', activeRoomId).eq('user_id', user.id).then();` : ''}

    const messageSub = supabase.channel(\`room-\${activeRoomId}\`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: \`room_id=eq.\${activeRoomId}\` }, (payload) => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, updated_at: new Date().toISOString() } : r));
      })
      .on('broadcast', { event: 'new-message' }, (payload) => {
        setMessages(prev => prev.find(m => m.id === payload.payload.id || (m.content === payload.payload.content && m.created_at === payload.payload.created_at)) ? prev : [...prev, payload.payload]);
        setRooms(prev => prev.map(r => r.id === activeRoomId ? { ...r, updated_at: new Date().toISOString() } : r));
      })
      .on('broadcast', { event: 'delete-message' }, (payload) => {
         setMessages(prev => prev.filter(m => m.id !== payload.payload.id));
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messageSub);
    };
  }, [activeRoomId]);`;

  content = content.replace(useEffectLoadMsgsRegex, msgLoader);

  // 3. Update handleSend to use Broadcast
  const handleSendRegex = /const handleSend = async \(\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?\}[\s\S]*?\};/;
  const newHandleSend = `const handleSend = async () => {
    if (!inputValue.trim() || !activeRoomId) return;
    const text = inputValue.trim();
    setInputValue("");
    
    // Optimistic Update
    const tempMsg = { id: 'temp-' + Date.now(), room_id: activeRoomId, sender_id: user.id, content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    
    try {
      const { data: insertedMsg, error } = await supabase.from('chat_messages').insert({ room_id: activeRoomId, sender_id: user.id, content: text }).select().single();
      if (error) throw error;
      
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? insertedMsg : m));
      
      // BROADCAST for instant cross-device updates
      supabase.channel(\`room-\${activeRoomId}\`).send({
        type: 'broadcast',
        event: 'new-message',
        payload: insertedMsg
      });
      
      await supabase.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', activeRoomId);
    } catch (err) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };`;
  content = content.replace(handleSendRegex, newHandleSend);
  
  // 4. Update the message renderer to include profiles and click events for attachments
  // Let's add state for profiles
  if (!content.includes('const [profiles, setProfiles]')) {
    const statesRegex = /const \[showAttachMenu, setShowAttachMenu\] = useState\(false\);/;
    content = content.replace(statesRegex, `const [showAttachMenu, setShowAttachMenu] = useState(false);\n  const [profiles, setProfiles] = useState({});`);
  }

  // Add loadProfiles in loadRooms
  if (!content.includes('setProfiles(profileMap)')) {
     const loadRoomsEnd = /setRooms\(roomsData \|\| \[\]\);\s*\} else \{/g;
     content = content.replace(loadRoomsEnd, `setRooms(roomsData || []);
        // Fetch profiles
        const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url');
        if (profs) {
          const profileMap = {};
          profs.forEach(p => profileMap[p.id] = p);
          setProfiles(profileMap);
        }
      } else {`);
  }
  
  // Fix the URL rendering
  const imgRegex = /<img src=\{msg.content.split\('\|'\)\[2\]\.slice\(0, -1\)\} alt="attachment"/g;
  content = content.replace(imgRegex, `<img onClick={() => window.open(msg.content.split('|')[2].slice(0, -1), '_blank')} src={msg.content.split('|')[2].slice(0, -1)} alt="attachment" className="cursor-pointer hover:opacity-90 transition-opacity`);
  
  const docRegex = /<FileText className="w-8 h-8 text-blue-500" \/>[\s\S]*?<div className="flex flex-col">[\s\S]*?<span className="text-sm font-semibold truncate max-w-\[150px\]">\{msg.content.split\('\|'\)\[1\]\}<\/span>[\s\S]*?<span className="text-xs text-muted-foreground">Document<\/span>[\s\S]*?<\/div>/g;
  content = content.replace(docRegex, `<div className="flex items-center gap-2 cursor-pointer hover:underline text-blue-600" onClick={() => window.open(msg.content.split('|')[2].slice(0, -1), '_blank')}>
                                  <FileText className="w-8 h-8 text-blue-500" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold truncate max-w-[150px]">{msg.content.split('|')[1]}</span>
                                    <span className="text-xs text-muted-foreground">Download Document</span>
                                  </div>
                                </div>`);

  // Message Avatar and Name insertion
  const msgDivRegex = /<div className=\{cn\(\s*"relative px-3 py-1\.5 shadow-sm text-\[14\.5px\] leading-snug rounded-xl",\s*isMe[\s\S]*?"bg-white dark:bg-\[#202c33\] text-slate-900 dark:text-gray-100 rounded-tl-none"\s*\)\}>/g;
  
  const msgDivReplacement = `<div className={cn(
                      "relative px-3 py-1.5 shadow-sm text-[14.5px] leading-snug rounded-xl",
                      isMe 
                        ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-gray-100 rounded-tr-none" 
                        : "bg-white dark:bg-[#202c33] text-slate-900 dark:text-gray-100 rounded-tl-none"
                    )}>
                      {(!isMe && showTail) && (
                        <div className="text-[12px] font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200">
                             {profiles[msg.sender_id]?.avatar_url ? <img src={profiles[msg.sender_id].avatar_url} className="w-full h-full object-cover"/> : <UserCircle className="w-full h-full text-slate-400"/>}
                           </div>
                           {profiles[msg.sender_id]?.full_name || 'Team Member'}
                        </div>
                      )}`;
  content = content.replace(msgDivRegex, msgDivReplacement);

  fs.writeFileSync(filePath, content);
};

updateFile(path.join(__dirname, 'src', 'pages', 'Chat.jsx'), false);
updateFile(path.join(__dirname, 'src', 'components', 'chat', 'GlobalChatPanel.jsx'), true);

console.log("Chat code patched successfully.");
