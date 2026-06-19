import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import React, { useState, useEffect} from 'react';
import { useAuth} from '@/lib/AuthContext';
import { getTerm} from "@/config/industries";
import { useCompanyId} from '@/hooks/useCompanyId';
import { Button} from '@/components/ui/button';
import { Badge} from '@/components/ui/badge';
import { Input} from '@/components/ui/input';
import {Search,, CheckCircle2, Link2, ExternalLink, ShieldCheck, HelpCircle} from "lucide-react";
import PageHeader from '@/components/shared/PageHeader';
import { useToast} from '@/components/ui/use-toast';
import { powerSync} from "@/api/PowerSyncConnector";
import { Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Label} from "@/components/ui/label";

// Import local SVGs to guarantee loading
import googleLogo from '@/assets/integrations/google.svg';
import microsoftLogo from '@/assets/integrations/microsoft.svg';
import zoomLogo from '@/assets/integrations/zoom.svg';
import slackLogo from '@/assets/integrations/slack.svg';
import quickbooksLogo from '@/assets/integrations/quickbooks.svg';
import docusignLogo from '@/assets/integrations/docusign.svg';
import whatsappLogo from '@/assets/integrations/whatsapp.svg';
import stripeLogo from '@/assets/integrations/stripe.svg';
import mailchimpLogo from '@/assets/integrations/mailchimp.svg';
import shipstationLogo from '@/assets/integrations/shipstation.svg';
import { OrbitLoader } from "@/components/ui/orbit-loader";

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
 industries: ['hospital', 'law', 'school', 'religion'],
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
},
 {
 id: 'mailchimp',
 name: 'Mailchimp',
 provider: 'mailchimp',
 category: 'Marketing',
 description: 'Sync your customer segments and automatically trigger email campaigns for new purchases.',
 logo: mailchimpLogo,
 learnMore: 'https://mailchimp.com/',
 categories: ['retail']
},
 {
 id: 'shipstation',
 name: 'ShipStation',
 provider: 'shipstation',
 category: 'Logistics',
 description: 'Automatically generate shipping labels and live carrier rates when orders are placed.',
 logo: shipstationLogo,
 learnMore: 'https://www.shipstation.com/',
 categories: ['retail']
}
];

