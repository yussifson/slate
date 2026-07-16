import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Zap, Target, Star, Brain, Camera, Rocket, MessageSquare, PhoneCall, ArrowRight, ShieldCheck, CheckCircle, Video, TrendingUp, Calendar, X, Keyboard, Sparkles, Copy, Link as LinkIcon, Users, Layers, ChevronRight, ChevronLeft, Monitor, Globe, Plus, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import FeaturesCircle from '@/components/clipad/FeaturesCircle';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import ContactSalesModal from '@/components/clipad/ContactSalesModal';
import PaymentReceiptModal from '@/components/clipad/PaymentReceiptModal';
import SupportAIChat from '@/components/clipad/SupportAIChat';


const pillars = [
  {
    icon: Video,
    color: 'from-orange-500 to-orange-400',
    glow: 'shadow-orange-500/20',
    title: 'HD Live Meetings',
    desc: 'No time limits. Up to 500 participants. Speaker spotlight, noise cancellation, live captions, breakout rooms and a persistent whiteboard — all built in.'
  },
  {
    icon: Camera,
    color: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/20',
    title: 'Async Video Messages',
    desc: 'Record camera, screen, or both in picture-in-picture. Share an instant link. Viewers leave timestamped comments and emoji reactions at exact moments.'
  },
  {
    icon: Brain,
    color: 'from-yellow-500 to-amber-500',
    glow: 'shadow-yellow-500/20',
    title: 'AI Meeting Intelligence',
    desc: 'Every meeting produces a full summary, key decisions, extracted action items with owners, open questions, and sentiment — within 2 minutes of ending.'
  },
  {
    icon: Layers,
    color: 'from-orange-500 to-orange-400',
    glow: 'shadow-orange-500/20',
    title: 'Team Spaces',
    desc: 'Persistent rooms for every team and project. Live meetings, async videos, shared notes, action boards, and cross-space search in one place.'
  },
  {
    icon: Target,
    color: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/20',
    title: 'Sales & Demo Layer',
    desc: 'Record personalised video proposals. Know who watched, how much, where they paused, and whether they shared it — before your follow-up call.'
  },
  {
    icon: Zap,
    color: 'from-yellow-500 to-amber-500',
    glow: 'shadow-yellow-500/20',
    title: 'Smart Follow-up',
    desc: 'After every meeting, each participant receives only their personal action items with full context. Not the whole notes — just what they need to do.'
  },
];

const stats = [
  { value: '500+', label: 'Participants per call' },
  { value: '2 min', label: 'AI summary delivery' },
  { value: '0', label: 'Time limits' },
  { value: '100%', label: 'End-to-end encrypted' },
];

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    features: ['Unlimited HD meetings', 'Up to 10 participants', 'Screen sharing & whiteboard', '10 async video recordings/mo (15 min limit)', 'Basic AI meeting summary', 'Up to 5 Team Spaces', '2GB Max Cloud Storage'],
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per workspace/mo',
    highlight: true,
    badge: 'Most Popular',
    features: ['Everything in Free', 'Up to 300 participants', 'Unlimited async recordings (1 hr limit)', 'Full AI intelligence layer', 'Smart follow-up emails', 'Video engagement analytics', 'Unlimited Team Spaces', '15GB Max Cloud Storage'],
  },
  {
    name: 'Enterprise',
    price: '$39',
    period: 'per workspace/mo',
    highlight: false,
    features: ['Everything in Pro', 'Unlimited participants', 'Branded meeting rooms', 'SSO & compliance recording', 'Unlimited async recordings', 'SLA & dedicated support', 'Custom integrations', '50GB Max Cloud Storage'],
  },
];

