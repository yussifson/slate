import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect, useRef} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase} from '@/api/supabaseClient';
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Send, Smile, Paperclip, Search, Phone, Video, Info, Loader2} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function UnivMessaging() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');
 const [currentUser, setCurrentUser] = useState(null);
 const [contacts, setContacts] = useState([]);
 const [activeContact, setActiveContact] = useState(null);
 const [activeRoomId, setActiveRoomId] = useState(null);
 const [messages, setMessages] = useState([]);
 const [message, setMessage] = useState('');
 const [loadingContacts, setLoadingContacts] = useState(true);
 const [loadingMessages, setLoadingMessages] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 
 const messagesEndRef = useRef(null);

 // Scroll to bottom of chat
 useEffect(() => {
 if (messagesEndRef.current) {
 messagesEndRef.current.scrollIntoView({ behavior: 'smooth'});
}
}, [messages]);

 // Load Current User and Contacts
 useEffect(() => {
 async function init() {
 try {
 const { data: { user}, error: userError} = await supabase.auth.getUser();
 if (userError) throw userError;
 setCurrentUser(user);

 if (companyId) {
 const { data: profiles, error: profilesError} = await supabase
 .from('profiles')
 .select('*').eq('company_id', companyId)
 .eq('company_id', companyId);
 if (profilesError) throw profilesError;

 // Exclude current user from contact list
 const list = (profiles || []).filter(p => p.id !== user.id);
 setContacts(list);
 if (list.length > 0) {
 setActiveContact(list[0]);
}
}
} catch (err) {
 console.error(err);
} finally {
 setLoadingContacts(false);
}
}
 init();
}, [companyId]);

 // Load active chat room when contact changes
 useEffect(() => {
 if (!currentUser || !activeContact) return;
 
 async function loadRoom() {
 setLoadingMessages(true);
 try {
 // Find or create direct room
 const roomId = await getOrCreateDirectRoom(activeContact.id);
 setActiveRoomId(roomId);
 await fetchMessages(roomId);
} catch (err) {
 console.error(err);
 toast.error('Failed to load chat room');
} finally {
 setLoadingMessages(false);
}
}
 loadRoom();
}, [activeContact, currentUser]);

 // Real-time message subscription
 useEffect(() => {
 if (!activeRoomId) return;

 const channel = supabase.channel(`univ-messaging-${activeRoomId}`)
 .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoomId}`}, (payload) => {
 setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
})
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
};
}, [activeRoomId]);

 const getOrCreateDirectRoom = async (contactId) => {
 // 1. Get all room IDs that the current user is in
 const { data: myRooms, error: myRoomsErr} = await supabase
 .from('chat_participants')
 .select('room_id')
 .eq('user_id', currentUser.id);
 
 if (myRoomsErr) throw myRoomsErr;

 if (myRooms && myRooms.length > 0) {
 const roomIds = myRooms.map(r => r.room_id);
 
 // 2. Find rooms from these roomIds that are 'direct'
 const { data: directRooms} = await supabase
 .from('chat_rooms')
 .select('id')
 .eq('room_type', 'direct')
 .in('id', roomIds);
 
 if (directRooms && directRooms.length > 0) {
 const directRoomIds = directRooms.map(r => r.id);
 
 // 3. Check if the contact is in any of these direct rooms
 const { data: matchingParticipants} = await supabase
 .from('chat_participants')
 .select('room_id')
 .eq('user_id', contactId)
 .in('room_id', directRoomIds);
 
 if (matchingParticipants && matchingParticipants.length > 0) {
 return matchingParticipants[0].room_id;
}
}
}
 
 // Create a new direct room
 await (async () => {
 const _p = { room_type: 'direct', id: crypto.randomUUID(), company_id: companyId, created_by: currentUser.id}; window.__tmpRoomId = _p.id;
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO chat_rooms (${_k.join(',')}) VALUES (${_k.map(()=>'?').join(',')})`, _v); return { error: null};})();
 const newRoom = { id: window.__tmpRoomId};
 const roomError = null;
 
 if (roomError) throw roomError;
 
 // Add both participants
 await (async () => {
 const p1 = { room_id: newRoom.id, user_id: currentUser.id, role: 'member'};
 const p2 = { room_id: newRoom.id, user_id: contactId, role: 'member'};
 const _k = Object.keys(p1);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO chat_participants (${_k.join(',')}) VALUES (${_pl})`, Object.values(p1));
 await powerSync.execute(`INSERT INTO chat_participants (${_k.join(',')}) VALUES (${_pl})`, Object.values(p2));
})();
 const partError = null;
 if (partError) throw partError;
 
 return newRoom.id;
};

 const fetchMessages = async (roomId) => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM chat_messages WHERE company_id = ? AND room_id = ? ORDER BY created_at ASC`, [companyId, roomId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
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
 await (async () => {
 const _p = { room_id: activeRoomId, sender_id: currentUser.id, content: textToSend};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 await powerSync.execute(`INSERT INTO chat_messages (${_k.join(',')}) VALUES (${_k.map(()=>'?').join(',')})`, _v); return { error: null};})();
 const error = null;
 if (error) throw error;
 
 // Update room updated_at timestamp
 await powerSync.execute(`UPDATE chat_rooms SET updated_at = ? WHERE id = ?`, [new Date().toISOString(), activeRoomId]);
 fetchMessages(activeRoomId);
} catch (err) {
 console.error(err);
 toast.error('Failed to send message');
}
};

 const filteredContacts = contacts.filter(c => 
 `${c.email || ''} ${c.phone || ''} ${c.role || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 if (loadingContacts) {
 return (
 <div className="flex h-full items-center justify-center bg-background border border-border rounded-2xl ${view !== 'Default' ? 'hide-default' : ''}">
 <Loader2 className="w-8 h-8 animate-spin text-primary" />
 </div>
 );
}

 return (
 <div className="view-header flex h-full bg-background overflow-hidden border border-border rounded-2xl ">
 
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
 className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${activeContact?.id === c.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
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
 initial={{ opacity: 0, y: 10}}
 animate={{ opacity: 1, y: 0}}
 key={msg.id} 
 className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
 >
 <div className="flex items-end gap-2 mb-1">
 {!isMe && <span className="text-xs font-semibold text-muted-foreground ml-1">{activeContact.email}</span>}
 <span className="text-[10px] text-muted-foreground">
 {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : ''}
 </span>
 </div>
 <div className={`p-3.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-card border border-border text-foreground rounded-bl-none'}`}>
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
 <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-5 h-5" /></button>
 <input 
 type="text" 
 placeholder="Type a message..." 
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 className="flex-1 bg-transparent border-none focus:outline-none text-sm text-foreground px-2"
 />
 <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Smile className="w-5 h-5" /></button>
 <button type="submit" className={`p-2 rounded-lg transition-colors ${message.trim() ? 'bg-primary text-white' : 'bg-muted text-muted-foreground pointer-events-none'}`}>
 <Send className="w-4 h-4" />
 </button>
 </div>
 </form>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
 <p className="text-base font-medium">Select a contact to start chatting</p>
 </div>
 )}
 </div>
 </div>
 );
}
