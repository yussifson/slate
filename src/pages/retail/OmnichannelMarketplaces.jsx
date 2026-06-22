import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ShoppingBag, Globe, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OmnichannelMarketplaces() {
  const [integrations, setIntegrations] = useState([
    { id: 'amazon', name: 'Amazon Seller Central', icon: '🛒', connected: false, apiKey: '' },
    { id: 'ebay', name: 'eBay Marketplace', icon: '🏷️', connected: false, apiKey: '' },
    { id: 'instagram', name: 'Instagram Commerce', icon: '📸', connected: false, apiKey: '' },
  ]);

  const handleConnect = (id) => {
    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        if (!int.connected && !int.apiKey) {
          toast.error(`Please provide an API Key for ${int.name}`);
          return int;
        }
        const newStatus = !int.connected;
        toast.success(`${int.name} ${newStatus ? 'Connected' : 'Disconnected'}`);
        return { ...int, connected: newStatus };
      }
      return int;
    }));
  };

  const updateApiKey = (id, key) => {
    setIntegrations(prev => prev.map(int => int.id === id ? { ...int, apiKey: key } : int));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Share2 className="w-8 h-8 text-primary" />
          Marketplace Integrations
        </h1>
        <p className="text-slate-500 mt-2">Sync your inventory and orders across global marketplaces.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((int) => (
          <Card key={int.id} className={`border-2 ${int.connected ? 'border-primary' : 'border-slate-200'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <span>{int.icon}</span> {int.name}
              </CardTitle>
              <CardDescription>
                Sync inventory and pull orders from {int.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Status</span>
                <Switch 
                  checked={int.connected} 
                  onCheckedChange={() => handleConnect(int.id)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API / Access Token</label>
                <Input 
                  type="password" 
                  placeholder="Paste your token here..." 
                  value={int.apiKey}
                  onChange={(e) => updateApiKey(int.id, e.target.value)}
                  disabled={int.connected}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant={int.connected ? 'destructive' : 'default'} 
                className="w-full"
                onClick={() => handleConnect(int.id)}
              >
                {int.connected ? 'Disconnect' : 'Connect Account'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
