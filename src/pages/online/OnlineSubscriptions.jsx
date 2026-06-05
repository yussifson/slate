import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';

export default function OnlineSubscriptions() {
  const [billingCycle, setBillingCycle] = useState('yearly');

  return (
    <div className="min-h-[calc(100vh-64px)] bg-void flex flex-col font-body text-text-primary py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orbit/20 rounded-full blur-[100px] pointer-events-none"></div>
              <h1 className="text-4xl md:text-5xl font-display font-medium text-orbit-light mb-4 relative z-10">Choose Your Learning Journey</h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto relative z-10">Get unlimited access to top courses, guided learning paths, and exclusive certifications.</p>
              
              <div className="mt-8 flex justify-center relative z-10">
                  <div className="bg-surface border border-border p-1 rounded-xl inline-flex relative">
                      <button 
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors relative z-10 ${billingCycle === 'monthly' ? 'bg-deep text-text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text-primary'}`}
                      >Monthly</button>
                      <button 
                          onClick={() => setBillingCycle('yearly')}
                          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors relative z-10 flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-deep text-text-primary shadow-sm border border-border' : 'text-text-secondary hover:text-text-primary'}`}
                      >
                          Annually <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Save 20%</span>
                      </button>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              
              {/* Basic Tier */}
              <Card className="bg-deep border border-border rounded-2xl flex flex-col hover:border-orbit/30 transition-colors">
                  <div className="p-8 border-b border-border">
                      <h3 className="text-xl font-display font-medium mb-2">Basic</h3>
                      <p className="text-sm text-text-secondary mb-6 h-10">Perfect for self-paced learners looking to pick up a new skill.</p>
                      <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-display font-medium text-orbit-light">${billingCycle === 'yearly' ? '19' : '25'}</span>
                          <span className="text-text-muted">/mo</span>
                      </div>
                      {billingCycle === 'yearly' && <div className="text-xs text-text-muted mt-2">Billed $228 annually</div>}
                      <button className="w-full mt-6 orbit-btn-secondary py-3">Start 7-Day Free Trial</button>
                  </div>
                  <div className="p-8 flex-1 bg-surface/30">
                      <ul className="space-y-4 text-sm text-text-secondary">
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Access to 1,000+ basic courses</li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Ad-free learning experience</li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Community forum access</li>
                          <li className="flex items-start gap-3 text-text-muted"><Check className="w-5 h-5 text-text-muted/50 shrink-0" /> No certificates included</li>
                      </ul>
                  </div>
              </Card>

              {/* Pro Tier */}
              <Card className="bg-void border-2 border-orbit shadow-[0_0_40px_rgba(108,99,255,0.15)] rounded-2xl flex flex-col relative transform md:-translate-y-4">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orbit text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current" /> Most Popular
                  </div>
                  <div className="p-8 border-b border-border bg-gradient-to-b from-orbit/10 to-transparent">
                      <h3 className="text-xl font-display font-medium mb-2 text-orbit-light flex items-center gap-2">Professional <Zap className="w-5 h-5 text-orbit" /></h3>
                      <p className="text-sm text-text-secondary mb-6 h-10">For career builders needing certifications and advanced projects.</p>
                      <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-display font-medium text-white">${billingCycle === 'yearly' ? '39' : '49'}</span>
                          <span className="text-text-muted">/mo</span>
                      </div>
                      {billingCycle === 'yearly' && <div className="text-xs text-text-muted mt-2">Billed $468 annually</div>}
                      <button className="w-full mt-6 orbit-btn-primary py-3 font-medium">Subscribe Now</button>
                  </div>
                  <div className="p-8 flex-1">
                      <p className="text-sm font-medium text-text-primary mb-4">Everything in Basic, plus:</p>
                      <ul className="space-y-4 text-sm text-text-secondary">
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> <span className="text-text-primary">Unlimited Certificates</span></li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Access to 5,000+ premium courses</li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Graded assessments & projects</li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Downloadable resources for offline</li>
                      </ul>
                  </div>
              </Card>

              {/* Enterprise/Team Tier */}
              <Card className="bg-deep border border-border rounded-2xl flex flex-col hover:border-orbit/30 transition-colors">
                  <div className="p-8 border-b border-border">
                      <h3 className="text-xl font-display font-medium mb-2 flex items-center gap-2">Teams <Crown className="w-5 h-5 text-amber-400" /></h3>
                      <p className="text-sm text-text-secondary mb-6 h-10">For organizations upskilling their workforce.</p>
                      <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-display font-medium text-orbit-light">Custom</span>
                      </div>
                      <div className="text-xs text-text-muted mt-2 opacity-0">Spacer</div>
                      <button className="w-full mt-6 orbit-btn-secondary py-3">Contact Sales</button>
                  </div>
                  <div className="p-8 flex-1 bg-surface/30">
                      <p className="text-sm font-medium text-text-primary mb-4">Everything in Pro, plus:</p>
                      <ul className="space-y-4 text-sm text-text-secondary">
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Admin dashboard & analytics</li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Dedicated success manager</li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> SSO & API Integration</li>
                          <li className="flex items-start gap-3"><Check className="w-5 h-5 text-orbit shrink-0" /> Custom learning paths</li>
                      </ul>
                  </div>
              </Card>

          </div>
          
          <div className="mt-20 max-w-4xl mx-auto text-center border-t border-border pt-12">
              <Shield className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-display font-medium mb-2">Secure & Transparent</h3>
              <p className="text-text-secondary max-w-xl mx-auto text-sm">Cancel anytime from your account settings. If you're not satisfied within the first 14 days, we'll refund your payment—no questions asked.</p>
          </div>
      </div>
    </div>
  );
}
