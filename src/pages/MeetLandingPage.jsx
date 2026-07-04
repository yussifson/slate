import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { Video, Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Plus, Link as LinkIcon, ChevronLeft, ChevronRight, Calendar, ShieldCheck, Users } from 'lucide-react';

// ─── Carousel Slides ─────────────────────────────────────────────────────────
// Each slide has a render function (not static JSX) so they re-render correctly
const slides = [
  {
    id: 0,
    title: 'Get a link you can share',
    description: 'Click New meeting to get a link you can send to people you want to meet with',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        {/* Outer ring */}
        <div className="absolute w-64 h-64 rounded-full border-2 border-blue-100 dark:border-blue-900/40 animate-pulse" />
        {/* Mid ring */}
        <div className="absolute w-44 h-44 rounded-full bg-blue-50 dark:bg-blue-900/20" />
        {/* Inner glowing circle */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-2xl shadow-blue-500/40">
          <LinkIcon className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        {/* Floating badges */}
        <div className="absolute top-6 right-10 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/30 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">Link Ready</span>
        </div>
        <div className="absolute bottom-10 left-6 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/30 rounded-xl px-3 py-1.5 shadow-lg">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">meet.optavel.com/join/...</span>
        </div>
      </div>
    ),
  },
  {
    id: 1,
    title: 'Plan ahead',
    description: 'Click New meeting to schedule meetings for later, then share the link before your event.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        {/* Outer ring */}
        <div className="absolute w-64 h-64 rounded-full border-2 border-emerald-100 dark:border-emerald-900/40 animate-pulse" />
        {/* Mid ring */}
        <div className="absolute w-44 h-44 rounded-full bg-emerald-50 dark:bg-emerald-900/20" />
        {/* Calendar icon circle */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
          <Calendar className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        {/* Floating time badge */}
        <div className="absolute top-4 right-8 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
          <Calendar className="w-3 h-3 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Scheduled</span>
        </div>
        <div className="absolute bottom-8 left-4 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 rounded-xl px-3 py-2 shadow-lg text-center">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Reminder sent</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">10:00 AM · Mon</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Your meeting is safe',
    description: 'No one can join unless invited or admitted by the host. End-to-end encrypted.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        {/* Outer ring */}
        <div className="absolute w-64 h-64 rounded-full border-2 border-primary/10 animate-pulse" />
        {/* Mid ring */}
        <div className="absolute w-44 h-44 rounded-full bg-primary/5" />
        {/* Shield icon circle */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/40">
          <ShieldCheck className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        {/* Avatars below */}
        <div className="absolute bottom-6 flex -space-x-3">
          {['bg-blue-400', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'].map((c, i) => (
            <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-white dark:border-slate-900 flex items-center justify-center`}>
              <Users className="w-4 h-4 text-white" />
            </div>
          ))}
        </div>
        {/* Encrypted badge */}
        <div className="absolute top-4 right-6 bg-white dark:bg-slate-800 border border-primary/20 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span className="text-xs font-semibold text-primary">End-to-end</span>
        </div>
      </div>
    ),
  },
];

// ─── Live Clock Hook ──────────────────────────────────────────────────────────
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function MeetLandingPage() {
  const [meetingCode, setMeetingCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [laterLink, setLaterLink] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const now = useLiveClock();

  // Auto-advance carousel every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const handleCreateMeeting = async (type) => {
    setIsCreating(true);
    try {
      const roomId = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { roomName: roomId, privacy: 'public' },
      });
      if (error) throw error;

      if (type === 'instant') {
        navigate(`/join/${roomId}`);
      } else {
        const { protocol, hostname, port } = window.location;
        setLaterLink(`${protocol}//${hostname}${port ? ':' + port : ''}/join/${roomId}`);
        setIsDialogOpen(true);
      }
    } catch (err) {
      console.error('Failed to create meeting:', err);
      toast({ title: 'Error', description: 'Could not create a new meeting. Try again.', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    let roomId = meetingCode.trim();
    if (roomId.includes('/join/')) roomId = roomId.split('/join/')[1];
    navigate(`/join/${roomId}`);
  };

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-white dark:bg-[#090E17] flex flex-col font-sans">
      <Helmet>
        <title>Optavel Meet — Free HD Video Meetings for Teams</title>
        <meta name="description" content="Optavel Meet is a free, secure, enterprise-grade video conferencing platform. Start or join HD video meetings instantly — no downloads required. Trusted by teams worldwide." />
        <meta name="keywords" content="Optavel Meet, video meeting, online video call, video conferencing, free video call, HD video call, team meeting, virtual meeting, enterprise video, secure video call, Google Meet alternative, Zoom alternative" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Optavel" />
        <link rel="canonical" href="https://meet.optavel.com/" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://meet.optavel.com/" />
        <meta property="og:title" content="Optavel Meet — Free HD Video Meetings for Teams" />
        <meta property="og:description" content="Start or join a free HD video meeting in seconds. Secure, enterprise-grade video conferencing by Optavel — no downloads, no friction." />
        <meta property="og:site_name" content="Optavel Meet" />
        <meta property="og:locale" content="en_US" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Optavel Meet — Free HD Video Meetings for Teams" />
        <meta name="twitter:description" content="Start or join a free HD video meeting in seconds. Secure, enterprise-grade video conferencing by Optavel — no downloads, no friction." />
        <meta name="twitter:site" content="@optavel" />
        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Optavel Meet",
          "url": "https://meet.optavel.com",
          "description": "Free, secure, enterprise-grade HD video conferencing. Start or join meetings instantly — no downloads required.",
          "applicationCategory": "CommunicationApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "provider": { "@type": "Organization", "name": "Optavel", "url": "https://optavel.com" }
        })}</script>
      </Helmet>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Optavel Meet</span>
        </div>
        {/* Live real-time clock */}
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          <span>{timeStr}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>{dateStr}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-12 md:gap-16 max-w-7xl mx-auto w-full">
        {/* Left Side */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-normal text-slate-800 dark:text-slate-100 leading-tight">
            Premium video meetings.<br />Now free for everyone.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            We re-engineered the service we built for secure business meetings, Optavel Meet, to make it free and available for all.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  disabled={isCreating}
                  className="w-full sm:w-auto h-12 px-6 gap-2 text-base rounded-xl shadow-md shadow-primary/20"
                >
                  {isCreating ? <OrbitLoader /> : <Video className="w-5 h-5" />}
                  New meeting
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2 shadow-xl border-slate-100 dark:border-white/10 rounded-xl">
                <DropdownMenuItem
                  onClick={() => handleCreateMeeting('later')}
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <LinkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Create a meeting for later</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCreateMeeting('instant')}
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <Plus className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Start an instant meeting</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form onSubmit={handleJoin} className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Keyboard className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                placeholder="Enter a code or link"
                className="block w-full pl-11 pr-14 py-3 border border-slate-200 dark:border-white/10 rounded-xl leading-5 bg-transparent placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              />
              {meetingCode && (
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary font-semibold hover:text-primary/80 transition-colors text-sm"
                >
                  Join
                </button>
              )}
            </form>
          </div>

          <div className="border-t border-slate-100 dark:border-white/10 w-full pt-5 mt-2">
            <p className="text-sm text-slate-500">
              <a href="#" className="text-primary hover:underline font-medium">Learn more</a> about Optavel Meet
            </p>
          </div>
        </div>

        {/* Right Side: Enlarged Carousel */}
        <div className="flex-1 hidden md:flex items-center justify-center relative min-h-[520px]">
          {/* Prev button */}
          <button
            onClick={prevSlide}
            className="absolute left-0 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md border border-slate-100 dark:border-white/10 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>

          <div className="flex flex-col items-center text-center w-full max-w-md px-12">
            {/* Illustration frame — larger, taller */}
            <div className="w-full h-[340px] relative mb-8">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-700 ${
                    slide.id === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0'
                  }`}
                >
                  {slide.render()}
                </div>
              ))}
            </div>

            {/* Text area with fixed height to prevent layout shift */}
            <div className="h-28">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* Pill indicators */}
            <div className="flex gap-2 mt-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? 'bg-primary w-6'
                      : 'bg-slate-200 dark:bg-slate-700 w-2 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={nextSlide}
            className="absolute right-0 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md border border-slate-100 dark:border-white/10 flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </main>

      {/* Share Link Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl">
          <DialogTitle className="sr-only">Meeting Link Created</DialogTitle>
          <DialogDescription className="sr-only">Your meeting link is ready to be copied.</DialogDescription>
          <div className="p-2">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-primary/10 to-transparent p-8 text-center border border-primary/20">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-primary transform rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                  <Video className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Here's your meeting link</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-sm leading-relaxed">
                  Copy this link and send it to people you want to meet with. Save it so you can use it later.
                </p>
                <div className="w-full bg-white dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-left shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Join Link</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 min-w-0 bg-slate-50 dark:bg-black/50 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <span className="text-sm text-primary font-medium truncate select-all block w-full">{laterLink}</span>
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="rounded-xl shrink-0 gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(laterLink);
                        toast({ title: 'Copied!', description: 'Meeting link copied to clipboard.' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="ghost"
                  className="mt-6 w-full sm:w-auto px-8 text-slate-500 hover:text-slate-700"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
