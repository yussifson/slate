import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Video, Keyboard, Sparkles, Copy, Link as LinkIcon, Calendar, ShieldCheck,
  Users, Mic, Brain, BarChart3, Layers, Zap, Play, ChevronRight,
  Monitor, Clock, FileText, CheckCircle, ArrowRight, Star, Globe,
  MessageSquare, Activity, Camera, Wand2, Target, TrendingUp
} from 'lucide-react';

// ─── Feature Pillars Data ────────────────────────────────────────────────────
const pillars = [
  {
    icon: Video,
    color: 'from-violet-500 to-indigo-500',
    glow: 'shadow-violet-500/20',
    title: 'HD Live Meetings',
    desc: 'No time limits. Up to 500 participants. Speaker spotlight, noise cancellation, live captions, breakout rooms and a persistent whiteboard — all built in.'
  },
  {
    icon: Camera,
    color: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/20',
    title: 'Async Video Messages',
    desc: 'Record camera, screen, or both in picture-in-picture. Share an instant link. Viewers leave timestamped comments and emoji reactions at exact moments.'
  },
  {
    icon: Brain,
    color: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/20',
    title: 'AI Meeting Intelligence',
    desc: 'Every meeting produces a full summary, key decisions, extracted action items with owners, open questions, and sentiment — within 2 minutes of ending.'
  },
  {
    icon: Layers,
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
    title: 'Team Spaces',
    desc: 'Persistent rooms for every team and project. Live meetings, async videos, shared notes, action boards, and cross-space search in one place.'
  },
  {
    icon: Target,
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/20',
    title: 'Sales & Demo Layer',
    desc: 'Record personalised video proposals. Know who watched, how much, where they paused, and whether they shared it — before your follow-up call.'
  },
  {
    icon: Zap,
    color: 'from-indigo-500 to-purple-500',
    glow: 'shadow-indigo-500/20',
    title: 'Smart Follow-up',
    desc: 'After every meeting, each participant receives only their personal action items with full context. Not the whole notes — just what they need to do.'
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = [
  { value: '500+', label: 'Participants per call' },
  { value: '2 min', label: 'AI summary delivery' },
  { value: '0', label: 'Time limits' },
  { value: '100%', label: 'End-to-end encrypted' },
];

// ─── Pricing Tiers ────────────────────────────────────────────────────────────
const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    features: ['Unlimited HD meetings', 'Up to 100 participants', 'Screen sharing & whiteboard', '5 async video recordings/mo', 'Basic AI meeting summary'],
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per workspace/mo',
    highlight: true,
    badge: 'Most Popular',
    features: ['Everything in Free', 'Up to 300 participants', 'Unlimited async recordings', 'Full AI intelligence layer', 'Smart follow-up emails', 'Video engagement analytics', 'Team Spaces'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    highlight: false,
    features: ['Everything in Pro', 'Up to 500 participants', 'Branded meeting rooms', 'SSO & compliance recording', 'E2E encryption', 'SLA & dedicated support', 'Custom integrations'],
  },
];

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function AnimatedGradientBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050A15]" />
      {/* Animated orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
      <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
    </div>
  );
}

export default function MeetLandingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const now = useLiveClock();
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [createdLink, setCreatedLink] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const createRoom = async (instant = true) => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { instant },
      });
      if (error || !data?.url) throw error || new Error('No room URL returned');
      const shortId = data.name || data.url.split('/').pop();
      const shareLink = `${window.location.origin}/join/${shortId}`;
      if (instant) {
        navigate(`/join/${shortId}`);
      } else {
        setCreatedLink(shareLink);
        setShowLinkDialog(true);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Could not create meeting room.', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const code = joinCode.trim().replace(/.*\/join\//, '');
    navigate(`/join/${code}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <>
      <Helmet>
        <title>CliPad — Video Meetings, Async Video & AI Intelligence</title>
        <meta name="description" content="CliPad is the all-in-one platform for HD video meetings, async video messages, and AI-powered meeting intelligence. One tool. Zero limits." />
        <meta name="keywords" content="CliPad, video meeting, async video, AI meeting summary, team collaboration, action items, meeting intelligence" />
        <meta property="og:title" content="CliPad — Video Meetings, Async Video & AI Intelligence" />
        <meta property="og:description" content="The only tool that does live meetings, async video, and AI intelligence in one place." />
        <meta property="og:url" content="https://clipad.optavel.com/" />
        <link rel="canonical" href="https://clipad.optavel.com/" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Helmet>

      <AnimatedGradientBg />

      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen text-white">

        {/* ── NAVBAR ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#050A15]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Video className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">CliPad</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
            <a href="#features" className="px-4 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">Features</a>
            <a href="#pricing" className="px-4 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs text-gray-500 font-mono">{timeStr} · {dateStr}</span>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25"
              >
                <Layers className="w-4 h-4" /> Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-all border border-white/10"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-8">
              <Sparkles className="w-3 h-3" /> AI-Powered · No Time Limits · One Tool
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6">
              Meetings that actually
              <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                move things forward.
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
              HD video meetings, async video messages, and AI intelligence that extracts decisions,
              action items, and follow-ups — automatically. One platform. Zero subscriptions per seat.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  disabled={isCreating}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-base font-bold shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] disabled:opacity-70"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                  New Meeting
                  <ChevronRight className="w-4 h-4" />
                </button>
                {showDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <button onClick={() => { setShowDropdown(false); createRoom(false); }} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors flex items-start gap-3">
                      <LinkIcon className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">Create a link to share</p>
                        <p className="text-xs text-gray-500 mt-0.5">Schedule a meeting for later</p>
                      </div>
                    </button>
                    <button onClick={() => { setShowDropdown(false); createRoom(true); }} className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors flex items-start gap-3 border-t border-white/5">
                      <Video className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">Start an instant meeting</p>
                        <p className="text-xs text-gray-500 mt-0.5">Join right now</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleJoin} className="flex items-center gap-2">
                <div className="relative">
                  <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter a code or link"
                    className="pl-11 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 w-56 transition-all"
                  />
                </div>
                <button type="submit" className="px-5 py-4 rounded-2xl bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-semibold transition-all">
                  Join
                </button>
              </form>
            </div>

            {!user && (
              <p className="text-sm text-gray-500">
                <span className="text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => navigate('/login')}>Sign in</span> to access your dashboard, spaces, and recordings.
              </p>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-1">{s.value}</div>
                <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Hero visual — mock UI preview */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(99,102,241,0.15)] bg-[#0D1117]">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/70"/><div className="w-3 h-3 rounded-full bg-yellow-500/70"/><div className="w-3 h-3 rounded-full bg-green-500/70"/></div>
              <div className="flex-1 flex justify-center"><div className="text-xs text-gray-500 font-mono bg-white/5 rounded-lg px-4 py-1">clipad.optavel.com/join/x7k2pq</div></div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-6 h-72 md:h-96">
              {/* Video tiles mock */}
              {[
                { name: 'Yussif A.', speaking: true, color: 'from-indigo-600 to-violet-600' },
                { name: 'Sarah K.', speaking: false, color: 'from-cyan-600 to-blue-600' },
                { name: 'James M.', speaking: false, color: 'from-rose-600 to-pink-600' },
              ].map((p) => (
                <div key={p.name} className={`relative rounded-2xl overflow-hidden ${p.speaking ? 'ring-2 ring-indigo-400' : 'ring-1 ring-white/10'} bg-gradient-to-br ${p.color}/20 flex items-center justify-center`}>
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-lg font-bold shadow-lg`}>{p.name[0]}</div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    {p.speaking && <div className="flex gap-[2px]">{[3,5,4,6,3].map((h,i) => <div key={i} className="w-[3px] bg-indigo-400 rounded-full animate-pulse" style={{height:h*2, animationDelay:`${i*0.1}s`}}/>)}</div>}
                    <span className="text-[11px] font-medium text-white/80">{p.name}</span>
                  </div>
                </div>
              ))}
              {/* AI side panel */}
              <div className="col-span-3 md:col-span-0 hidden md:block absolute right-6 top-16 w-52 bg-[#0D1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-semibold text-pink-300">AI Summary Ready</span>
                </div>
                <div className="space-y-2">
                  {['Launch Q3 campaign by Friday', 'Sarah owns design deliverables', 'Follow up with enterprise leads'].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-gray-300 leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Toolbar mock */}
            <div className="flex items-center justify-center gap-3 py-4 border-t border-white/5">
              {[Mic, Video, MonitorIcon, MessageSquare, Activity].map((Icon, i) => (
                <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${i === 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center ml-4 cursor-pointer hover:bg-red-500 transition-colors">
                <span className="w-3 h-3 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-6">
              <Layers className="w-3 h-3" /> 7 Pillars
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">Everything your team needs.</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Not five tools. One.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-5 shadow-xl ${p.glow} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── HOW IT CONNECTS ── */}
        <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">The connected workflow.</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">The magic isn't any single feature — it's how they connect.</p>
          </div>

          <div className="relative">
            {[
              { icon: Calendar, color: 'bg-indigo-500', step: '01', title: 'Schedule or start', desc: 'A meeting is scheduled. Each participant gets an AI brief: prior meeting summary, their outstanding action items, and shared async videos.' },
              { icon: Video, color: 'bg-violet-500', step: '02', title: 'Meet live', desc: 'The call happens with real-time transcription running in the side panel. Decisions are made, screens are shared, the whiteboard is used.' },
              { icon: Brain, color: 'bg-pink-500', step: '03', title: 'AI summary in 2 min', desc: 'Within 2 minutes of ending, every participant gets their personalised follow-up: just their action items, with full context of what was discussed.' },
              { icon: Camera, color: 'bg-cyan-500', step: '04', title: 'Async updates', desc: "A team member records a quick video update on their action items. Others watch in their own time, react with emojis, and leave timestamped comments." },
              { icon: TrendingUp, color: 'bg-emerald-500', step: '05', title: 'Intelligence compounds', desc: "Over time, CliPad surfaces patterns: which meetings run over, which generate action items that don't get completed, and where decisions actually happen." },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex gap-6 mb-10 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {i < 4 && <div className="w-px flex-1 bg-gradient-to-b from-white/10 to-transparent mt-3" />}
                  </div>
                  <div className="pb-10">
                    <div className="text-xs font-mono text-gray-500 mb-1">STEP {step.step}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xl">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-6">
              <Star className="w-3 h-3" /> Flat Per-Workspace Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">A team of 50 pays the same as a team of 5.</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">No per-seat pricing. Ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div key={tier.name} className={`relative p-8 rounded-3xl border transition-all ${tier.highlight ? 'bg-gradient-to-b from-indigo-600/20 to-violet-600/10 border-indigo-500/40 shadow-2xl shadow-indigo-500/10' : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15'}`}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full text-xs font-bold text-white shadow-lg">
                    {tier.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">{tier.price}</span>
                    <span className="text-sm text-gray-500 mb-1">/ {tier.period}</span>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? 'text-indigo-400' : 'text-emerald-400'}`} />
                      <span className="text-sm text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(tier.name === 'Enterprise' ? '#' : '/login')}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${tier.highlight ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/8 hover:bg-white/12 text-white border border-white/10'}`}
                >
                  {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
              Start your first meeting.
              <span className="block text-indigo-400">Free. Right now.</span>
            </h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto">No account needed to join or start a meeting. Sign up to unlock AI intelligence, async video, and team spaces.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => createRoom(true)}
                disabled={isCreating}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02]"
              >
                <Video className="w-5 h-5" /> Start Free Meeting
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/8 hover:bg-white/12 text-white font-semibold border border-white/10 transition-all"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/5 py-10 px-6 md:px-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Video className="w-3 h-3 text-white" />
              </div>
              <span>© {new Date().getFullYear()} CliPad by Optavel Technologies</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Security</span>
              <a href="https://optavel.com" className="hover:text-gray-400 transition-colors flex items-center gap-1"><Globe className="w-3 h-3" /> optavel.com</a>
            </div>
          </div>
        </footer>
      </div>

      {/* ── LINK DIALOG ── */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/30">
              <LinkIcon className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Your meeting link is ready</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Share this link with participants</p>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 font-mono truncate">{createdLink}</div>
              <button
                onClick={copyLink}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={() => setShowLinkDialog(false)} className="w-full py-3 rounded-xl bg-white/8 hover:bg-white/12 text-white font-semibold transition-all border border-white/10">
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Fix icon reference
function MonitorIcon(props) { return <Monitor {...props} />; }
