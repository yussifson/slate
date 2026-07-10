import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Settings, Shield, Paintbrush, Link2, Download, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function CliPadSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('branding');
  const [isSaving, setIsSaving] = useState(false);

  // Mock settings state
  const [settings, setSettings] = useState({
    brandColor: '#4f46e5',
    logoUrl: '',
    requirePasscode: false,
    enableSalesforce: false,
    enableHubspot: false
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: 'Settings Saved', description: 'Your CliPad workspace settings have been updated.' });
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-8 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground mt-1">Manage branding, security policies, and integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <Button 
            variant={activeTab === 'branding' ? 'default' : 'ghost'} 
            className="justify-start gap-3"
            onClick={() => setActiveTab('branding')}
          >
            <Paintbrush className="w-4 h-4" /> Branding
          </Button>
          <Button 
            variant={activeTab === 'security' ? 'default' : 'ghost'} 
            className="justify-start gap-3"
            onClick={() => setActiveTab('security')}
          >
            <Shield className="w-4 h-4" /> Security & Policies
          </Button>
          <Button 
            variant={activeTab === 'integrations' ? 'default' : 'ghost'} 
            className="justify-start gap-3"
            onClick={() => setActiveTab('integrations')}
          >
            <Link2 className="w-4 h-4" /> Integrations
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border rounded-2xl p-6 shadow-sm">
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-semibold">Custom Branding</h3>
                <p className="text-sm text-muted-foreground mb-4">Make your waiting room and meetings feel like your own brand.</p>
                <div className="grid gap-4 max-w-sm">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Color</label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-16 h-10 p-1" value={settings.brandColor} onChange={e => setSettings({...settings, brandColor: e.target.value})} />
                      <Input type="text" value={settings.brandColor} onChange={e => setSettings({...settings, brandColor: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input placeholder="https://..." value={settings.logoUrl} onChange={e => setSettings({...settings, logoUrl: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-semibold">Security Policies</h3>
                <p className="text-sm text-muted-foreground mb-4">Configure access controls for your workspace.</p>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 rounded border-primary" checked={settings.requirePasscode} onChange={e => setSettings({...settings, requirePasscode: e.target.checked})} />
                    <div>
                      <div className="font-semibold text-sm">Require Passcode for External Guests</div>
                      <div className="text-xs text-muted-foreground">Force guests to enter a PIN before joining the waiting room.</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 rounded border-primary" checked={true} readOnly />
                    <div>
                      <div className="font-semibold text-sm">End-to-End Encryption</div>
                      <div className="text-xs text-muted-foreground">E2EE is enabled by default for all 1:1 calls.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-semibold">CRM & Integrations</h3>
                <p className="text-sm text-muted-foreground mb-4">Connect CliPad to your existing workflows.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  
                  <div className={`p-6 border rounded-2xl flex flex-col items-start gap-4 transition-colors ${settings.enableSalesforce ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="font-bold text-lg flex items-center gap-2">Salesforce</div>
                      {settings.enableSalesforce && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">Automatically log meeting summaries, AI action items, and call records to Salesforce contacts.</p>
                    <Button 
                      variant={settings.enableSalesforce ? "outline" : "default"}
                      onClick={() => setSettings({...settings, enableSalesforce: !settings.enableSalesforce})}
                    >
                      {settings.enableSalesforce ? 'Disconnect' : 'Connect Salesforce'}
                    </Button>
                  </div>

                  <div className={`p-6 border rounded-2xl flex flex-col items-start gap-4 transition-colors ${settings.enableHubspot ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="font-bold text-lg flex items-center gap-2">HubSpot</div>
                      {settings.enableHubspot && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">Sync async videos and meeting notes directly to HubSpot deals and tickets.</p>
                    <Button 
                      variant={settings.enableHubspot ? "outline" : "default"}
                      onClick={() => setSettings({...settings, enableHubspot: !settings.enableHubspot})}
                    >
                      {settings.enableHubspot ? 'Disconnect' : 'Connect HubSpot'}
                    </Button>
                  </div>

                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
