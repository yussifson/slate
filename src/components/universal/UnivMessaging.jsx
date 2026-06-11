import React, { useState, useEffect, useRef } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Send, Smile, Paperclip, Search, Phone, Video, Info, Loader2, CheckCheck, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load Current User and Contacts
  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setCurrentUser(user);

        if (companyId) {
          const { data: profiles, error: profilesError } = await supabase
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoomId}` }, (payload) => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoomId]);

  const getOrCreateDirectRoom = async (contactId) => {
    // 1. Get all room IDs that the current user is in
    const { data: myRooms, error: myRoomsErr } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', currentUser.id);
    
    if (myRoomsErr) throw myRoomsErr;

    if (myRooms && myRooms.length > 0) {
      const roomIds = myRooms.map(r => r.room_id);
      
      // 2. Find rooms from these roomIds that are 'direct'
      const { data: directRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('room_type', 'direct')
        .in('id', roomIds);
      
      if (directRooms && directRooms.length > 0) {
        const directRoomIds = directRooms.map(r => r.id);
        
        // 3. Check if the contact is in any of these direct rooms
        const { data: matchingParticipants } = await supabase
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
    const { data: newRoom, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({ room_type: 'direct', company_id: companyId, created_by: currentUser.id })
      .select('id')
      .single();
      
    if (roomError) throw roomError;
    
    // Add both participants
    const { error: partError } = await supabase.from('chat_participants').insert([
      { room_id: newRoom.id, user_id: currentUser.id, role: 'member' },
      { room_id: newRoom.id, user_id: contactId, role: 'member' }
    ]);
    if (partError) throw partError;
    
    return newRoom.id;
  };

  const fetchMessages = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*').eq('company_id', companyId)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (error) throw error;
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
