import { jsx, jsxs } from "react/jsx-runtime";
import { supabase } from "@/api/supabaseClient";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Video, Plus, Calendar, Clock, Users, Copy, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoRoom from "@/components/video/VideoRoom";
import ScheduleMeetingDialog from "@/components/video/ScheduleMeetingDialog";
import { useToast } from "@/components/ui/use-toast";
import { powerSync } from "@/api/PowerSyncConnector";
import { useAuth } from "@/lib/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { format } from "date-fns";
import { useVideo } from "@/lib/VideoContext";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { generateShortId } from "@/utils/idGenerator";
export default function Board() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, isPortalUser } = useAuth();
  const companyId = useCompanyId();
  const { activeRoomUrl, joinRoom } = useVideo();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [quickConnectEmail, setQuickConnectEmail] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const handleQuickConnect = async () => {
    if (!quickConnectEmail.trim()) {
      toast({ title: "Error", description: "Please enter an email address.", variant: "destructive" });
      return;
    }
    let urlToShare = activeRoomUrl;
    if (!urlToShare) {
      urlToShare = await handleStartCall();
    }
    if (!urlToShare) return;
    navigator.clipboard.writeText(urlToShare);
    const subject = encodeURIComponent("You're invited to a secure video meeting");
    const body = encodeURIComponent(`Please join my video meeting here:
${urlToShare}

No account is required. When you click the link, just type your name to join!`);
    window.location.href = `mailto:${quickConnectEmail}?subject=${subject}&body=${body}`;
    toast({ title: "Email Client Opened", description: `Link copied to clipboard and drafted for ${quickConnectEmail}.` });
    setQuickConnectEmail("");
  };
  const getRoomUrl = (id) => `https://meet.ffmuc.net/slate-${companyId}-${id.slice(0, 8)}`;
  useEffect(() => {
    if (companyId === void 0) return;
    loadRooms();
    const roomSub = supabase.channel("video-rooms").on("postgres_changes", { event: "*", schema: "public", table: "video_rooms", filter: `company_id=eq.${companyId}` }, () => {
      loadRooms();
    }).subscribe();
    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [companyId]);
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const data = await powerSync.getAll("SELECT * FROM video_rooms WHERE company_id = ? ORDER BY created_at DESC", [companyId]);
      let visibleRooms = data || [];
      if (isPortalUser) {
        visibleRooms = visibleRooms.filter((room) => {
          if (!room.participants) return false;
          try {
            const participants = JSON.parse(room.participants);
            return participants.some((p) => p.id === user?.id || p.email === user?.email);
          } catch (e) {
            return false;
          }
        });
      }
      setRooms(visibleRooms);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleStartCall = async () => {
    setIsCreating(true);
    try {
      const dbId = crypto.randomUUID();
      const shortId = generateShortId();
      let dailyData = null;
      try {
        const { data, error: functionError } = await supabase.functions.invoke("create-daily-room", {
          body: { dbId, roomName: shortId, companyId }
        });
        if (!functionError && data && (data.name || data.url)) dailyData = data;
      } catch (_) {
      }
      const roomName = dailyData?.name || shortId;
      const realUrl = dailyData?.url || `https://optavel.daily.co/${roomName}`;
      let meetingDomain = window.location.hostname;
      if (meetingDomain.includes("localhost") || meetingDomain.includes("127.0.0.1")) {
        meetingDomain = `meet.localhost`;
      } else if (meetingDomain.includes("optavel.com")) {
        meetingDomain = `clipad.optavel.com`;
      } else if (meetingDomain.includes("oatstack.com")) {
        meetingDomain = `meet.oatstack.com`;
      } else {
        meetingDomain = `meet.${meetingDomain}`;
      }
      const customMeetingOrigin = `${window.location.protocol}//${meetingDomain}${window.location.port ? ":" + window.location.port : ""}`;
      const _payload = {
        id: dbId,
        company_id: companyId,
        title: `${user?.full_name?.split(" ")[0] || "User"}'s Instant Meeting`,
        daily_room_url: realUrl,
        daily_room_name: roomName,
        host_id: user.id,
        status: "active",
        meeting_link: `${customMeetingOrigin}/join/${roomName}`
      };
      try {
        const { error: dbError } = await supabase.from("video_rooms").upsert(_payload);
        if (dbError) {
          const _keys = Object.keys(_payload);
          const _vals = Object.values(_payload).map((v) => typeof v === "object" && v !== null ? JSON.stringify(v) : v);
          await powerSync.execute(`INSERT INTO video_rooms (${_keys.join(", ")}) VALUES (${_keys.map(() => "?").join(", ")})`, _vals);
        }
      } catch (_) {
      }
      joinRoom(realUrl);
      return realUrl;
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to start call", variant: "destructive" });
      return null;
    } finally {
      setIsCreating(false);
    }
  };
  const joinCall = (item) => {
    const url = typeof item === "string" ? item : item?.daily_room_url || item?.meeting_link;
    if (url) joinRoom(url);
  };
  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard."
    });
  };
  if (activeRoomUrl) {
    return /* @__PURE__ */ jsx("div", { className: "h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] -mt-4 -mb-6 md:-mb-0 md:-mt-0" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 school-page-enter font-dmsans", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2 tracking-[-0.02em]", children: [
          /* @__PURE__ */ jsx(LayoutGrid, { className: "w-6 h-6 text-primary" }),
          t("custom_board", "Meeting Board")
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[#71717a] dark:text-gray-400 mt-1", children: "Start or schedule enterprise-grade video calls instantly." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", onClick: () => setIsScheduleOpen(true), children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
          " Schedule Call"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleStartCall, disabled: isCreating, className: "gap-2 ", children: [
          isCreating ? /* @__PURE__ */ jsx(OrbitLoader, { size: "sm" }) : /* @__PURE__ */ jsx(Video, { className: "w-4 h-4" }),
          "Start Instant Call"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-card/60 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl p-6 transition-all duration-300", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold mb-5 flex items-center gap-2 text-foreground", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-primary" }),
          " Recent & Active Meetings"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center p-8", children: /* @__PURE__ */ jsx(OrbitLoader, { size: "md" }) }) : rooms.length > 0 ? rooms.map((room) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-md transition-all duration-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "mt-1", children: room.status === "active" ? /* @__PURE__ */ jsxs("span", { className: "flex h-3 w-3 relative", children: [
              /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" }),
              /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-3 w-3 bg-red-500/10" })
            ] }) : /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-primary/20 border-[0.5px] border-black/9 dark:border-white/8 border-primary" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground leading-tight", children: room.title }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-1.5 text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                  " ",
                  format(new Date(room.created_at), "MMM d, h:mm a")
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-3 h-3" }),
                  " Room ID: ",
                  room.id.slice(0, 6)
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 sm:mt-0 flex gap-2", children: [
            room.status === "active" ? /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => joinCall(room), className: "gap-2 bg-orange-500 hover:bg-orange-600 text-white", children: "Join Now" }) : /* @__PURE__ */ jsx("span", { className: "text-xs font-medium px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground flex items-center", children: "Ended" }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => copyLink(room.meeting_link || room.daily_room_url), children: /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }) })
          ] })
        ] }, room.id)) : /* @__PURE__ */ jsx("div", { className: "text-center text-[#71717a] dark:text-gray-400 p-8", children: "No meetings found. Start an instant call above!" }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-5 text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-lg mb-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-white/70" }),
            " Orbit Meeting AI"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-white/80 mb-4", children: "Your AI assistant is ready to join your calls to transcribe, summarize, and extract action items." }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-white/90", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white/60" }),
              " Real-time transcription"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white/60" }),
              " Post-meeting summaries"
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white/60" }),
              " Action item detection"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-3", children: "Quick Connect" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-[#71717a] dark:text-gray-400 mb-4", children: "Invite external clients or guests instantly without them needing an account." }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                placeholder: "guest@email.com",
                className: "flex-1 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-lg px-3 text-sm focus:outline-none focus:border-primary",
                value: quickConnectEmail,
                onChange: (e) => setQuickConnectEmail(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && handleQuickConnect()
              }
            ),
            /* @__PURE__ */ jsx(Button, { size: "sm", onClick: handleQuickConnect, disabled: isCreating, children: "Invite" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ScheduleMeetingDialog, { open: isScheduleOpen, onOpenChange: setIsScheduleOpen, onScheduled: loadRooms })
  ] });
}
