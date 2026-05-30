import { useTranslation } from "react-i18next";
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

// Import local SVGs to guarantee loading
import googleLogo from '@/assets/integrations/google.svg';
import microsoftLogo from '@/assets/integrations/microsoft.svg';
import zoomLogo from '@/assets/integrations/zoom.svg';
import slackLogo from '@/assets/integrations/slack.svg';
import quickbooksLogo from '@/assets/integrations/quickbooks.svg';
import docusignLogo from '@/assets/integrations/docusign.svg';
import whatsappLogo from '@/assets/integrations/whatsapp.svg';
import stripeLogo from '@/assets/integrations/stripe.svg';

const INTEGRATION_CATALOG = [
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    provider: 'google',
    category: 'Productivity',
    description: 'Two-way sync for Google Calendar, automatic Google Meet links, and Drive folder generation.',
    logo: googleLogo,
    learnMore: 'https://workspace.google.com/',
    industries: ['all'],
    popular: true
  },
  {
    id: 'microsoft_365',
    name: 'Microsoft 365',
    provider: 'microsoft',
    category: 'Productivity',
    description: 'Sync with Outlook Calendar, auto-generate Microsoft Teams links, and save files to OneDrive.',
    logo: microsoftLogo,
    learnMore: 'https://www.microsoft.com/en-us/microsoft-365',
    industries: ['all', 'corporate'],
    popular: true
  },
  {
    id: 'zoom',
    name: 'Zoom Video',
    provider: 'zoom',
    category: 'Communication',
    description: 'Automatically generate and send Zoom links for client consultations and internal team meetings.',
    logo: zoomLogo,
    learnMore: 'https://zoom.us/',
    industries: ['all'],
    popular: true
  },
  {
    id: 'slack',
    name: 'Slack',
    provider: 'slack',
    category: 'Communication',
    description: 'Receive real-time notifications for new leads, signed documents, and overdue invoices directly in Slack.',
    logo: slackLogo,
    learnMore: 'https://slack.com/',
    industries: ['all', 'law', 'agency'],
    popular: false
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    provider: 'quickbooks',
    category: 'Finance',
    description: 'Automatically push paid invoices, expenses, and client records directly into your QuickBooks ledger.',
    logo: quickbooksLogo,
    learnMore: 'https://quickbooks.intuit.com/',
    industries: ['all', 'law', 'corporate'],
    popular: true
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    provider: 'docusign',
    category: 'Documents',
    description: 'Send contracts, intake forms, and agreements for legally binding e-signatures directly from case files.',
    logo: docusignLogo,
    learnMore: 'https://www.docusign.com/',
    industries: ['law', 'real_estate', 'corporate'],
    popular: true
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    provider: 'twilio',
    category: 'Communication',
    description: 'Send automated SMS and WhatsApp reminders for appointments, hearings, and overdue invoices.',
    logo: whatsappLogo,
    learnMore: 'https://business.whatsapp.com/',
    industries: ['hospital', 'law', 'school', 'church'],
    popular: true
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    provider: 'stripe',
    category: 'Finance',
    description: 'Accept credit card and ACH payments globally with automatic invoice reconciliation.',
    logo: stripeLogo,
    learnMore: 'https://stripe.com/',
    categories: ['all']
  },
  {
    id: 'paystack',
    name: 'Paystack',
    provider: 'paystack',
    category: 'Finance',
    description: 'Accept payments from customers in Africa seamlessly via cards, mobile money, and USSD.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Paystack_Logo.png',
    learnMore: 'https://paystack.com/',
    categories: ['all']
  }
];

