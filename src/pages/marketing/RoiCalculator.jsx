import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, DollarSign, Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function RoiCalculator() {
  const { t } = useTranslation();
  
  const [employees, setEmployees] = useState(50);
  const [hourlyRate, setHourlyRate] = useState(45);
  
  // Simple ROI Logic
  const hoursSavedPerWeekPerEmployee = 4.5;
  const weeklySavings = employees * hoursSavedPerWeekPerEmployee * hourlyRate;
  const annualSavings = weeklySavings * 52;
  const platformCostAnnual = employees * 29 * 12; // estimating $29/mo per user
  const netSavings = annualSavings - platformCostAnnual;

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-8 uppercase tracking-widest">
            <Calculator className="w-4 h-4" />
            {t("roi_calculator", "ROI Calculator")}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight tracking-[-0.02em] leading-tight">
            Calculate your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
              financial impact.
            </span>
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            See exactly how much time and money your organization can save by unifying your toolchain with Slate.
          </p>
        </div>
      </section>

      {/* Calculator Tool */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-[2rem] border-[0.5px] border-black/9 dark:border-white/8 shadow-2xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              
              {/* Inputs */}
              <div className="flex flex-col justify-center">
                <h3 className="text-2xl font-black text-slate-900 mb-8">Your Organization</h3>
                
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Number of Employees</label>
                    <span className="text-xl font-black text-primary">{employees}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" max="500" step="10" 
                    value={employees} 
                    onChange={(e) => setEmployees(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Avg. Hourly Rate ($)</label>
                    <span className="text-xl font-black text-primary">${hourlyRate}</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" max="150" step="5" 
                    value={hourlyRate} 
                    onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Outputs */}
              <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent"></div>
                
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-2 tracking-widest uppercase">Estimated Annual Savings</h3>
                  <div className="text-6xl font-black text-white mb-10 tracking-tighter">
                    ${(netSavings).toLocaleString()}
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">{(employees * hoursSavedPerWeekPerEmployee * 52).toLocaleString()}</div>
                        <div className="text-sm font-medium text-slate-400">Hours saved annually</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">${(platformCostAnnual).toLocaleString()}</div>
                        <div className="text-sm font-medium text-slate-400">Estimated platform cost</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Stop leaving money on the table.</h2>
          <p className="text-lg text-slate-600 mb-10">
            These are conservative estimates. The true value of unified operations compounds over time.
          </p>
          <Link to="/contact">
            <Button className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all">
              Request Detailed ROI Analysis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
