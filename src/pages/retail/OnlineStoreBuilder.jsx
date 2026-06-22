import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { powerSync } from '@/lib/powersync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Paintbrush, Globe, Save, Layout, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function OnlineStoreBuilder() {
  const { user } = useAuth();
  const [storefront, setStorefront] = useState(null);
  const [theme, setTheme] = useState({
    primaryColor: '#000000',
    fontFamily: 'Inter',
    heroText: 'Welcome to our store',
  });
  const [domain, setDomain] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;
    loadStorefront(user.company_id);
  }, [user]);

  const loadStorefront = async (companyId) => {
    try {
      const res = await powerSync.execute('SELECT * FROM univ_retail_storefronts WHERE company_id = ?', [companyId]);
      if (res.rows.length > 0) {
        const data = res.rows.item(0);
        setStorefront(data);
        setDomain(data.domain_name || '');
        setIsActive(data.is_active === 1);
        if (data.theme_config) {
          setTheme(JSON.parse(data.theme_config));
        }
      }
    } catch (e) {
      console.error('Failed to load storefront', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.company_id) return;
    try {
      const configStr = JSON.stringify(theme);
      if (storefront) {
        await powerSync.execute(
          'UPDATE univ_retail_storefronts SET theme_config = ?, domain_name = ?, is_active = ? WHERE id = ?',
          [configStr, domain, isActive ? 1 : 0, storefront.id]
        );
      } else {
        await powerSync.execute(
          'INSERT INTO univ_retail_storefronts (id, company_id, theme_config, domain_name, is_active) VALUES (uuid(), ?, ?, ?, ?)',
          [user.company_id, configStr, domain, isActive ? 1 : 0]
        );
        await loadStorefront(user.company_id);
      }
      toast.success('Storefront published successfully');
    } catch (e) {
      console.error('Failed to save storefront', e);
      toast.error('Could not save storefront settings');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading builder...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Layout className="w-8 h-8 text-blue-600"/> Store Builder</h1>
          <p className="text-slate-500 mt-1">Design and launch your public-facing e-commerce storefront.</p>
        </div>
        <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4" /> Publish Store</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><Globe className="w-5 h-5"/> Domain & Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Store Active</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="space-y-2">
                <Label>Custom Domain</Label>
                <Input placeholder="shop.yourbrand.com" value={domain} onChange={e => setDomain(e.target.value)} />
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><Paintbrush className="w-5 h-5"/> Theme Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input type="color" className="w-16 h-10 p-1 cursor-pointer" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                  <Input type="text" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Typography</Label>
                <Select value={theme.fontFamily} onValueChange={v => setTheme({...theme, fontFamily: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Modern)</SelectItem>
                    <SelectItem value="Playfair Display">Playfair (Elegant)</SelectItem>
                    <SelectItem value="Roboto Mono">Roboto Mono (Tech)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hero Tagline</Label>
                <Input value={theme.heroText} onChange={e => setTheme({...theme, heroText: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl h-full min-h-[600px] border border-slate-200 dark:border-slate-800 relative flex flex-col">
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="outline" size="icon" className="bg-white"><Smartphone className="w-4 h-4"/></Button>
              <Button variant="outline" size="icon" className="bg-white"><Layout className="w-4 h-4"/></Button>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col mt-12">
              {/* Preview Header */}
              <header className="p-4 border-b border-slate-100 flex justify-between items-center" style={{ fontFamily: theme.fontFamily }}>
                <div className="font-bold text-xl" style={{ color: theme.primaryColor }}>{user?.company_id ? 'YOUR BRAND' : 'STORE'}</div>
                <div className="flex gap-4 text-sm font-medium">
                  <span>Shop</span>
                  <span>About</span>
                  <span>Cart (0)</span>
                </div>
              </header>
              {/* Preview Hero */}
              <div className="p-16 text-center bg-slate-50 border-b border-slate-100">
                <h2 className="text-4xl font-extrabold mb-4" style={{ fontFamily: theme.fontFamily }}>{theme.heroText}</h2>
                <Button style={{ backgroundColor: theme.primaryColor, color: '#fff' }}>Shop Collection</Button>
              </div>
              {/* Preview Grid */}
              <div className="p-8 grid grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-slate-200 rounded-md"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
