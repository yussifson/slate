import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { Video, Keyboard, Sparkles, Copy, Plus, Link as LinkIcon, ChevronLeft, ChevronRight, Calendar, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

// --- Carousel Slides ---
const slides = [
  {
    id: 0,
    title: 'Get a link you can share',
    description: 'Click New meeting to get a link you can send to people you want to meet with',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        {/* Animated Mesh Gradients */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-[120%] h-[120%] rounded-full bg-blue-500/20 blur-[60px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 rounded-full bg-cyan-400/20 blur-[40px] mix-blend-screen" 
        />
        
        {/* Glass Orb */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative w-40 h-40 rounded-full border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-xl flex items-center justify-center shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 to-cyan-400/40 opacity-50" />
          <LinkIcon className="w-14 h-14 text-blue-600 dark:text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] z-10" strokeWidth={1.5} />
        </motion.div>

        {/* Floating badges with spring animation */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="absolute top-10 right-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center gap-2"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          <span className="text-xs font-semibold text-slate-800 dark:text-cyan-100 tracking-wide">Link Ready</span>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="absolute bottom-10 left-0 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
        >
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono tracking-tight">meet.optavel.com/join/...</span>
        </motion.div>
      </div>
    ),
  },
  {
    id: 1,
    title: 'Plan ahead',
    description: 'Click New meeting to schedule meetings for later, then share the link before your event.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        {/* Animated Mesh Gradients */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute w-[120%] h-[120%] rounded-full bg-emerald-500/20 blur-[60px]" 
        />
        
        {/* Glass Orb */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative w-40 h-40 rounded-[2rem] border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-xl flex items-center justify-center shadow-2xl rotate-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/40 to-teal-400/40 opacity-50" />
          <Calendar className="w-14 h-14 text-emerald-600 dark:text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)] z-10 -rotate-3" strokeWidth={1.5} />
        </motion.div>

        {/* Floating time badge */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-8 right-0 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-center transform rotate-6"
        >
          <span className="text-[10px] font-medium text-slate-500 dark:text-teal-200/70 uppercase tracking-wider block mb-1">Reminder sent</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white">10:00 AM Mon</span>
        </motion.div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Your meeting is safe',
    description: 'No one can join unless invited or admitted by the host. End-to-end encrypted.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        {/* Animated Mesh Gradients */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute w-[120%] h-[120%] rounded-full bg-violet-500/20 blur-[60px]" 
        />
        
        {/* Glass Shield */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-40 h-40 rounded-full border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-xl flex items-center justify-center shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/40 to-fuchsia-400/40 opacity-50" />
          <ShieldCheck className="w-16 h-16 text-violet-600 dark:text-fuchsia-400 drop-shadow-[0_0_15px_rgba(192,38,211,0.5)] z-10" strokeWidth={1.5} />
        </motion.div>

        {/* Encrypted badge */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="absolute top-4 right-2 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-fuchsia-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-fuchsia-100">End-to-end</span>
        </motion.div>

        {/* Avatars below */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-6 flex -space-x-4 hover:space-x-1 transition-all duration-300"
        >
          {['from-blue-400 to-blue-600', 'from-rose-400 to-rose-600', 'from-amber-400 to-amber-600', 'from-emerald-400 to-emerald-600'].map((c, i) => (
            <div key={i} className={`w-10 h-10 rounded-full bg-gradient-to-br ${c} border-2 border-white/50 dark:border-black/50 backdrop-blur-md flex items-center justify-center shadow-lg transition-transform hover:-translate-y-2 hover:scale-110`}>
              <Users className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          ))}
        </motion.div>
      </div>
    ),
  },
];

// --- Live Clock Hook ---
function useLiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update favicon
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = '/orbit-logo.svg';
    }

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

  const generateShortId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randomStr = (length) => {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    return `${randomStr(3)}-${randomStr(3)}-${randomStr(1)}`;
  };

  const handleCreateMeeting = async (type) => {
    setIsCreating(true);
    try {
      const dbId = crypto.randomUUID();
      const shortId = generateShortId();
      
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { dbId, roomName: shortId, privacy: 'public' },
      });
      if (error) throw error;

      if (type === 'instant') {
        navigate(`/join/${shortId}`);
      } else {
        const { protocol, hostname, port } = window.location;
        setLaterLink(`${protocol}//${hostname}${port ? ':' + port : ''}/join/${shortId}`);
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] flex flex-col font-sans relative overflow-hidden transition-colors duration-500">
      {/* Fluid Dynamics Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[30%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 blur-[120px] dark:from-primary/10 dark:to-blue-500/5 mix-blend-multiply dark:mix-blend-screen" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-cyan-400/20 to-emerald-400/10 blur-[140px] dark:from-cyan-400/10 dark:to-emerald-400/5 mix-blend-multiply dark:mix-blend-screen" 
        />
      </div>

      <Helmet>
        <title>Optavel Meet - Premium HD Video Meetings</title>
        <meta name="description" content="Start or join HD video meetings instantly with Fluid Dynamics UI." />
      </Helmet>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-white/10">
            <img src="/orbit-logo.svg" alt="Optavel Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Optavel Meet
          </span>
        </div>
        {/* Live real-time clock */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 tabular-nums bg-white/50 dark:bg-black/30 px-4 py-2 rounded-full border border-white/40 dark:border-white/10 backdrop-blur-md shadow-sm">
          <span>{timeStr}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>{dateStr}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-6 md:p-12 lg:p-20 gap-12 lg:gap-20 max-w-[1400px] mx-auto w-full">
        
        {/* Left Side: Copy & Actions */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 w-full"
        >
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary text-sm font-semibold tracking-wide mb-2">
              <Sparkles className="w-4 h-4" /> Optavel OS Exclusive
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              Premium video meetings.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-cyan-400">Beautifully fluid.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-xl">
              Immerse yourself in secure, enterprise-grade video conferencing powered by Fluid Dynamics UI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  disabled={isCreating}
                  className="w-full sm:w-auto h-14 px-8 gap-3 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 border border-white/20"
                >
                  {isCreating ? <OrbitLoader /> : <Video className="w-5 h-5" />}
                  New Meeting
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2 shadow-2xl border-white/20 dark:border-white/10 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl">
                <DropdownMenuItem
                  onClick={() => handleCreateMeeting('later')}
                  className="flex items-center gap-3 p-3.5 cursor-pointer rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Create for later</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Get a link to share</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCreateMeeting('instant')}
                  className="flex items-center gap-3 p-3.5 cursor-pointer rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/10 transition-colors mt-1"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Start instantly</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Jump right into a room</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form onSubmit={handleJoin} className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Keyboard className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                placeholder="Enter a code or link"
                className="block w-full h-14 pl-12 pr-20 py-3 border border-white/40 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-900 sm:text-base font-medium shadow-sm transition-all"
              />
              <AnimatePresence>
                {meetingCode && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    type="submit"
                    className="absolute inset-y-2 right-2 px-4 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-sm shadow-md"
                  >
                    Join
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </div>
        </motion.div>

        {/* Right Side: Fluid Glass Carousel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex-1 w-full max-w-lg hidden lg:flex flex-col items-center justify-center relative perspective-[1000px]"
        >
          {/* Main Glass Container */}
          <div className="relative w-full aspect-square max-w-[500px] rounded-[3rem] bg-white/30 dark:bg-black/30 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-8 transform-gpu hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-shadow duration-500">
            
            <div className="flex-1 relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col"
                >
                  <div className="flex-1 relative">
                    {slides[currentSlide].render()}
                  </div>
                  <div className="h-32 text-center mt-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                      {slides[currentSlide].title}
                    </h2>
                    <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {slides[currentSlide].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation & Indicators */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-10">
              <button
                onClick={prevSlide}
                className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md shadow-md border border-white/50 dark:border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              <div className="flex gap-2.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                      i === currentSlide
                        ? 'bg-primary w-8 shadow-sm shadow-primary/50'
                        : 'bg-slate-300 dark:bg-slate-700 w-2.5 hover:bg-slate-400 dark:hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md shadow-md border border-white/50 dark:border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Share Link Dialog (Glassmorphic) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 border border-white/20 shadow-2xl rounded-[2rem] overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl">
          <DialogTitle className="sr-only">Meeting Link Created</DialogTitle>
          <DialogDescription className="sr-only">Your meeting link is ready to be copied.</DialogDescription>
          
          <div className="relative w-full p-10 text-center flex flex-col items-center">
            {/* Soft background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-primary/20 to-transparent blur-[40px] pointer-events-none" />

            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/30 shrink-0 transform rotate-3">
              <Video className="w-8 h-8 -rotate-3" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Ready to meet?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-sm text-base leading-relaxed font-medium">
              Copy this link and send it to your team. Save it for later if you need to.
            </p>

            <div className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-inner">
              <div className="flex-1 min-w-0 px-3 py-2 text-left">
                <span className="text-sm text-primary dark:text-cyan-400 font-semibold truncate block w-full tracking-wide">
                  {laterLink}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-xl h-10 px-5 gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(laterLink);
                  toast({ title: 'Copied!', description: 'Link saved to clipboard.' });
                }}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>

            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="ghost"
              className="mt-6 w-full rounded-xl h-12 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 font-semibold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
