import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, MessageSquare } from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function DriverChatModal({ open, onOpenChange, loadId, driverName, vehicleId }) {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const { user } = useAuth();
  const companyId = useCompanyId();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && loadId && vehicleId) {
      // Find or create chat room for this load/driver
      const initChat = async () => {
        const roomRes = await powerSync.execute(
          `SELECT * FROM chat_rooms WHERE company_id = ? AND entity_id = ? AND entity_type = 'logistics_load'`,
          [companyId, loadId]
        );
        let currentRoomId;
        if (roomRes.rows?.length > 0) {
          currentRoomId = roomRes.rows._array[0].id;
        } else {
          currentRoomId = crypto.randomUUID();
          await powerSync.execute(
            `INSERT INTO chat_rooms (id, company_id, name, entity_type, entity_id, created_at, status) VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')`,
            [currentRoomId, companyId, `Load ${loadId.substring(0,6)} Chat`, 'logistics_load', loadId]
          );
        }
        setRoomId(currentRoomId);
      };
      initChat();
    } else {
      setRoomId(null);
      setMessages([]);
    }
  }, [open, loadId, vehicleId, companyId, powerSync]);

  useEffect(() => {
    if (!roomId) return;
    
    // Subscribe to messages in this room
    let isSubscribed = true;
    const fetchMessages = async () => {
      const res = await powerSync.execute(
        `SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC`,
        [roomId]
      );
      if (isSubscribed) setMessages(res.rows?._array || []);
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // Polling for simplicity, normally use watch()
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [roomId, powerSync]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId) return;
    const msg = newMessage.trim();
    setNewMessage('');
    
    try {
      await powerSync.execute(
        `INSERT INTO chat_messages (id, room_id, sender_id, company_id, content, created_at, read_status) VALUES (?, ?, ?, ?, ?, datetime('now'), 'sent')`,
        [crypto.randomUUID(), roomId, user?.id || 'dispatcher', companyId, msg]
      );
      // Optimistic update
      setMessages(prev => [...prev, {
        id: 'temp', sender_id: user?.id || 'dispatcher', content: msg, created_at: new Date().toISOString()
      }]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Chat with {driverName || 'Driver'}
          </DialogTitle>
          <DialogDescription>
            Dispatch chat for Load #{loadId?.substring(0,6)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-zinc-900/50">
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === (user?.id || 'dispatcher');
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-white dark:bg-zinc-800 border shadow-sm rounded-bl-sm'}`}>
                  {!isMe && <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Driver</div>}
                  <div className="text-sm">{msg.content}</div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
               <User className="w-8 h-8 mb-2 opacity-50" />
               <p className="text-sm">No messages yet. Say hello!</p>
             </div>
          )}
          <div ref={bottomRef} />
        </div>
        
        <div className="p-4 bg-background border-t">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              placeholder="Type a message to the driver..." 
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
