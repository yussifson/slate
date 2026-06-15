import { supabase } from '@/api/supabaseClient';
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { powerSync } from "@/api/PowerSyncConnector";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Search, Users, Briefcase } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function AddChatDialog({ open, onOpenChange, onChatCreated }) {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open && companyId) {
      loadUsers();
      setSelectedUsers([]);
      setGroupName("");
      setSearch("");
    }
  }, [open, companyId]);

  const getRecordEmail = (record) =>
    (record?.user_email || record?.email || "").trim().toLowerCase();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [staffData, clientsData] = await Promise.all([
        base44.entities.StaffRecord.filter({ company_id: companyId }),
        base44.entities.Client.filter({ company_id: companyId }),
      ]);
      setStaff(staffData || []);
      setClients(clientsData || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not load team and clients.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (uId) => {
    setSelectedUsers(prev => prev.includes(uId) ? prev.filter(id => id !== uId) : [...prev, uId]);
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast({ title: "Error", description: "Select at least one participant", variant: "destructive" });
      return;
    }
    const isGroup = selectedUsers.length > 1;
    if (isGroup && !groupName.trim()) {
      toast({ title: "Error", description: "Enter a group name", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      // Check if 1on1 already exists
      if (!isGroup) {
        const targetUserId = selectedUsers[0];
        // Note: we're using staff/client id, which might not be auth.users id.
        // Wait, chat_participants requires auth.users(id). 
        // We need to map staff/client records to their profile/auth IDs.
        // Staff records should have an associated user_id or email.
      }

      // We need their user IDs for chat_participants. 
      // This logic will map them properly assuming staff/clients have a user_id or email we can find.
      // For now, let's just create the room.

      await (async () => {
        const _payload = {
        room_type: isGroup ? 'group' : 'direct',
        name: isGroup ? groupName : null,
        created_by: user.id,
        company_id: companyId
      };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        await powerSync.execute(`INSERT INTO chat_rooms (${_keys.join(', ')}) VALUES (${_keys.map(()=>'?').join(', ')})`, _vals);
      })();
      const room = null;
      const roomErr = null.select().single();

      if (roomErr) throw roomErr;

      // Add self
      await (async () => {
        const _payload = {
        room_id: room.id,
        user_id: user.id,
        role: 'admin'
      };
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _plhdr = _keys.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO chat_participants (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
      })();

      const selectedRecords = [...staff, ...clients].filter((r) => selectedUsers.includes(r.id));
      const directUserIds = [
        ...new Set(selectedRecords.map((r) => r.user_id).filter(Boolean)),
      ];
      const emails = [
        ...new Set(
          selectedRecords
            .filter((r) => !r.user_id)
            .map(getRecordEmail)
            .filter(Boolean)
        ),
      ];

      if (directUserIds.length === 0 && emails.length === 0) {
        throw new Error(
          "Selected people need an email on their profile. Team members must log in once before chat works."
        );
      }

      let profileList = [];
      if (emails.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("company_id", companyId)
          .in("email", emails);

        if (!profilesError) {
          profileList = profiles ?? [];
        } else {
          const { data: byCompany } = await supabase
            .from("profiles")
            .select("id")
            .eq("company_id", companyId);
          const emailSet = new Set(emails);
          const { data: staffMatches } = await supabase
            .from("staff_records")
            .select("user_id, user_email")
            .eq("company_id", companyId)
            .in("user_email", emails);
          profileList = (staffMatches || [])
            .filter((s) => s.user_id && emailSet.has(getRecordEmail(s)))
            .map((s) => ({ id: s.user_id }));
          if (!profileList.length && byCompany?.length) {
            console.warn("Profile email lookup failed; run latest DB migration.", profilesError);
          }
        }
      }

      const participantUserIds = [
        ...new Set([...directUserIds, ...profileList.map((p) => p.id)]),
      ];
      const participantInserts = participantUserIds.map((userId) => ({
        room_id: room.id,
        user_id: userId,
        role: "member",
      }));

      if (participantInserts.length === 0) {
        throw new Error(
          "No registered accounts found for the selected emails. They must sign in once before you can start a chat."
        );
      }

      const { error: participantsError } = await (async () => {
        const _payload = participantInserts;
        const _keys = Object.keys(_payload);
        const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const _plhdr = _keys.map(()=>'?').join(', ');
        await powerSync.execute(`INSERT INTO chat_participants (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);
      })();
      if (participantsError) throw participantsError;

      const expectedCount = selectedRecords.length;
      if (participantInserts.length < expectedCount) {
        toast({
          title: "Chat created",
          description: `${participantInserts.length} of ${expectedCount} participants added (others need to log in first).`,
        });
      } else {
        toast({ title: "Success", description: "Chat created successfully" });
      }
      onOpenChange(false);
      if (onChatCreated) onChatCreated(room);

    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const getFilteredList = (list) => {
    return list.filter(item => (item.full_name || item.name || item.first_name || '').toLowerCase().includes(search.toLowerCase()));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>Start a new conversation with your team or clients.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="staff" className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> Team</TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2"><Users className="w-4 h-4"/> Clients</TabsTrigger>
            </TabsList>
            
            <div className="h-[250px] overflow-y-auto mt-4 border rounded-md p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-1">
                  {getFilteredList(activeTab === "staff" ? staff : clients).map(item => (
                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={() => handleToggleUser(item.id)}>
                      <Checkbox checked={selectedUsers.includes(item.id)} onCheckedChange={() => handleToggleUser(item.id)} />
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                         <span className="text-xs font-bold text-primary">{(item.full_name || item.name || item.first_name || 'U')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none">{item.full_name || item.name || item.first_name}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{item.user_email || item.email || "No email"}</p>
                      </div>
                    </div>
                  ))}
                  {getFilteredList(activeTab === "staff" ? staff : clients).length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">No {activeTab} found.</div>
                  )}
                </div>
              )}
            </div>
          </Tabs>

          {selectedUsers.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <input 
                type="text" 
                placeholder="E.g., Project Alpha Team" 
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <Button 
            className="w-full" 
            disabled={selectedUsers.length === 0 || isCreating || (selectedUsers.length > 1 && !groupName.trim())}
            onClick={handleCreateChat}
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {selectedUsers.length > 1 ? "Create Group Chat" : "Start Chat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
