import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Hash, Plus, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SpaceChat({ spaceId }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (spaceId) {
      fetchChannels();
    }
  }, [spaceId]);

  useEffect(() => {
    let subscription;
    if (activeChannel) {
      fetchMessages();
      
      subscription = supabase
        .channel(`messages:${activeChannel.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clipad_messages', filter: `channel_id=eq.${activeChannel.id}` }, payload => {
          fetchMessages();
        })
        .subscribe();
    }
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clipad_channels')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setChannels(data);
        setActiveChannel(data[0]);
      } else {
        createChannel('general');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async (name) => {
    setCreatingChannel(true);
    try {
      const { data, error } = await supabase
        .from('clipad_channels')
        .insert({
          space_id: spaceId,
          name: name.toLowerCase().replace(/\s+/g, '-'),
          created_by: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setChannels(prev => [...prev, data]);
      if (!activeChannel) setActiveChannel(data);
      setNewChannelName('');
      setShowNewChannel(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error creating channel', variant: 'destructive' });
    } finally {
      setCreatingChannel(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeChannel) return;
    try {
      const { data, error } = await supabase
        .from('clipad_messages')
        .select('*, user:user_id(full_name, avatar_url)')
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !user) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    
    try {
      const { error } = await supabase
        .from('clipad_messages')
        .insert({
          channel_id: activeChannel.id,
          space_id: spaceId,
          user_id: user.id,
          content
        });
        
      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] border border-border rounded-2xl bg-card items-center justify-center text-muted-foreground">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border border-border rounded-2xl overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">Channels</h3>
          <button 
            onClick={() => setShowNewChannel(!showNewChannel)}
            className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {showNewChannel && (
            <div className="mb-2 p-2 bg-background rounded-xl border border-border">
              <input
                type="text"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="w-full bg-transparent text-sm text-foreground focus:outline-none mb-2"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newChannelName.trim()) {
                    createChannel(newChannelName.trim());
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowNewChannel(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => newChannelName.trim() && createChannel(newChannelName.trim())}
                  disabled={creatingChannel}
                  className="text-xs text-primary font-medium disabled:opacity-50 transition-opacity"
                >
                  Create
                </button>
              </div>
            </div>
          )}
          
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeChannel?.id === channel.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Hash className="w-4 h-4 shrink-0" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeChannel ? (
          <>
            <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur flex items-center gap-2">
              <Hash className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-bold text-foreground">{activeChannel.name}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="flex gap-4 group">
                    <img 
                      src={msg.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.user?.full_name || 'User'}`}
                      alt={msg.user?.full_name}
                      className="w-10 h-10 rounded-full bg-secondary object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">
                          {msg.user?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel.name}`}
                  className="w-full pl-4 pr-12 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 p-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select or create a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
