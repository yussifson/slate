const fs = require('fs');
const path = require('path');

// 1. Restore MeetLandingPage
let code = fs.readFileSync('old_meet2.txt', 'utf8');

// Add auth imports and state
code = code.replace(
  'const [currentSlide, setCurrentSlide] = useState(0);',
  'const [currentSlide, setCurrentSlide] = useState(0);\n  const [user, setUser] = useState(null);\n  useEffect(() => {\n    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null));\n    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user || null));\n    return () => subscription.unsubscribe();\n  }, []);'
);

code = code.replace(
  '<div className="w-9 h-9 flex items-center justify-center">\\n            <img src="/orbit-logo.svg" alt="Optavel Logo" className="w-full h-full object-contain" />\\n          </div>',
  '<div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">\\n            <Video className="w-5 h-5" strokeWidth={2.5} />\\n          </div>'
);

code = code.replace(
  '<span>{dateStr}</span>\\n        </div>',
  '<span>{dateStr}</span>\\n        </div>\\n        <div className="flex items-center gap-3 ml-4">\\n          {user ? (\\n            <Button onClick={() => navigate(\'/dashboard\')} variant="default" className="rounded-xl shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">Dashboard</Button>\\n          ) : (\\n            <Button onClick={() => navigate(\'/login\')} variant="outline" className="rounded-xl">Sign In</Button>\\n          )}\\n        </div>'
);

fs.writeFileSync('src/pages/MeetLandingPage.jsx', code);

// 2. Refactor all clipad files to use Tailwind variables
const clipadDir = path.join(__dirname, 'src', 'pages', 'clipad');
const files = fs.readdirSync(clipadDir).filter(f => f.endsWith('.jsx'));

const replacements = [
  { search: /bg-\[\#050A15\]/g, replace: 'bg-background page-enter' },
  { search: /bg-\[\#111827\]/g, replace: 'bg-card' },
  { search: /border-white\/\[0\.06\]/g, replace: 'border-border' },
  { search: /border-white\/10/g, replace: 'border-border' },
  { search: /border-white\/5/g, replace: 'border-border' },
  { search: /text-white/g, replace: 'text-foreground' },
  { search: /text-gray-400/g, replace: 'text-muted-foreground' },
  { search: /text-gray-500/g, replace: 'text-muted-foreground' },
  { search: /text-gray-600/g, replace: 'text-muted-foreground' },
  { search: /bg-white\/5/g, replace: 'bg-secondary' },
  { search: /bg-white\/8/g, replace: 'bg-secondary' },
  { search: /bg-white\/10/g, replace: 'bg-secondary/80' },
  { search: /hover:bg-white\/5/g, replace: 'hover:bg-secondary' },
  { search: /hover:bg-white\/\[0\.03\]/g, replace: 'hover:bg-secondary' },
  { search: /bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500/g, replace: 'bg-primary hover:bg-primary/90' },
  { search: /bg-gradient-to-br from-indigo-500 to-violet-600/g, replace: 'bg-primary' },
  { search: /bg-gradient-to-br from-cyan-500 to-blue-500/g, replace: 'bg-primary' },
  { search: /bg-gradient-to-br from-emerald-500 to-teal-500/g, replace: 'bg-primary' },
  { search: /bg-gradient-to-br from-pink-500 to-rose-500/g, replace: 'bg-primary' },
  { search: /bg-gradient-to-br from-amber-500 to-orange-500/g, replace: 'bg-primary' },
  { search: /shadow-indigo-500\/40/g, replace: 'shadow-primary/40' },
  { search: /shadow-indigo-500\/25/g, replace: 'shadow-primary/25' },
  { search: /shadow-indigo-500\/30/g, replace: 'shadow-primary/30' },
  { search: /text-indigo-400/g, replace: 'text-primary' },
  { search: /text-indigo-300/g, replace: 'text-primary/80' },
  { search: /hover:text-indigo-300/g, replace: 'hover:text-primary/80' },
  { search: /hover:text-indigo-400/g, replace: 'hover:text-primary' },
  { search: /text-cyan-400/g, replace: 'text-primary' },
  { search: /text-cyan-300/g, replace: 'text-primary/80' },
  { search: /hover:text-cyan-300/g, replace: 'hover:text-primary/80' },
  { search: /text-emerald-400/g, replace: 'text-emerald-500' },
  { search: /text-pink-400/g, replace: 'text-primary' },
  { search: /text-pink-300/g, replace: 'text-primary/80' },
  { search: /text-violet-400/g, replace: 'text-primary' },
  { search: /border-indigo-400/g, replace: 'border-primary' },
  { search: /bg-indigo-600/g, replace: 'bg-primary' },
  { search: /hover:bg-indigo-500/g, replace: 'hover:bg-primary/90' },
  { search: /bg-indigo-500/g, replace: 'bg-primary' },
  { search: /bg-emerald-500/g, replace: 'bg-emerald-500' },
  { search: /border-emerald-500/g, replace: 'border-emerald-500' },
];

for (const file of files) {
  // skip CliPadDashboard and CliPadLogin as we just rewrote them perfectly
  if (file === 'CliPadDashboard.jsx' || file === 'CliPadLogin.jsx') continue;
  
  const p = path.join(clipadDir, file);
  let content = fs.readFileSync(p, 'utf8');
  for (const r of replacements) {
    content = content.replace(r.search, r.replace);
  }
  fs.writeFileSync(p, content);
}
console.log('All files processed.');
