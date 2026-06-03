import React from 'react';
import { useTranslation } from 'react-i18next';
import { Store, TrendingUp, Users, DollarSign, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudentBusinesses() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Student Businesses</h1>
            <p className="text-sm text-muted-foreground">Manage your entrepreneurial ventures on campus</p>
          </div>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <PlusCircle className="w-4 h-4" /> Register Business
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-sm text-white md:col-span-2">
          <h3 className="text-lg font-bold mb-1 opacity-90">Total Revenue Generated</h3>
          <p className="text-4xl font-black mb-4">$1,245.00</p>
          <div className="flex gap-4 text-sm">
            <div className="bg-black/20 px-3 py-1.5 rounded-lg">This Month: <span className="font-bold">+$320.00</span></div>
            <div className="bg-black/20 px-3 py-1.5 rounded-lg flex items-center gap-1"><TrendingUp className="w-4 h-4"/> 14% Growth</div>
          </div>
        </div>
        
        <div className="stat-card-premium bg-card p-6 rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
          </div>
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <h3 className="text-2xl font-bold">84</h3>
        </div>

        <div className="stat-card-premium bg-card p-6 rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600"><Store className="w-5 h-5" /></div>
          </div>
          <p className="text-sm text-muted-foreground">Active Ventures</p>
          <h3 className="text-2xl font-bold">2</h3>
        </div>
      </div>

      <h3 className="text-lg font-bold mt-8 mb-4">My Ventures</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col group cursor-pointer hover:border-emerald-500 transition-colors">
          <div className="h-32 bg-muted relative">
            <div className="absolute inset-0 bg-emerald-500/10"></div>
            <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-xl border-4 border-card shadow-sm flex items-center justify-center font-bold text-2xl text-emerald-600">CC</div>
          </div>
          <div className="p-6 pt-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">Campus Crafters</h3>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Custom handmade notebooks and campus merchandise sold directly to students.</p>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
                <p className="font-bold text-foreground">$850.00</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Orders</p>
                <p className="font-bold text-foreground">142</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col group cursor-pointer hover:border-blue-500 transition-colors">
          <div className="h-32 bg-muted relative">
            <div className="absolute inset-0 bg-blue-500/10"></div>
            <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-xl border-4 border-card shadow-sm flex items-center justify-center font-bold text-2xl text-blue-600">TT</div>
          </div>
          <div className="p-6 pt-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">TechTutors</h3>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Peer-to-peer tutoring for computer science and mathematics courses.</p>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
                <p className="font-bold text-foreground">$395.00</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
                <p className="font-bold text-foreground">24</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
