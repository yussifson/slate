import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Activity } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminBilling() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Revenue & Billing" 
        subtitle="Global platform financial analytics and payment gateway health." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-indigo-600/80 uppercase tracking-wider mb-1">Total MRR</p>
                <h3 className="text-4xl font-extrabold text-indigo-950">$42,500</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold">+12.5%</Badge>
              <span className="text-slate-500 font-medium">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Active Subscriptions</p>
                <h3 className="text-4xl font-extrabold text-emerald-950">1,248</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold">+4.2%</Badge>
              <span className="text-slate-500 font-medium">new this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Failed Charges</p>
                <h3 className="text-4xl font-extrabold text-slate-900">12</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-rose-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Action required on 5 accounts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Gateway Sync Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="font-bold text-sm text-slate-900">Stripe Integration</p>
                  <p className="text-xs text-slate-500">Last synced: 2 minutes ago</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Healthy</Badge>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="font-bold text-sm text-slate-900">Paystack Integration</p>
                  <p className="text-xs text-slate-500">Last synced: 5 minutes ago</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary" /> Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {[
                { org: "Apex Legal Partners", plan: "Enterprise", amount: "$199.00", status: "Succeeded", time: "10 mins ago" },
                { org: "Global Logistics Co", plan: "Professional", amount: "$79.00", status: "Succeeded", time: "1 hour ago" },
                { org: "City General Hospital", plan: "Enterprise", amount: "$199.00", status: "Failed", time: "2 hours ago" },
              ].map((tx, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-slate-900">{tx.org}</p>
                    <p className="text-xs text-slate-500">{tx.plan} &middot; {tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-900">{tx.amount}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${tx.status === 'Failed' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
