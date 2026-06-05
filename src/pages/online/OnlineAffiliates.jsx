import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Link2, Users, DollarSign, Copy, Check, TrendingUp, ArrowUpRight, BarChart3 } from 'lucide-react';

export default function OnlineAffiliates() {
  const [copied, setCopied] = useState(false);
  const affiliateLink = "https://learn.airflake.com/ref/alexj99";

  const handleCopy = () => {
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const recentReferrals = [
      { id: 1, name: "M. Chen", date: "Today", course: "UI Design Fundamentals", commission: "$44.70", status: "cleared" },
      { id: 2, name: "S. Williams", date: "Yesterday", course: "Advanced React Patterns", commission: "$29.80", status: "pending" },
      { id: 3, name: "J. Doe", date: "June 2", subscription: "Pro Annual", commission: "$93.60", status: "cleared" },
  ];

  return (
    <div className="h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-overlay shrink-0">
        <h1 className="text-2xl font-display font-medium mb-2 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-orbit" /> Affiliate Program
        </h1>
        <p className="text-text-secondary text-sm">Share your unique link and earn 30% commission on every sale.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-6xl mx-auto space-y-8">
              
              {/* Top Stats & Link */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Copy Link Card */}
                  <Card className="lg:col-span-2 bg-gradient-to-br from-deep via-deep to-orbit/10 border-border p-6 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-orbit/20 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="relative z-10">
                          <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wider">Your Referral Link</h3>
                          <div className="flex bg-void border border-border rounded-lg overflow-hidden p-1">
                              <div className="flex-1 px-4 py-3 text-orbit-light font-mono text-sm truncate flex items-center select-all">
                                  {affiliateLink}
                              </div>
                              <button 
                                  onClick={handleCopy}
                                  className={`px-6 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-orbit hover:bg-orbit-light text-white'}`}
                              >
                                  {copied ? <><Check className="w-4 h-4"/> Copied</> : <><Copy className="w-4 h-4"/> Copy Link</>}
                              </button>
                          </div>
                          <p className="text-xs text-text-muted mt-4">Share this link on your blog, social media, or with friends. Cookies last for 60 days.</p>
                      </div>
                  </Card>

                  {/* Available Balance */}
                  <Card className="bg-deep border-border p-6 flex flex-col justify-between">
                      <div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                              <DollarSign className="w-4 h-4 text-emerald-400" /> Available to Payout
                          </div>
                          <div className="text-4xl font-display font-medium text-white">$138.30</div>
                      </div>
                      <div className="mt-6">
                          <button className="w-full orbit-btn-secondary py-2.5 text-sm">Withdraw Funds</button>
                          <div className="text-center text-xs text-text-muted mt-2">Next auto-payout: July 1</div>
                      </div>
                  </Card>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-surface/30 border-border p-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="text-sm text-text-secondary mb-1">Total Clicks</div>
                              <div className="text-2xl font-mono text-white">1,248</div>
                          </div>
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                              <BarChart3 className="w-5 h-5 text-blue-400" />
                          </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400">
                          <ArrowUpRight className="w-3 h-3" /> 12% from last month
                      </div>
                  </Card>
                  
                  <Card className="bg-surface/30 border-border p-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="text-sm text-text-secondary mb-1">Signups</div>
                              <div className="text-2xl font-mono text-white">84</div>
                          </div>
                          <div className="p-2 bg-orbit/10 rounded-lg">
                              <Users className="w-5 h-5 text-orbit" />
                          </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400">
                          <ArrowUpRight className="w-3 h-3" /> 5% from last month
                      </div>
                  </Card>

                  <Card className="bg-surface/30 border-border p-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="text-sm text-text-secondary mb-1">Conversion Rate</div>
                              <div className="text-2xl font-mono text-white">6.7%</div>
                          </div>
                          <div className="p-2 bg-amber-500/10 rounded-lg">
                              <TrendingUp className="w-5 h-5 text-amber-400" />
                          </div>
                      </div>
                      <div className="mt-4 text-xs text-text-muted">
                          Industry avg: 2.5%
                      </div>
                  </Card>
              </div>

              {/* Recent Conversions */}
              <div>
                  <h3 className="text-lg font-display font-medium text-white mb-4">Recent Referrals</h3>
                  <div className="bg-deep border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-surface/50 text-xs font-medium text-text-muted border-b border-border">
                              <tr>
                                  <th className="px-6 py-4">Referred User</th>
                                  <th className="px-6 py-4">Product</th>
                                  <th className="px-6 py-4">Date</th>
                                  <th className="px-6 py-4">Commission</th>
                                  <th className="px-6 py-4 text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                              {recentReferrals.map(ref => (
                                  <tr key={ref.id} className="hover:bg-surface/30 transition-colors">
                                      <td className="px-6 py-4 text-sm font-medium text-white">{ref.name}</td>
                                      <td className="px-6 py-4 text-sm text-text-secondary">{ref.course || ref.subscription}</td>
                                      <td className="px-6 py-4 text-sm text-text-muted font-mono">{ref.date}</td>
                                      <td className="px-6 py-4 text-sm font-mono text-emerald-400 font-medium">{ref.commission}</td>
                                      <td className="px-6 py-4 text-right">
                                          {ref.status === 'cleared' ? (
                                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400"><Check className="w-3 h-3" /> Cleared</span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">Pending (30 days)</span>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}