export default function Integrations() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const activeIndustry = user?.company_industry || "law";
 const companyId = useCompanyId();
 const { toast} = useToast();

 const [searchQuery, setSearchQuery] = useState('');
 const [activeCategory, setActiveCategory] = useState('All');
 const [connectedApps, setConnectedApps] = useState({});
 const [loadingAppId, setLoadingAppId] = useState(null);
 const [initialLoading, setInitialLoading] = useState(true);
 const [modalApp, setModalApp] = useState(null);
 const [modalForm, setModalForm] = useState({});

 useEffect(() => {
 const fetchConnections = async () => {
 if (!companyId) return;
 try {
 setInitialLoading(true);
 // Fetch from production database
 const { data, error} = await supabase
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
 setConnectedApps(prev => ({ ...prev, [provider]: true}));
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
 
 const CREDENTIALS_PROVIDERS = ['stripe', 'paystack', 'twilio', 'docusign', 'mailchimp', 'shipstation'];
 if (CREDENTIALS_PROVIDERS.includes(app.provider)) {
 setModalApp(app);
 try {
 const { data} = await supabase
 .from('connected_apps')
 .select('access_token')
 .eq('company_id', companyId)
 .eq('provider', app.provider)
 .eq('status', 'active')
 .maybeSingle();

 if (data?.access_token) {
 try {
 setModalForm(JSON.parse(data.access_token));
} catch (e) {
 setModalForm({ secret_key: data.access_token || ""});
}
} else {
 setModalForm({});
}
} catch (err) {
 console.error("Failed to load existing keys:", err);
 setModalForm({});
}
 return;
}

 setLoadingAppId(app.id);
 
 toast({
 title: "Connecting to " + app.name,
 description: "Redirecting you to the secure authorization portal...",
});

 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
 const returnUrl = encodeURIComponent(window.location.href);
 const edgeFunctionUrl = `${supabaseUrl}/functions/v1/oauth-init?provider=${app.provider}&company_id=${companyId}&return_url=${returnUrl}`;
 
 setTimeout(() => {
 window.location.href = edgeFunctionUrl;
}, 1500);
};

 const handleSaveCredentials = async () => {
 if (!companyId || !modalApp) return;
 setLoadingAppId(modalApp.id);
 try {
 const { error} = await supabase
 .from('connected_apps')
 .upsert({
 company_id: companyId,
 provider: modalApp.provider,
 access_token: JSON.stringify(modalForm),
 status: 'active',
 updated_at: new Date().toISOString()
}, { onConflict: 'company_id,provider'});

 if (error) throw error;

 setConnectedApps(prev => ({
 ...prev,
 [modalApp.provider]: true
}));

 toast({
 title: "Integration Connected",
 description: `Successfully configured production API credentials for ${modalApp.name}.`,
});
 setModalApp(null);
} catch (err) {
 toast({
 title: "Connection Failed",
 description: err.message,
 variant: "destructive"
});
} finally {
 setLoadingAppId(null);
}
};

 const handleDisconnect = async (app) => {
 if (!companyId) return;
 setLoadingAppId(app.id);
 
 try {
 // Remove from production database
 const { error} = await supabase
 .from('connected_apps')
 .delete()
 .match({ company_id: companyId, provider: app.provider});

 if (error) throw error;

 const newConnections = { ...connectedApps};
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
 const { data: { session}} = await supabase.auth.getSession();
 
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
 title: "Slate Test Sync Event",
 description: "This is an automated test event to verify the two-way calendar sync.",
 start: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
 end: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
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
 const { data: { session}} = await supabase.auth.getSession();
 
 let endpoint = '';
 let payload = { companyId, provider: app.provider};

 if (app.provider === 'zoom') {
 endpoint = 'generate-meeting';
 payload.topic = "Slate Test Meeting";
 payload.duration = 30;
} else if (app.provider === 'slack' || app.provider === 'twilio') {
 endpoint = 'notify-team';
 payload.message = `Hello from Slate! This is an automated test notification at ${new Date().toLocaleTimeString()}`;
 if (app.provider === 'twilio') payload.recipientPhone = "+1234567890";
 if (app.provider === 'slack') payload.channel = "#general";
} else if (app.provider === 'stripe' || app.provider === 'paystack') {
 endpoint = 'process-payment';
 payload.amount = 100.00;
 payload.currency = app.provider === 'stripe' ? 'usd' : 'NGN';
 payload.customerEmail = "test@slate.com";
} else if (app.provider === 'quickbooks') {
 endpoint = 'sync-invoice';
 payload.invoiceDetails = { amount: 500.00};
} else if (app.provider === 'docusign') {
 endpoint = 'send-contract';
 payload.documentName = "Slate Demo Contract";
 payload.signerEmail = "test@slate.com";
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
 subtitle="Connect Slate with the tools your team already uses." 
 />
 <div className="flex items-center gap-3">
 <Badge variant="outline" className="h-8 gap-2.5 bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20">
 <ShieldCheck className="w-3.5 h-3.5" /> {t("secure_oauth_2_0", "Secure OAuth 2.0")}
 </Badge>
 </div>
 </div>
 {/* Top Filter Bar */}
 <div className="bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-slate-900/50 dark:backdrop-blur-xl rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 p-4 flex flex-col md:flex-row gap-4 items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
 {categories.map(cat => {
 return (
 <button
 key={cat}
 onClick={() => setActiveCategory(cat)}
 className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
 activeCategory === cat 
 ? 'bg-primary text-white -emerald-600/20' 
 : 'bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 hover:bg-slate-100 dark:hover:bg-slate-700'
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
 className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border-primary/40 dark:border-primary/40 text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white placeholder:text-slate-400 rounded-xl w-full focus:bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:focus:bg-slate-800 transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>
 {/* Integration Grid */}
 {initialLoading ? (
 <div className="py-24 flex justify-center">
 <OrbitLoader size="md" />
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {filteredApps.map((app) => {
 // Check connected status via the `provider` key, not `id`
 const isConnected = !!connectedApps[app.provider];
 const isLoading = loadingAppId === app.id;
 
 let appDescription = app.description;
 if (app.id === 'docusign') {
 appDescription = "Send contracts, agreements, and forms for legally binding e-signatures directly from " + getTerm(activeIndustry, "case").toLowerCase() + " records.";
} else if (app.id === 'whatsapp_business') {
 appDescription = "Send automated SMS and WhatsApp reminders for " + getTerm(activeIndustry, "hearing").toLowerCase() + "s and billing notifications.";
}

 return (
 <div 
 key={app.id} 
 className={`bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-slate-900 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 transition-all duration-300 flex flex-col overflow-hidden ${
 isConnected 
 ? 'border-primary -emerald-500/10 ring-1 ring-primary/20' 
 : 'border-primary/40 dark:border-primary/40 hover:border-primary/40 dark:hover:border-primary/40 hover:-translate-y-1'
}`}
 >
 <div className="p-6 sm:p-7 flex-1">
 <div className="flex justify-between items-start mb-6">
 <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 flex items-center justify-center p-3 group-hover:scale-105 transition-transform hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
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
 <Badge className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-100 text-primary/90 dark:text-primary/70 border-primary/20 dark:border-primary/20 font-extrabold gap-2.5 px-3 py-1.5 rounded-full ">
 <CheckCircle2 className="w-4 h-4" /> {t("connected", "Connected")}
 </Badge>
 )}
 {!isConnected && app.popular && (
 <Badge variant="outline" className="text-xs font-semibold text-primary dark:text-primary/70 border-primary/20 dark:border-primary/20 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-100 px-3 py-1 rounded-full tracking-[0.04em]">
 {t("popular", "Popular")}
 </Badge>
 )}
 </div>
 
 <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 dark:text-slate-100 dark:text-white mb-1.5">{app.name}</h3>
 <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3.5 tracking-[0.04em]">{app.category}</p>
 <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{appDescription}</p>
 </div>
 <div className="px-6 py-5 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between">
 <a 
 href={app.learnMore} 
 target="_blank" 
 rel="noopener noreferrer"
 className="text-sm font-semibold text-primary dark:text-primary hover:text-primary/80 dark:hover:text-primary/70 flex items-center gap-2.5 transition-colors"
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
 className="h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-100 text-primary/90 dark:text-primary/70 hover:bg-slate-100 dark:hover:bg-primary/20 font-semibold transition-colors "
 >
 {isLoading ? <OrbitLoader size="sm" /> : "Test Sync"}
 </Button>
 )}
 {(app.provider === 'zoom' || app.provider === 'slack' || app.provider === 'twilio' || app.provider === 'stripe' || app.provider === 'paystack' || app.provider === 'quickbooks' || app.provider === 'docusign') && (
 <Button 
 variant="secondary" 
 disabled={isLoading}
 onClick={() => handleTestFeature(app)}
 className="h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-100 text-primary/90 dark:text-primary/70 hover:bg-slate-100 dark:hover:bg-primary/20 font-semibold transition-colors "
 >
 {isLoading ? <OrbitLoader size="sm" /> : "Test Feature"}
 </Button>
 )}
 <Button 
 variant="outline" 
 disabled={isLoading}
 onClick={() => handleDisconnect(app)}
 className="h-10 px-4 rounded-xl border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-transparent text-slate-700 dark:text-slate-300 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10/10 hover:border-red-200 dark:hover:border-red-500/20 transition-colors font-semibold  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 {isLoading ? <OrbitLoader size="sm" /> : "Disconnect"}
 </Button>
 </div>
 ) : (
 <Button 
 disabled={isLoading}
 onClick={() => handleConnect(app)}
 className="h-10 px-6 rounded-xl bg-primary hover:bg-primary text-white font-semibold -emerald-600/20 transition-all hover:translate-y-[-1px]"
 >
 {isLoading ? (
 <OrbitLoader size="sm" />
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
 <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 border-dashed hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40">
 <Search className="w-8 h-8 text-slate-400" />
 </div>
 <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 dark:text-slate-100 mb-2">{t("no_apps_found", "No apps found")}</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">{t(
 "we_couldn_t_find_any_integrati",
 "We couldn't find any integrations matching your search criteria. Try a different term or clear your filters."
 )}</p>
 </div>
 )}
 <Dialog open={!!modalApp} onOpenChange={(open) => !open && setModalApp(null)}>
 <DialogContent className="max-w-md bg-white dark:bg-slate-900/40 dark:bg-slate-900/40 dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 rounded-2xl p-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <DialogHeader>
 <DialogTitle className="text-xl font-semibold text-slate-950 dark:text-white">
 Connect {modalApp?.name}
 </DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-4 text-slate-950 dark:text-white">
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
 Configure your production credentials to securely integrate {modalApp?.name} into your active workflow.
 </p>

 {modalApp?.provider === 'stripe' && (
 <>
 <div className="space-y-1.5">
 <Label>Stripe Publishable Key</Label>
 <Input 
 placeholder="pk_live_..." 
 value={modalForm.public_key || ""} 
 onChange={e => setModalForm(p => ({ ...p, public_key: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Stripe Secret Key</Label>
 <Input 
 type="password"
 placeholder="sk_live_..." 
 value={modalForm.secret_key || ""} 
 onChange={e => setModalForm(p => ({ ...p, secret_key: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Stripe Webhook Secret (Optional)</Label>
 <Input 
 type="password"
 placeholder="whsec_..." 
 value={modalForm.webhook_secret || ""} 
 onChange={e => setModalForm(p => ({ ...p, webhook_secret: e.target.value}))}
 />
 </div>
 </>
 )}

 {modalApp?.provider === 'paystack' && (
 <>
 <div className="space-y-1.5">
 <Label>Paystack Public Key</Label>
 <Input 
 placeholder="pk_live_..." 
 value={modalForm.public_key || ""} 
 onChange={e => setModalForm(p => ({ ...p, public_key: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Paystack Secret Key</Label>
 <Input 
 type="password"
 placeholder="sk_live_..." 
 value={modalForm.secret_key || ""} 
 onChange={e => setModalForm(p => ({ ...p, secret_key: e.target.value}))}
 />
 </div>
 </>
 )}

 {modalApp?.provider === 'twilio' && (
 <>
 <div className="space-y-1.5">
 <Label>Twilio Account SID</Label>
 <Input 
 placeholder="AC..." 
 value={modalForm.account_sid || ""} 
 onChange={e => setModalForm(p => ({ ...p, account_sid: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Twilio Auth Token</Label>
 <Input 
 type="password"
 placeholder="Auth Token" 
 value={modalForm.auth_token || ""} 
 onChange={e => setModalForm(p => ({ ...p, auth_token: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Twilio Phone Number / Sender ID</Label>
 <Input 
 placeholder="+15551234567" 
 value={modalForm.from_number || ""} 
 onChange={e => setModalForm(p => ({ ...p, from_number: e.target.value}))}
 />
 </div>
 </>
 )}

 {modalApp?.provider === 'docusign' && (
 <>
 <div className="space-y-1.5">
 <Label>DocuSign Integration Key (Client ID)</Label>
 <Input 
 placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
 value={modalForm.client_id || ""} 
 onChange={e => setModalForm(p => ({ ...p, client_id: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>DocuSign API Username (User ID)</Label>
 <Input 
 placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
 value={modalForm.user_id || ""} 
 onChange={e => setModalForm(p => ({ ...p, user_id: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>DocuSign RSA Private Key</Label>
 <Input 
 type="password"
 placeholder="-----BEGIN RSA PRIVATE KEY-----" 
 value={modalForm.private_key || ""} 
 onChange={e => setModalForm(p => ({ ...p, private_key: e.target.value}))}
 />
 </div>
 </>
 )}

 {modalApp?.provider === 'mailchimp' && (
 <>
 <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2 tracking-[0.04em]">Instructions: In Mailchimp, go to Profile &gt; Extras &gt; API keys to create a new key.</p>
 <div className="space-y-1.5">
 <Label>Mailchimp API Key</Label>
 <Input 
 type="password"
 placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-usX" 
 value={modalForm.api_key || ""} 
 onChange={e => setModalForm(p => ({ ...p, api_key: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>Data Center Prefix (e.g. us1, us20)</Label>
 <Input 
 placeholder="us1" 
 value={modalForm.datacenter || ""} 
 onChange={e => setModalForm(p => ({ ...p, datacenter: e.target.value}))}
 />
 </div>
 </>
 )}

 {modalApp?.provider === 'shipstation' && (
 <>
 <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2 tracking-[0.04em]">Instructions: In ShipStation, go to Settings &gt; Account &gt; API Settings to generate your Key and Secret.</p>
 <div className="space-y-1.5">
 <Label>ShipStation API Key</Label>
 <Input 
 placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
 value={modalForm.api_key || ""} 
 onChange={e => setModalForm(p => ({ ...p, api_key: e.target.value}))}
 />
 </div>
 <div className="space-y-1.5">
 <Label>ShipStation API Secret</Label>
 <Input 
 type="password"
 placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
 value={modalForm.api_secret || ""} 
 onChange={e => setModalForm(p => ({ ...p, api_secret: e.target.value}))}
 />
 </div>
 </>
 )}
 </div>
 <div className="flex justify-end gap-2.5 mt-4">
 <Button variant="ghost" onClick={() => setModalApp(null)}>Cancel</Button>
 <Button onClick={handleSaveCredentials} disabled={loadingAppId === modalApp?.id} className="bg-primary hover:bg-primary text-white font-semibold px-5">
 {loadingAppId === modalApp?.id ? <OrbitLoader size="sm" /> : "Save Connection"}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
