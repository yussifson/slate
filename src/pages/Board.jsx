import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Video, Plus, Calendar, Clock, Users, Copy, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoRoom from "@/components/video/VideoRoom";
import { useToast } from "@/components/ui/use-toast";

export default function Board() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [activeRoomUrl, setActiveRoomUrl] = useState(null);
  
  // For demonstration, use a public Daily.co room or mock. 
  // In production, this would be generated via the Daily.co REST API.
  const MOCK_DAILY_URL = "https://optalflow.daily.co/demo";

  const handleStartCall = () => {
    setActiveRoomUrl(MOCK_DAILY_URL);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(MOCK_DAILY_URL);
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard.",
    });
  };

  const mockMeetings = [
    { id: 1, title: "Daily Standup", time: "10:00 AM", attendees: 5, status: "live" },
    { id: 2, title: "Client Discovery: Acme Corp", time: "2:00 PM", attendees: 3, status: "scheduled" },
    { id: 3, title: "Design Review", time: "4:30 PM", attendees: 2, status: "scheduled" }
  ];

  if (activeRoomUrl) {
    return (
      <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mb-6 md:-mb-0 md:-mt-0">
        <VideoRoom roomUrl={activeRoomUrl} onLeave={() => setActiveRoomUrl(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-blue-600" />
            {t("custom_board", "Meeting Board")}
          </h1>
          <p className="text-muted-foreground mt-1">Start or schedule enterprise-grade video calls instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" /> Schedule Call
          </Button>
          <Button onClick={handleStartCall} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Video className="w-4 h-4" /> Start Instant Call
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active / Scheduled */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> Today's Meetings
            </h2>
            <div className="space-y-3">
              {mockMeetings.map(meeting => (
                <div key={meeting.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-background hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {meeting.status === 'live' ? (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground leading-tight">{meeting.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meeting.time}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {meeting.attendees} attendees</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex gap-2">
                    {meeting.status === 'live' ? (
                      <Button size="sm" onClick={handleStartCall} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        Join Now
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline">Edit</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" /> Orbit Meeting AI
            </h3>
            <p className="text-sm text-indigo-200 mb-4">Your AI assistant is ready to join your calls to transcribe, summarize, and extract action items.</p>
            <ul className="space-y-2 text-sm text-indigo-100">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Real-time transcription</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Post-meeting summaries</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Action item detection</li>
            </ul>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
             <h3 className="font-semibold mb-3">Quick Connect</h3>
             <p className="text-sm text-muted-foreground mb-4">Invite external clients or guests instantly without them needing an account.</p>
             <div className="flex gap-2">
               <input type="email" placeholder="guest@email.com" className="flex-1 bg-background border border-border rounded-md px-3 text-sm" />
               <Button size="sm">Invite</Button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