export default function Integrations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [connectedApps, setConnectedApps] = useState({});
  const [loadingAppId, setLoadingAppId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      if (!companyId) return;
      try {
        setInitialLoading(true);
        // Fetch from production database
        const { data, error } = await supabase
          .from('connected_apps')
          .select('provider, status')
          .eq('company_id', companyId)
          .eq('status', 'active');

        if (error) {
          // If the table doesn't exist yet, we catch it silently so the UI doesn't crash during development
          console.error("Connected apps fetch error:", error.message);
          setConnectedApps({});
        } else {
          const map = {};
          data?.forEach(app => {
            map[app.provider] = true; // Map provider names to true
          });
          setConnectedApps(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchConnections();
  }, [companyId]);

  // Handle OAuth callback redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const provider = params.get('provider');
    
    if (status && provider) {
      const app = INTEGRATION_CATALOG.find(a => a.provider === provider);
      const appName = app ? app.name : provider;
      
      if (status === 'success' || status === 'mock_success') {
        toast({
          title: "Connection Successful",
          description: `You have successfully securely linked ${appName}.`,
          variant: "default"
        });
        
        // Optimistically update the UI
        setConnectedApps(prev => ({ ...prev, [provider]: true }));
      } else if (status === 'error') {
        const message = params.get('message')?.replace(/_/g, ' ') || 'An unknown error occurred.';
        toast({
          title: "Connection Failed",
          description: `Failed to connect ${appName}: ${message}`,
          variant: "destructive"
        });
      }

      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const handleConnect = async (app) => {
    if (!companyId) return;
    setLoadingAppId(app.id);
    
    toast({
      title: "Connecting to " + app.name,
      description: "Redirecting you to the secure authorization portal...",
    });

    // In production, we redirect to our Edge Function which handles the OAuth Init flow
    // Replace YOUR_SUPABASE_URL with your actual project URL when deployed
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
    const returnUrl = encodeURIComponent(window.location.href);
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/oauth-init?provider=${app.provider}&company_id=${companyId}&return_url=${returnUrl}`;
    
    // Redirect the user
    setTimeout(() => {
      window.location.href = edgeFunctionUrl;
    }, 1500);
  };

  const handleDisconnect = async (app) => {
    if (!companyId) return;
    setLoadingAppId(app.id);
    
    try {
      // Remove from production database
      const { error } = await supabase
        .from('connected_apps')
        .delete()
        .match({ company_id: companyId, provider: app.provider });

      if (error) throw error;

      const newConnections = { ...connectedApps };
      delete newConnections[app.provider];
      setConnectedApps(newConnections);
      
      toast({
        title: "Integration Removed",
        description: `${app.name} access has been securely revoked.`,
        variant: "destructive"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disconnect app: " + err.message,
        variant: "destructive"
      });
    } finally {
      setLoadingAppId(null);
    }
  };

  const handleTestSync = async (app) => {
    if (!companyId) return;
    setLoadingAppId(app.id);
    
    toast({
      title: "Syncing Calendar...",
      description: `Pushing a test event to ${app.name}...`,
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          companyId,
          provider: app.provider,
          eventDetails: {
            title: "Optalflow Test Sync Event",
            description: "This is an automated test event to verify the two-way calendar sync.",
            start: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            end: new Date(Date.now() + 7200000).toISOString(),   // 2 hours from now
          }
        })
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to sync calendar");
      }

      toast({
        title: "Sync Successful!",
        description: `Check your ${app.name} calendar. The test event has been added.`,
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Sync Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoadingAppId(null);
    }
  };

  const handleTestFeature = async (app) => {
    if (!companyId) return;
    setLoadingAppId(app.id);
    
    toast({
      title: `Testing ${app.name}...`,
      description: `Triggering automation feature...`,
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
      const { data: { session } } = await supabase.auth.getSession();
      
      let endpoint = '';
      let payload = { companyId, provider: app.provider };

      if (app.provider === 'zoom') {
        endpoint = 'generate-meeting';
        payload.topic = "Optalflow Test Meeting";
        payload.duration = 30;
      } else if (app.provider === 'slack' || app.provider === 'twilio') {
        endpoint = 'notify-team';
        payload.message = `Hello from Optalflow! This is an automated test notification at ${new Date().toLocaleTimeString()}`;
        if (app.provider === 'twilio') payload.recipientPhone = "+1234567890";
        if (app.provider === 'slack') payload.channel = "#general";
      } else if (app.provider === 'stripe' || app.provider === 'paystack') {
        endpoint = 'process-payment';
        payload.amount = 100.00;
        payload.currency = app.provider === 'stripe' ? 'usd' : 'NGN';
        payload.customerEmail = "test@optalflow.com";
      } else if (app.provider === 'quickbooks') {
        endpoint = 'sync-invoice';
        payload.invoiceDetails = { amount: 500.00 };
      } else if (app.provider === 'docusign') {
        endpoint = 'send-contract';
        payload.documentName = "Optalflow Demo Contract";
        payload.signerEmail = "test@optalflow.com";
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to test ${app.name}`);
      }

      toast({
        title: "Test Successful!",
        description: data.paymentUrl ? `Generated Payment URL!` : `Integration tested successfully!`,
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Test Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoadingAppId(null);
    }
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
            <ShieldCheck className="w-3.5 h-3.5" /> {t("secure_oauth_2_0", "Secure OAuth 2.0")}
          </Badge>
          <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-blue-600">
            <HelpCircle className="w-4 h-4 mr-1.5" /> {t("api_docs", "API Docs")}
          </Button>
        </div>
      </div>
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm dark:shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map(cat => {
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search apps or features..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl w-full focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>
      </div>
      {/* Integration Grid */}
      {initialLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredApps.map((app) => {
            // Check connected status via the `provider` key, not `id`
            const isConnected = !!connectedApps[app.provider];
            const isLoading = loadingAppId === app.id;

            return (
              <div 
                key={app.id} 
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
                  isConnected 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20' 
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1'
                }`}
              >
                <div className="p-6 sm:p-7 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 shadow-sm dark:shadow-md group-hover:scale-105 transition-transform">
                      <img 
                        src={app.logo} 
                        alt={app.name} 
                        className="w-full h-full object-contain" 
                        onError={(e) => {
                          // Fallback if Clearbit fails
                          e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Appuse-icon.png';
                        }}
                      />
                    </div>
                    {isConnected && (
                      <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-extrabold gap-1.5 px-3 py-1.5 rounded-full shadow-sm">
                        <CheckCircle2 className="w-4 h-4" /> {t("connected", "Connected")}
                      </Badge>
                    )}
                    {!isConnected && app.popular && (
                      <Badge variant="outline" className="text-xs font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                        {t("popular", "Popular")}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5">{app.name}</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3.5">{app.category}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{app.description}</p>
                </div>
                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between">
                  <a 
                    href={app.learnMore} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                  >
                    {t("learn_more", "Learn more")} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  
                  {isConnected ? (
                    <div className="flex gap-2">
                      {(app.provider === 'google' || app.provider === 'microsoft') && (
                        <Button 
                          variant="secondary" 
                          disabled={isLoading}
                          onClick={() => handleTestSync(app)}
                          className="h-10 px-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-bold transition-colors shadow-sm"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Sync"}
                        </Button>
                      )}
                      {(app.provider === 'zoom' || app.provider === 'slack' || app.provider === 'twilio' || app.provider === 'stripe' || app.provider === 'paystack' || app.provider === 'quickbooks' || app.provider === 'docusign') && (
                        <Button 
                          variant="secondary" 
                          disabled={isLoading}
                          onClick={() => handleTestFeature(app)}
                          className="h-10 px-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 font-bold transition-colors shadow-sm"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Feature"}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        disabled={isLoading}
                        onClick={() => handleDisconnect(app)}
                        className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-colors font-bold shadow-sm"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      disabled={isLoading}
                      onClick={() => handleConnect(app)}
                      className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20 transition-all hover:translate-y-[-1px]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {t("connect", "Connect")} <Link2 className="w-4 h-4 ml-2 opacity-80" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!initialLoading && filteredApps.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">{t("no_apps_found", "No apps found")}</h3>
          <p className="text-slate-500 max-w-md leading-relaxed">{t(
            "we_couldn_t_find_any_integrati",
            "We couldn't find any integrations matching your search criteria. Try a different term or clear your filters."
          )}</p>
        </div>
      )}
    </div>
  );
}
