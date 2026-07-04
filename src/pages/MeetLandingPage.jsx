import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Video, Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Copy, Plus, Link as LinkIcon, ChevronLeft, ChevronRight, Calendar, ShieldCheck, Users } from 'lucide-react';

const carouselItems = [
  {
    title: "Get a link you can share",
    description: "Click New meeting to get a link you can send to people you want to meet with",
    icon: <div className="relative flex items-center justify-center w-full h-full"><div className="absolute w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-pulse" /><LinkIcon className="w-10 h-10 text-blue-600 dark:text-blue-400 relative z-10" /></div>
  },
  {
    title: "Plan ahead",
    description: "Click New meeting to schedule meetings for later.",
    icon: <div className="relative flex items-center justify-center w-full h-full"><div className="absolute w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-pulse" /><Calendar className="w-10 h-10 text-emerald-600 dark:text-emerald-400 relative z-10" /></div>
  },
  {
    title: "Your meeting is safe",
    description: "No one can join a meeting unless invited or admitted by the host",
    icon: <div className="relative flex items-center justify-center w-full h-full"><div className="absolute w-24 h-24 bg-primary/10 rounded-full animate-pulse" /><div className="flex -space-x-2 relative z-10 items-end"><Users className="w-12 h-12 text-slate-400" /><ShieldCheck className="w-8 h-8 text-primary absolute -top-4 -right-2 bg-white dark:bg-slate-900 rounded-full" /></div></div>
  }
];

export default function MeetLandingPage() {
  const [meetingCode, setMeetingCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [laterLink, setLaterLink] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);

  const handleCreateMeeting = async (type) => {
    setIsCreating(true);
    try {
      const roomId = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { roomName: roomId, privacy: 'public' }
      });

      if (error) throw error;

      if (type === 'instant') {
        navigate(`/join/${roomId}`);
      } else {
        // Create for later
        const domain = window.location.hostname;
        const port = window.location.port ? ':' + window.location.port : '';
        const protocol = window.location.protocol;
        setLaterLink(`${protocol}//${domain}${port}/join/${roomId}`);
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
    
    // Extract room ID if they pasted a full link
    let roomId = meetingCode.trim();
    if (roomId.includes('/join/')) {
      roomId = roomId.split('/join/')[1];
    }
    
    navigate(`/join/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#090E17] flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:px-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Optavel Meet</span>
        </div>
        <div className="text-sm font-medium text-slate-500">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-12 md:gap-24 max-w-7xl mx-auto w-full">
        {/* Left Side: Actions */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-normal text-slate-800 dark:text-slate-100 leading-tight">
            Premium video meetings.<br/>Now free for everyone.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            We re-engineered the service we built for secure business meetings, Optavel Meet, to make it free and available for all.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="lg" 
                  disabled={isCreating}
                  className="w-full sm:w-auto h-12 px-6 gap-2 text-base rounded-md"
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
            
            <form onSubmit={handleJoin} className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Keyboard className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                placeholder="Enter a code or link"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-white/10 rounded-md leading-5 bg-transparent placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              />
              {meetingCode && (
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  Join
                </button>
              )}
            </form>
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 w-full pt-6 mt-6">
            <p className="text-sm text-slate-500">
              <a href="#" className="text-primary hover:underline">Learn more</a> about Optavel Meet
            </p>
          </div>
        </div>

        {/* Right Side: Hero Graphic Carousel */}
        <div className="flex-1 hidden md:flex items-center justify-center relative">
          <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-0 z-10 rounded-full w-10 h-10 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/10 shrink-0">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </Button>

          <div className="flex flex-col items-center text-center w-full max-w-sm px-6">
            <div className="w-[300px] h-[300px] mb-8 rounded-full overflow-hidden relative">
              {carouselItems.map((item, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  {item.icon}
                </div>
              ))}
            </div>
            
            <div className="h-24">
              <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-2">
                {carouselItems[currentSlide].title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                {carouselItems[currentSlide].description}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-primary w-4' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'}`}
                />
              ))}
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-0 z-10 rounded-full w-10 h-10 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/10 shrink-0">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Button>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl">
          <DialogTitle className="sr-only">Meeting Link Created</DialogTitle>
          <DialogDescription className="sr-only">Your meeting link is ready to be copied.</DialogDescription>
          <div className="flex flex-col p-2">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-primary/10 to-transparent p-8 text-center border border-primary/20 shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-primary transform rotate-12" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                  <Video className="w-8 h-8" />
                </div>
                
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Here's your meeting link</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
                  Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later.
                </p>

                <div className="w-full bg-white dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-left shadow-sm space-y-5 relative">
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Join Link</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 min-w-0 bg-slate-50 dark:bg-black/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex items-center">
                        <span className="text-sm text-primary font-medium truncate select-all block w-full">
                          {laterLink}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        size="lg"
                        className="rounded-xl shrink-0 gap-2 h-12 sm:h-auto"
                        onClick={() => {
                          navigator.clipboard.writeText(laterLink);
                          toast({ title: 'Copied', description: 'Meeting link copied to clipboard.' });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setIsDialogOpen(false)} variant="ghost" className="mt-6 w-full sm:w-auto px-8 text-slate-500 hover:text-slate-700">
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
