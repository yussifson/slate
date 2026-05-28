import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle2, Link2, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';

const INTEGRATION_CATALOG = [
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    provider: 'google',
    category: 'Productivity',
    description: 'Two-way sync for Google Calendar, automatic Google Meet links, and Drive folder generation.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
    industries: ['all'],
    popular: true
  },
  {
    id: 'microsoft_365',
    name: 'Microsoft 365',
    provider: 'microsoft',
    category: 'Productivity',
    description: 'Sync with Outlook Calendar, auto-generate Microsoft Teams links, and save files to OneDrive.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    industries: ['all', 'corporate'],
    popular: true
  },
  {
    id: 'zoom',
    name: 'Zoom Video',
    provider: 'zoom',
    category: 'Communication',
    description: 'Automatically generate and send Zoom links for client consultations and internal team meetings.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg',
    industries: ['all'],
    popular: true
  },
  {
    id: 'slack',
    name: 'Slack',
    provider: 'slack',
    category: 'Communication',
    description: 'Receive real-time notifications for new leads, signed documents, and overdue invoices directly in Slack channels.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
    industries: ['all', 'law', 'agency'],
    popular: false
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    provider: 'quickbooks',
    category: 'Finance',
    description: 'Automatically push paid invoices, expenses, and client records directly into your QuickBooks ledger.',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/9a/QuickBooks_logo.svg',
    industries: ['all', 'law', 'corporate'],
    popular: true
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    provider: 'docusign',
    category: 'Documents',
    description: 'Send contracts, intake forms, and agreements for legally binding e-signatures directly from case files.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/DocuSign_logo.svg',
    industries: ['law', 'real_estate', 'corporate'],
    popular: true
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    provider: 'twilio',
    category: 'Communication',
    description: 'Send automated SMS and WhatsApp reminders for appointments, hearings, and overdue invoices.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    industries: ['hospital', 'law', 'school', 'church'],
    popular: true
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    provider: 'stripe',
    category: 'Finance',
    description: 'Accept credit card and ACH payments globally with automatic invoice reconciliation.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
    industries: ['all'],
    popular: true
  }
];

export default function Integrations() {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [connectedApps, setConnectedApps] = useState({});
  const [loadingAppId, setLoadingAppId] = useState(null);

  // In a real implementation, we would fetch the user's connected apps from the Supabase `connected_apps` table.
  // For now, we mock the local state.
  useEffect(() => {
    // Mock fetching connection state
    const fetchConnections = async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      // Read from local storage as a temporary mock for the demo
      const saved = localStorage.getItem(`optalflow_integrations_${companyId}`);
      if (saved) {
        setConnectedApps(JSON.parse(saved));
      } else {
        // Pre-connect Stripe if they already did billing setup
        setConnectedApps({ stripe: true });
      }
    };
    if (companyId) fetchConnections();
  }, [companyId]);

  const handleConnect = async (app) => {
    setLoadingAppId(app.id);
    
    // Simulate OAuth Redirect Flow
    toast({
      title: "Connecting to " + app.name,
      description: "Redirecting you to the secure authorization portal...",
    });

    setTimeout(() => {
      // In production, this sets window.location.href = `https://api.optalflow.com/oauth/${app.provider}?company_id=${companyId}`
      // For this interactive demo, we simulate a successful OAuth callback return.
      const newConnections = { ...connectedApps, [app.id]: true };
      setConnectedApps(newConnections);
      localStorage.setItem(`optalflow_integrations_${companyId}`, JSON.stringify(newConnections));
      
      toast({
        title: "Integration Successful",
        description: `${app.name} has been successfully connected to your workspace.`,
      });
      setLoadingAppId(null);
    }, 2500);
  };

  const handleDisconnect = async (app) => {
    setLoadingAppId(app.id);
    
    setTimeout(() => {
      const newConnections = { ...connectedApps };
      delete newConnections[app.id];
      setConnectedApps(newConnections);
      localStorage.setItem(`optalflow_integrations_${companyId}`, JSON.stringify(newConnections));
      
      toast({
        title: "Integration Removed",
        description: `${app.name} access has been securely revoked.`,
        variant: "destructive"
      });
      setLoadingAppId(null);
    }, 1500);
  };

  const filteredApps = INTEGRATION_CATALOG.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(INTEGRATION_CATALOG.map(a => a.category))];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title="App Marketplace" 
          subtitle="Connect Optalflow with the tools your team already uses." 
        />
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-8 gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure OAuth 2.0
          </Badge>
          <Button variant="ghost" size="sm" className="h-8 text-slate-500">
            <HelpCircle className="w-4 h-4 mr-1.5" /> API Docs
          </Button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search apps or features..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl w-full focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredApps.map((app) => {
          const isConnected = !!connectedApps[app.id];
          const isLoading = loadingAppId === app.id;

          return (
            <div 
              key={app.id} 
              className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col ${
                isConnected ? 'border-primary/40 shadow-md ring-1 ring-primary/10' : 'border-border shadow-sm hover:shadow-md hover:border-slate-300'
              }`}
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2.5 shadow-sm">
                    <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />
                  </div>
                  {isConnected && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold gap-1 pl-1.5 pr-2.5 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </Badge>
                  )}
                  {!isConnected && app.popular && (
                    <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20 bg-primary/5">
                      Popular
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-1">{app.name}</h3>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">{app.category}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{app.description}</p>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between">
                <a href="#" className="text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors">
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
                
                {isConnected ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleDisconnect(app)}
                    className="h-9 px-4 rounded-lg border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors font-semibold"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleConnect(app)}
                    className="h-9 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition-all hover:shadow"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Connect <Link2 className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredApps.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No apps found</h3>
          <p className="text-slate-500 max-w-md">We couldn't find any integrations matching your search criteria. Try a different term or clear your filters.</p>
        </div>
      )}
    </div>
  );
}
