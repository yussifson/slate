import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Mail, MessageSquare, Phone, Inbox, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Import the existing modules
import EmailInbox from "./EmailInbox";
import Chat from "./Chat";
import WhatsAppMessenger from "./WhatsAppMessenger";

export default function UnifiedInbox() {
  const { t } = useTranslation();
  const [activeChannel, setActiveChannel] = useState("all");

  const channels = [
    { id: "all", label: "Unified Inbox", icon: Inbox },
    { id: "email", label: "Email", icon: Mail },
    { id: "chat", label: "Team Chat", icon: MessageSquare },
    { id: "whatsapp", label: "WhatsApp", icon: Phone },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background rounded-xl border border-border shadow-sm m-4">
      {/* Left Sidebar - Channels */}
      <div className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Communications
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 space-y-1">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">Channels</p>
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeChannel === channel.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {channel.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/50 dark:bg-slate-900/50">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
           <h2 className="font-semibold flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" />
            Communications
          </h2>
          <select 
            className="text-sm border rounded-md p-1 bg-background"
            value={activeChannel}
            onChange={(e) => setActiveChannel(e.target.value)}
          >
            {channels.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          {activeChannel === "all" && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-sm">
                <Inbox className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight">Unified Inbox</h3>
              <p className="text-muted-foreground max-w-md text-lg">
                Your entire communications hub in one place. Select a channel to get started.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-12">
                 <div onClick={() => setActiveChannel('email')} className="bg-card p-8 rounded-xl border hover:shadow-lg cursor-pointer transition-all flex flex-col items-center gap-4 hover:-translate-y-1">
                   <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                     <Mail className="w-6 h-6 text-blue-600" />
                   </div>
                   <h4 className="font-semibold text-lg">Emails</h4>
                   <p className="text-sm text-muted-foreground">Manage client emails</p>
                 </div>
                 <div onClick={() => setActiveChannel('chat')} className="bg-card p-8 rounded-xl border hover:shadow-lg cursor-pointer transition-all flex flex-col items-center gap-4 hover:-translate-y-1">
                   <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                     <MessageSquare className="w-6 h-6 text-emerald-600" />
                   </div>
                   <h4 className="font-semibold text-lg">Team Chat</h4>
                   <p className="text-sm text-muted-foreground">Internal discussions</p>
                 </div>
                 <div onClick={() => setActiveChannel('whatsapp')} className="bg-card p-8 rounded-xl border hover:shadow-lg cursor-pointer transition-all flex flex-col items-center gap-4 hover:-translate-y-1">
                   <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                     <Phone className="w-6 h-6 text-green-600" />
                   </div>
                   <h4 className="font-semibold text-lg">WhatsApp</h4>
                   <p className="text-sm text-muted-foreground">Direct client messaging</p>
                 </div>
              </div>
            </div>
          )}
          {activeChannel === "email" && <div className="h-full bg-background"><EmailInbox /></div>}
          {activeChannel === "chat" && <div className="h-full bg-background"><Chat /></div>}
          {activeChannel === "whatsapp" && <div className="h-full p-4 md:p-8 bg-background"><WhatsAppMessenger /></div>}
        </div>
      </div>
    </div>
  );
}
