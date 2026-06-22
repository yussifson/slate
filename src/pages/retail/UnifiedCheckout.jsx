import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UnifiedCheckout() {
  const [gateways, setGateways] = useState([
    { id: 'stripe', name: 'Stripe', active: true, publicKey: 'pk_test_...', secretKey: 'sk_test_...' },
    { id: 'paypal', name: 'PayPal', active: false, publicKey: '', secretKey: '' },
    { id: 'paystack', name: 'Paystack', active: false, publicKey: '', secretKey: '' },
  ]);

  const toggleGateway = (id) => {
    setGateways(prev => prev.map(g => {
      if (g.id === id) {
        const newActive = !g.active;
        toast.success(`${g.name} ${newActive ? 'enabled' : 'disabled'} for checkout`);
        return { ...g, active: newActive };
      }
      return g;
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-primary" />
          Unified Checkout
        </h1>
        <p className="text-slate-500 mt-2">Manage the payment gateways used on your e-commerce storefront.</p>
      </div>

      <div className="space-y-6">
        {gateways.map((g) => (
          <Card key={g.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">{g.name}</CardTitle>
                <CardDescription>Enable secure payments via {g.name}</CardDescription>
              </div>
              <Switch checked={g.active} onCheckedChange={() => toggleGateway(g.id)} />
            </CardHeader>
            {g.active && (
              <CardContent className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Public Key</label>
                    <Input defaultValue={g.publicKey} placeholder={`${g.name} Public Key`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Key</label>
                    <Input type="password" defaultValue={g.secretKey} placeholder={`${g.name} Secret Key`} />
                  </div>
                </div>
                <Button className="w-full gap-2">
                  <CheckCircle className="w-4 h-4" /> Save Configuration
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