const slides = [
  {
    id: 0,
    title: 'Team Spaces & Async Video',
    description: 'Create persistent rooms for every project. Record picture-in-picture async updates and share instantly.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        <div className="absolute w-64 h-64 rounded-full border-2 border-indigo-100 animate-pulse" />
        <div className="absolute w-44 h-44 rounded-full bg-indigo-50" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
          <Layers className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute top-6 right-10 bg-background border border-border rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-600">Async Ready</span>
        </div>
        <div className="absolute bottom-10 left-6 bg-background border border-border rounded-xl px-3 py-1.5 shadow-lg">
          <span className="text-xs font-medium text-muted-foreground font-mono">Design Team Space</span>
        </div>
      </div>
    ),
  },
  {
    id: 1,
    title: 'AI Meeting Intelligence',
    description: 'Every meeting produces a full summary, extracted action items, and key decisions within 2 minutes of ending.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        <div className="absolute w-64 h-64 rounded-full border-2 border-pink-100 animate-pulse" />
        <div className="absolute w-44 h-44 rounded-full bg-pink-50" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-2xl shadow-pink-500/40">
          <Brain className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute top-4 right-8 bg-background border border-border rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
          <Brain className="w-3 h-3 text-pink-500" />
          <span className="text-xs font-semibold text-pink-600">Summary Gen</span>
        </div>
        <div className="absolute bottom-8 left-4 bg-background border border-border rounded-xl px-3 py-2 shadow-lg text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Action Items</span>
          <span className="text-xs font-bold text-foreground">3 assigned to you</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Smart Follow-up',
    description: 'Participants receive only their personal action items with full context. No more reading through entire transcripts.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        <div className="absolute w-64 h-64 rounded-full border-2 border-emerald-100 animate-pulse" />
        <div className="absolute w-44 h-44 rounded-full bg-emerald-50" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
          <Zap className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute bottom-6 flex -space-x-3">
          {['bg-blue-400', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'].map((c, i) => (
            <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-background flex items-center justify-center`}>
              <Users className="w-4 h-4 text-white" />
            </div>
          ))}
        </div>
        <div className="absolute top-4 right-6 bg-background border border-border rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-600">Context aware</span>
        </div>
      </div>
    ),
  },
];

function useLiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = '/clipad-logo.svg';
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
  const [supportPanel, setSupportPanel] = useState(null); 
  const [supportForm, setSupportForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [receiptDetails, setDetails] = useState(null);
  const [showHumanForm, setShowHumanForm] = useState(false);
  
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [exchangeRate, setExchangeRate] = useState(218 / 19);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const now = useLiveClock();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => { if (data?.rates?.GHS) setExchangeRate(data.rates.GHS); })
      .catch(() => setExchangeRate(218 / 19));

    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const originalClass = root.className;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
    return () => {
      root.className = originalClass;
      root.style.colorScheme = '';
    };
  }, []);

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

  const handlePricingAction = async (tierName) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (tierName === 'Free') {
      navigate('/dashboard');
      return;
    }

    if (tierName === 'Pro' || tierName === 'Enterprise') {
      setIsProcessingPay(true);
      try {
        const isPro = tierName === 'Pro';
        const amountInGhs = isPro ? 105 : 450;
        const amountInPesewas = amountInGhs * 100;
        const planCode = isPro 
            ? (import.meta.env.VITE_PAYSTACK_PLAN_CODE_PRO || 'PLN_rz16cups3jarao2')
            : (import.meta.env.VITE_PAYSTACK_PLAN_CODE_ENTERPRISE || 'PLN_0g01fqqgeymnsj7');

        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_mock',
          email: user?.email || 'user@example.com',
          amount: amountInPesewas, 
          currency: 'GHS',
          plan: planCode,
          ref: '' + Math.floor((Math.random() * 1000000000) + 1),
          callback: function (response) {
            toast({ title: 'Payment Successful', description: `Welcome to Pro!` });
            
            setReceiptDetails({
              reference: response.reference,
              amount: amountInPesewas,
              currency: 'GHS',
              plan: 'Pro',
              date: new Date().toISOString(),
              email: user?.email || 'user@example.com'
            });

            if (companyId) {
              supabase.from('company_subscriptions').upsert({
                company_id: companyId,
                plan_id: 'pro',
                status: 'active',
                paystack_customer_code: response.reference,
                updated_at: new Date().toISOString()
              }).then(() => navigate('/dashboard'));
            } else {
              navigate('/dashboard');
            }
          },
          onClose: function () {
            toast({ title: 'Payment Cancelled' });
          },
        });
        handler.openIframe();
      } catch (err) {
        toast({ title: 'Error', description: 'Could not initialize Paystack', variant: 'destructive' });
      } finally {
        setIsProcessingPay(false);
      }
    }
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
    <div className={`light min-h-screen bg-white text-slate-900 flex flex-col font-sans relative transition-all duration-500 ease-in-out ${supportPanel ? 'lg:pr-[400px]' : ''}`}>
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-orange-500/5 blur-[120px]" />
      </div>
      <Helmet>
        <title>CliPad — Enterprise Collaborative Productivity Workspace</title>
        <meta name="description" content="CliPad is a free, secure, enterprise-grade collaborative productivity workspace. Connect your team with chat, spaces, and HD video meetings instantly. Trusted by teams worldwide." />
      </Helmet>
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 flex items-center justify-center text-primary">
            <CliPadLogo size={36} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">CliPad</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
          <a href="#features" className="px-4 py-2 rounded-lg hover:text-foreground hover:bg-secondary transition-colors">Features</a>
          <a href="#pricing" className="px-4 py-2 rounded-lg hover:text-foreground hover:bg-secondary transition-colors">Pricing</a>
          <a href="#contact" className="px-4 py-2 rounded-lg hover:text-foreground hover:bg-secondary transition-colors">Support</a>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm font-semibold tabular-nums bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-inner text-slate-700">
            <Clock className="w-4 h-4 text-primary" />
            <span>{timeStr}</span>
            <span className="text-slate-300 mx-0.5">|</span>
            <span>{dateStr}</span>
          </div>
          {user ? (
            <Button onClick={() => navigate('/dashboard')} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <Layers className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/login')} variant="outline" className="rounded-xl border-border bg-background hover:bg-secondary text-foreground">
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-12 md:gap-16 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-normal text-slate-800 leading-tight tracking-tight">
            Enterprise AI-powered organizational memory platform.<br />Now free for everyone.
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            CliPad captures, connects, and preserves your company's knowledge—through meetings, async video, collaboration, and intelligent context.
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
              <DropdownMenuContent align="start" className="w-64 p-2 shadow-xl border-slate-100 rounded-xl">
                <DropdownMenuItem
                  onClick={() => handleCreateMeeting('later')}
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-50"
                >
                  <LinkIcon className="w-5 h-5 text-slate-500" />
                  <span className="font-medium text-slate-700">Create a meeting for later</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCreateMeeting('instant')}
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-slate-50"
                >
                  <Plus className="w-5 h-5 text-slate-500" />
                  <span className="font-medium text-slate-700">Start an instant meeting</span>
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
                className="block w-full pl-11 pr-14 py-3 border border-slate-200 rounded-xl leading-5 bg-transparent placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
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
        </div>

        <div className="flex-1 hidden md:flex items-center justify-center relative min-h-[520px]">
          <button
            onClick={prevSlide}
            className="absolute left-0 z-10 w-10 h-10 rounded-full bg-white hover:bg-slate-50 shadow-md border border-slate-100 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex flex-col items-center text-center w-full max-w-md px-12">
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
            <div className="h-28">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                {slides[currentSlide].description}
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? 'bg-primary w-6'
                      : 'bg-slate-200 w-2 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={nextSlide}
            className="absolute right-0 z-10 w-10 h-10 rounded-full bg-white hover:bg-slate-50 shadow-md border border-slate-100 flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </main>

      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-4">

          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Everything your team needs.</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Not five tools. One.</p>
        </div>

        <FeaturesCircle />
      </section>

        <section className="py-32 px-6 md:px-12 max-w-6xl mx-auto relative">
          <div className="text-center mb-20 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900">The autonomous workflow.</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">The magic isn't any single feature — it's how they observe your work and autonomously update your entire system.</p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="hidden md:block absolute top-24 left-[10%] right-[10%] h-1 bg-slate-100 rounded-full z-0">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-teal-400 to-primary rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            
            {[
              { icon: Calendar, color: 'bg-indigo-500 shadow-indigo-500/30', step: '01', title: 'Schedule', desc: 'Syncs with your calendar automatically.' },
              { icon: Video, color: 'bg-violet-500 shadow-violet-500/30', step: '02', title: 'Meet', desc: 'HD video with live AI transcription.' },
              { icon: Brain, color: 'bg-pink-500 shadow-pink-500/30', step: '03', title: 'Analyze', desc: 'AI extracts decisions & action items.' },
              { icon: Camera, color: 'bg-cyan-500 shadow-cyan-500/30', step: '04', title: 'Follow-up', desc: 'Send async video updates seamlessly.' },
              { icon: TrendingUp, color: 'bg-emerald-500 shadow-emerald-500/30', step: '05', title: 'Compound', desc: 'Enterprise intelligence grows over time.' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative z-10 flex flex-col items-center text-center group">
                  <div className={`w-20 h-20 rounded-2xl ${step.color} text-white flex items-center justify-center shadow-2xl mb-6 group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="bg-primary text-primary-foreground text-[10px] font-mono font-bold px-3 py-1 rounded-full mb-4 tracking-widest shadow-sm">
                    STEP {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
          <div className="text-center mb-16">

            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Choose the perfect plan for your team.</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Scale your operations seamlessly with Clipad.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div key={tier.name} className={`relative p-8 rounded-3xl border transition-all ${tier.highlight ? 'bg-gradient-to-b from-primary/20 to-primary/10 border-primary/40 shadow-2xl shadow-primary/10' : 'bg-secondary/50 border-border hover:border-border'}`}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-primary rounded-full text-xs font-bold text-white shadow-lg">
                    {tier.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">{tier.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground mb-1">/ {tier.period}</span>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? 'text-primary' : 'text-emerald-400'}`} />
                      <span className="text-sm text-foreground/80">{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handlePricingAction(tier.name)}
                  disabled={isProcessingPay}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${tier.highlight ? 'bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-white shadow-lg shadow-primary/25' : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'}`}
                >
                  {user ? (tier.name === 'Free' ? 'Current Plan' : 'Upgrade') : 'Get Started'}
                </button>
              </div>
            ))}
          </div>

          {/* Compare Plans Table */}
          <div className="mt-24">
            <h3 className="text-3xl font-black text-center mb-10 tracking-tight">Compare Plans</h3>
            <div className="overflow-x-auto border border-border rounded-3xl bg-secondary/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="p-5 font-bold text-foreground w-[40%] rounded-tl-3xl">Features</th>
                    <th className="p-5 font-bold text-foreground text-center">Free</th>
                    <th className="p-5 font-bold text-primary text-center bg-primary/5">Pro</th>
                    <th className="p-5 font-bold text-foreground text-center rounded-tr-3xl">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-muted-foreground">
                  <tr className="border-b border-border hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">Video Recording Limit</td>
                    <td className="p-5 text-center">15 minutes</td>
                    <td className="p-5 text-center text-primary font-bold bg-primary/5">1 hour</td>
                    <td className="p-5 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">Team Spaces</td>
                    <td className="p-5 text-center">Up to 5</td>
                    <td className="p-5 text-center text-primary font-bold bg-primary/5">Unlimited</td>
                    <td className="p-5 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">Participants per Call</td>
                    <td className="p-5 text-center">Up to 10</td>
                    <td className="p-5 text-center text-primary font-bold bg-primary/5">Up to 300</td>
                    <td className="p-5 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">AI Meeting Summary</td>
                    <td className="p-5 text-center">Basic</td>
                    <td className="p-5 text-center text-primary font-bold bg-primary/5">Full Intelligence</td>
                    <td className="p-5 text-center">Full Intelligence</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">Video Analytics</td>
                    <td className="p-5 text-center">-</td>
                    <td className="p-5 text-center text-primary font-bold bg-primary/5">Yes</td>
                    <td className="p-5 text-center">Advanced</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">Custom Branding & SSO</td>
                    <td className="p-5 text-center">-</td>
                    <td className="p-5 text-center text-primary font-bold bg-primary/5">-</td>
                    <td className="p-5 text-center">Yes</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-semibold text-slate-700">Cloud Storage Limit</td>
                    <td className="p-5 text-center font-bold">2GB Max</td>
                    <td className="p-5 text-center text-primary font-bold bg-primary/5">15GB Max</td>
                    <td className="p-5 text-center font-bold">50GB Max</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
              Start your first meeting.
              <span className="block text-primary">Free. Right now.</span>
            </h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">No account needed to join or start a meeting. Sign up to unlock AI intelligence, async video, and team spaces.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleCreateMeeting('instant')}
                disabled={isCreating}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-white font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02]"
              >
                <Video className="w-5 h-5" /> Start Free Meeting
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold border border-border transition-all"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">We're here to help</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Need assistance with your account, or want to schedule a demo? Reach out to our Optavel Support team below.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Live Support Chat</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-1">Chat directly with an Optavel support agent in real-time to get your questions answered instantly.</p>
              <button 
                onClick={() => setSupportPanel('chat')}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
              >
                Start Chat
              </button>
            </div>

            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <PhoneCall className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Request a Call</h3>
              <p className="text-muted-foreground text-sm mb-6 flex-1">Submit your details and a dedicated support representative will call you back shortly.</p>
              <button 
                onClick={() => setSupportPanel('call')}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
              >
                Request Call
              </button>
            </div>
          </div>
        </section>

        {/* ΓöÇΓöÇ FOOTER ΓöÇΓöÇ */}
        <footer className="border-t border-border py-6 px-6 md:px-12 bg-slate-50/50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <div className="text-primary mr-1">
                <CliPadLogo size={24} />
              </div>
              <span>&copy; {new Date().getFullYear()} CliPad by Optavel Technologies</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="hover:text-muted-foreground cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-muted-foreground cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-muted-foreground cursor-pointer transition-colors">Security</span>
              <a href="https://optavel.com" className="hover:text-muted-foreground transition-colors flex items-center gap-1"><Globe className="w-3 h-3" /> optavel.com</a>
            </div>
          </div>
        </footer>
      

      {/* Share Link Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <DialogTitle className="sr-only">Meeting Link Created</DialogTitle>
          <DialogDescription className="sr-only">Your meeting link is ready to be copied.</DialogDescription>
          
          <div className="relative w-full bg-gradient-to-b from-primary/10 to-transparent p-8 md:p-10 text-center flex flex-col items-center">
            {/* Sparkles Background */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sparkles className="w-32 h-32 text-primary transform rotate-12" />
            </div>

            {/* Icon */}
            <div className="w-16 h-16 bg-primary text-foreground rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/30 shrink-0">
              <Video className="w-8 h-8" />
            </div>

            {/* Text */}
            <h2 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">Here's your meeting link</h2>
            <p className="text-slate-500 mb-8 max-w-sm text-sm leading-relaxed">
              Copy this link and send it to people you want to meet with. Save it so you can use it later.
            </p>

            {/* Link Box */}
            <div className="w-full bg-white backdrop-blur-sm border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Join Link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 overflow-hidden">
                  <span className="text-sm text-primary font-medium truncate block w-full">{laterLink}</span>
                </div>
                <Button
                  type="button"
                  className="rounded-xl shrink-0 gap-2 bg-primary hover:bg-primary/90 text-foreground shadow-md shadow-primary/20 transition-all hover:scale-105 px-4"
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

            {/* Done Button */}
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="ghost"
              className="mt-6 w-full sm:w-auto px-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100:bg-slate-800 rounded-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Panel */}
      <AnimatePresence>
        {supportPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSupportPanel(null)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col z-[110] border-l-4 border-primary"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold">{supportPanel === 'chat' ? 'Live Chat Support' : 'Request a Call'}</h3>
                <button 
                  onClick={() => { setSupportPanel(null); setShowHumanForm(false); }} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                {supportPanel === 'chat' ? (
                  showHumanForm ? (
                    <div className="p-6">
                      <div className="flex flex-col h-full justify-center items-center text-center text-slate-500">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
                        <p>Live chat agents are currently offline.<br/>Please leave a message.</p>
                        <form className="space-y-4 w-full mt-8" onSubmit={(e) => { e.preventDefault(); setSubmittingSupport(true); setTimeout(() => { setSubmittingSupport(false); setSupportPanel(null); setShowHumanForm(false); toast({title: 'Message Sent', description: 'We will email you shortly.'}); }, 1000); }}>
                          <div className="text-left">
                            <label className="text-sm font-medium">Message</label>
                            <textarea required className="w-full mt-1 px-4 py-2 border rounded-xl" rows={4} />
                          </div>
                          <Button type="submit" disabled={submittingSupport} className="w-full rounded-xl bg-primary">
                            {submittingSupport ? 'Sending...' : 'Send Message'}
                          </Button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <SupportAIChat onEscalate={() => setShowHumanForm(true)} />
                  )
                ) : (
                  <div className="p-6">
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSubmittingSupport(true); setTimeout(() => { setSubmittingSupport(false); setSupportPanel(null); toast({title: 'Request Sent', description: 'We will call you shortly.'}); }, 1000); }}>
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input type="text" required className="w-full mt-1 px-4 py-2 border rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone Number</label>
                      <input type="tel" required className="w-full mt-1 px-4 py-2 border rounded-xl" />
                    </div>
                    <Button type="submit" disabled={submittingSupport} className="w-full rounded-xl mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                      {submittingSupport ? 'Submitting...' : 'Request Call'}
                    </Button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ContactSalesModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <PaymentReceiptModal isOpen={!!receiptDetails} onClose={() => setDetails(null)} transactionDetails={receiptDetails} />
    </div>
  );
}


// Fix icon reference
function MonitorIcon(props) { return <Monitor {...props} />; }
