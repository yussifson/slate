const fs = require('fs');

const current = fs.readFileSync('src/pages/MeetLandingPage.jsx', 'utf8');
const oldMarketing = fs.readFileSync('temp2.jsx', 'utf8');

let newImports = `import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Video, Keyboard, Sparkles, Copy, Link as LinkIcon, Calendar, ShieldCheck,
  Users, Mic, Brain, BarChart3, Layers, Zap, Play, ChevronRight, ChevronLeft,
  Monitor, Clock, FileText, CheckCircle, ArrowRight, Star, Globe, Plus,
  MessageSquare, Activity, Camera, Wand2, Target, TrendingUp
} from 'lucide-react';
`;

// Find everything from 'const pillars =' up to 'function useLiveClock()'
const startIndex = oldMarketing.indexOf('const pillars =');
const endIndex = oldMarketing.indexOf('function useLiveClock()');
const dataMatch = oldMarketing.substring(startIndex, endIndex);

// Find everything from '<section id="features"' up to '</div>\n\n      {/* ── LINK DIALOG'
const sectionStart = oldMarketing.indexOf('<section id="features"');
const sectionEnd = oldMarketing.indexOf('{/* ΓöÇΓöÇ LINK DIALOG ΓöÇΓöÇ */}'); // It has those weird characters
const marketingHtml = oldMarketing.substring(sectionStart, sectionEnd).trim();

// Add missing icon
const addIcon = `
// Fix icon reference
function MonitorIcon(props) { return <Monitor {...props} />; }
`;

let newCode = current.replace(/(import .*?;[\n\r]*)+/s, newImports + '\n\n' + dataMatch + '\n');

// Append marketingHtml before the closing </main> or </div>
// In current, the structure ends with:
//       </main>
// 
//       {/* Share Link Dialog */}
newCode = newCode.replace(
  '      </main>\n\n      {/* Share Link Dialog */}',
  '      </main>\n\n      ' + marketingHtml.replace(/\$/g, '$$$$') + '\n\n      {/* Share Link Dialog */}'
);

newCode += '\n' + addIcon;

// Replace styles
newCode = newCode.replace(/bg-white\/\[0\.03\]/g, 'bg-secondary/50')
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
  .replace(/from-indigo-500 to-violet-600/g, 'from-primary to-primary');

// Write back
fs.writeFileSync('src/pages/MeetLandingPage.jsx', newCode);
console.log('Merged successfully.');
