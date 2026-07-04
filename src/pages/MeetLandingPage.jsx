import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Video, Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Copy, Plus, Link as LinkIcon } from 'lucide-react';

export default function MeetLandingPage() {
  const [meetingCode, setMeetingCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [laterLink, setLaterLink] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

        {/* Right Side: Hero Graphic */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center p-12 overflow-hidden group">
            {/* Abstract geometric composition representing a video call */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
            <div className="relative w-full h-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 transition-transform duration-700 group-hover:scale-105">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10" />
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10" />
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10" />
              </div>
              <p className="text-slate-400 text-sm font-medium mt-4">Get a link you can share</p>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-medium text-slate-900 dark:text-white">Here's the link to your meeting</DialogTitle>
            <DialogDescription className="text-slate-500 pt-2">
              Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-black/50 p-3 rounded-lg border border-slate-200 dark:border-white/10">
            <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 truncate select-all px-2">
              {laterLink}
            </span>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className="px-3"
              onClick={() => {
                navigator.clipboard.writeText(laterLink);
                toast({ title: 'Copied', description: 'Meeting link copied to clipboard.' });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="mt-6 sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
