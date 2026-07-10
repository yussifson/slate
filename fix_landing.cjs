const fs = require('fs');

let current = fs.readFileSync('src/pages/MeetLandingPage.jsx', 'utf8');
const oldMarketing = fs.readFileSync('temp2.jsx', 'utf8');

// 1. Fix the Header to include Sign In / Dashboard
const headerRegex = /(<header[^>]*>.*?)(<\/header>)/s;
const headerMatch = current.match(headerRegex);
if (headerMatch) {
  const newHeaderInner = `
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src="/orbit-logo.svg" alt="Optavel Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">CliPad</span>
        </div>
        
        <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
          <a href="#features" className="px-4 py-2 rounded-lg hover:text-foreground hover:bg-secondary transition-colors">Features</a>
          <a href="#pricing" className="px-4 py-2 rounded-lg hover:text-foreground hover:bg-secondary transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            <span>{timeStr}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
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
`;
  current = current.replace(headerRegex, `<header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-border bg-secondary/50 dark:bg-background/80 backdrop-blur-md">\n${newHeaderInner}\n      </header>`);
}

// 2. Fix the Carousel Slides
const slidesReplacement = `const slides = [
  {
    id: 0,
    title: 'Team Spaces & Async Video',
    description: 'Create persistent rooms for every project. Record picture-in-picture async updates and share instantly.',
    render: () => (
      <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
        <div className="absolute w-64 h-64 rounded-full border-2 border-indigo-100 dark:border-indigo-900/40 animate-pulse" />
        <div className="absolute w-44 h-44 rounded-full bg-indigo-50 dark:bg-indigo-900/20" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
          <Layers className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute top-6 right-10 bg-background border border-border rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
          <Camera className="w-3 h-3 text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">Async Ready</span>
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
        <div className="absolute w-64 h-64 rounded-full border-2 border-pink-100 dark:border-pink-900/40 animate-pulse" />
        <div className="absolute w-44 h-44 rounded-full bg-pink-50 dark:bg-pink-900/20" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-2xl shadow-pink-500/40">
          <Brain className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute top-4 right-8 bg-background border border-border rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2">
          <Brain className="w-3 h-3 text-pink-500" />
          <span className="text-xs font-semibold text-pink-600 dark:text-pink-300">Summary Gen</span>
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
        <div className="absolute w-64 h-64 rounded-full border-2 border-emerald-100 dark:border-emerald-900/40 animate-pulse" />
        <div className="absolute w-44 h-44 rounded-full bg-emerald-50 dark:bg-emerald-900/20" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
          <Zap className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>
        <div className="absolute bottom-6 flex -space-x-3">
          {['bg-blue-400', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'].map((c, i) => (
            <div key={i} className={\`w-9 h-9 rounded-full \${c} border-2 border-background flex items-center justify-center\`}>
              <Users className="w-4 h-4 text-white" />
            </div>
          ))}
        </div>
        <div className="absolute top-4 right-6 bg-background border border-border rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Context aware</span>
        </div>
      </div>
    ),
  },
];`;
current = current.replace(/const slides = \[.*?\];/s, slidesReplacement);

// 3. Extract marketing sections from temp2.jsx and append them
const sectionStart = oldMarketing.indexOf('<section id="features"');
let sectionEnd = oldMarketing.indexOf('{/* ΓöÇΓöÇ LINK DIALOG');
if (sectionEnd === -1) {
    sectionEnd = oldMarketing.indexOf('{/* ── LINK DIALOG');
}
if (sectionStart !== -1 && sectionEnd !== -1) {
  let marketingHtml = oldMarketing.substring(sectionStart, sectionEnd).trim();
  
  // REMOVE THE EXTRA </div> AT THE END OF MARKETING HTML
  marketingHtml = marketingHtml.replace(/<\/div>\s*$/, '');
  
  // Apply formatting to marketingHtml
  marketingHtml = marketingHtml.replace(/bg-white\/\[0\.03\]/g, 'bg-secondary/50')
    .replace(/bg-white\/\[0\.05\]/g, 'bg-secondary/80')
    .replace(/bg-white\/\[0\.06\]/g, 'border-border')
    .replace(/border-white\/\[0\.08\]/g, 'border-border')
    .replace(/border-white\/\[0\.06\]/g, 'border-border')
    .replace(/bg-\[\#050A15\]\/80/g, 'bg-background/80')
    .replace(/bg-\[\#090E17\]\/50/g, 'bg-background/80')
    .replace(/bg-\[\#111827\]/g, 'bg-card')
    .replace(/text-white/g, 'text-foreground')
    .replace(/text-gray-400/g, 'text-muted-foreground')
    .replace(/text-gray-500/g, 'text-muted-foreground')
    .replace(/text-gray-600/g, 'text-muted-foreground')
    .replace(/text-gray-300/g, 'text-foreground/80')
    .replace(/bg-white\/5/g, 'bg-secondary')
    .replace(/bg-white\/8/g, 'bg-secondary')
    .replace(/bg-white\/10/g, 'bg-secondary')
    .replace(/bg-white\/12/g, 'bg-secondary/80')
    .replace(/bg-white\/15/g, 'bg-secondary/80')
    .replace(/border-white\/5/g, 'border-border')
    .replace(/border-white\/10/g, 'border-border')
    .replace(/border-white\/15/g, 'border-border')
    .replace(/hover:bg-white\/5/g, 'hover:bg-secondary')
    .replace(/text-indigo-400/g, 'text-primary')
    .replace(/bg-indigo-600/g, 'bg-primary')
    .replace(/hover:bg-indigo-500/g, 'hover:bg-primary/90')
    .replace(/shadow-indigo-500\/30/g, 'shadow-primary/30')
    .replace(/shadow-indigo-500\/25/g, 'shadow-primary/25')
    .replace(/shadow-indigo-500\/20/g, 'shadow-primary/20')
    .replace(/shadow-indigo-500\/10/g, 'shadow-primary/10')
    .replace(/from-indigo-600 to-violet-600/g, 'from-primary to-primary')
    .replace(/hover:from-indigo-500 hover:to-violet-500/g, 'hover:from-primary/90 hover:to-primary/90')
    .replace(/border-indigo-500\/40/g, 'border-primary/40')
    .replace(/border-indigo-500\/20/g, 'border-primary/20')
    .replace(/from-indigo-500 to-violet-500/g, 'from-primary to-primary')
    .replace(/from-indigo-600\/20 to-violet-600\/10/g, 'from-primary/20 to-primary/10')
    .replace(/from-indigo-500 to-violet-600/g, 'from-primary to-primary')
    .replace(/border-t border-white\/5/g, 'border-t border-border');

  // Find the exact injection point: `      </main>\n\n      {/* Share Link Dialog */}`
  const injectionPoint = current.match(/<\/main>\s*\{\/\*\s*Share Link Dialog/);
  if (injectionPoint) {
     current = current.replace(
       injectionPoint[0], 
       '</main>\n\n      ' + marketingHtml.replace(/\$/g, '$$$$') + '\n\n      {/* Share Link Dialog'
     );
  } else {
     console.log("Could not find injection point!");
  }
} else {
  console.log("Could not find marketing sections in temp2.jsx!");
}

fs.writeFileSync('src/pages/MeetLandingPage.jsx', current);
console.log('Fix complete.');
