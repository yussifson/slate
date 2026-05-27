import React, { useState } from 'react';
import { Server, Shield, Database, Headphones, Check, ArrowRight, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function EnterpriseContact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    companyName: '',
    industry: '',
    userCount: '50-100',
    deployment: 'aws',
    needsMigration: false,
    needsWhitelabel: false,
    needsCompliance: true,
    message: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call to CRM
    setTimeout(() => {
      setLoading(false);
      setStep(3); // Success step
      toast({
        title: "Request Received",
        description: "Our enterprise team will contact you within 24 hours.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-6">
            <Building2 className="w-4 h-4" /> Optalflow Enterprise
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Build your custom deployment
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Configure your infrastructure requirements below to receive a tailored architectural proposal and pricing quote.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Main Configurator Form */}
          <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 md:p-10 w-full relative overflow-hidden">
            
            {/* Progress Bar */}
            {step < 3 && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: step === 1 ? '50%' : '100%' }}></div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">Step 1: Technical Requirements</h3>
                
                <div className="space-y-8">
                  {/* Deployment Type */}
                  <div>
                    <Label className="text-sm font-bold text-slate-900 mb-3 block">Deployment Environment</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['aws', 'azure', 'onprem'].map((type) => (
                        <div 
                          key={type}
                          onClick={() => handleChange('deployment', type)}
                          className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center text-center transition-all ${
                            formData.deployment === type 
                              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Server className={`w-6 h-6 mb-2 ${formData.deployment === type ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className={`text-sm font-bold ${formData.deployment === type ? 'text-blue-900' : 'text-slate-600'}`}>
                            {type === 'aws' ? 'Private AWS' : type === 'azure' ? 'Private Azure' : 'Bare Metal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Users */}
                  <div>
                    <Label className="text-sm font-bold text-slate-900 mb-3 block">Estimated Active Users</Label>
                    <Select value={formData.userCount} onValueChange={(val) => handleChange('userCount', val)}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select user count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10-50">10 - 50 Users</SelectItem>
                        <SelectItem value="50-100">50 - 100 Users</SelectItem>
                        <SelectItem value="100-500">100 - 500 Users</SelectItem>
                        <SelectItem value="500+">500+ Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Add-ons Toggles */}
                  <div>
                    <Label className="text-sm font-bold text-slate-900 mb-4 block">Enterprise Add-ons</Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold text-slate-900 cursor-pointer" onClick={() => handleChange('needsMigration', !formData.needsMigration)}>Legacy Data Migration</Label>
                          <p className="text-xs text-slate-500">We securely port your existing databases into Optalflow.</p>
                        </div>
                        <Switch checked={formData.needsMigration} onCheckedChange={(c) => handleChange('needsMigration', c)} />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold text-slate-900 cursor-pointer" onClick={() => handleChange('needsWhitelabel', !formData.needsWhitelabel)}>Full White-Labeling</Label>
                          <p className="text-xs text-slate-500">Custom domain, custom branding, and removal of Optalflow logos.</p>
                        </div>
                        <Switch checked={formData.needsWhitelabel} onCheckedChange={(c) => handleChange('needsWhitelabel', c)} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold text-slate-900 cursor-pointer" onClick={() => handleChange('needsCompliance', !formData.needsCompliance)}>Compliance Audit Package</Label>
                          <p className="text-xs text-slate-500">HIPAA, GDPR, SOC2 compliance reporting and encryption.</p>
                        </div>
                        <Switch checked={formData.needsCompliance} onCheckedChange={(c) => handleChange('needsCompliance', c)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                  <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-xl w-full sm:w-auto text-base gap-2">
                    Continue <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">Step 2: Company Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900">First Name</Label>
                    <Input required className="h-12 rounded-xl" placeholder="Jane" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900">Last Name</Label>
                    <Input required className="h-12 rounded-xl" placeholder="Doe" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-6 mb-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900">Work Email</Label>
                    <Input required type="email" className="h-12 rounded-xl" placeholder="jane@company.com" value={formData.workEmail} onChange={(e) => handleChange('workEmail', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-900">Company Name</Label>
                      <Input required className="h-12 rounded-xl" placeholder="Acme Corp" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-900">Industry</Label>
                      <Select value={formData.industry} onValueChange={(val) => handleChange('industry', val)} required>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="law">Law Firm</SelectItem>
                          <SelectItem value="healthcare">Healthcare / Hospital</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="finance">Finance / Insurance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900">Any specific requirements? (Optional)</Label>
                    <Textarea 
                      className="min-h-[100px] rounded-xl resize-none" 
                      placeholder="Tell us about your current infrastructure..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center gap-4">
                  <Button type="button" variant="ghost" onClick={handleBack} className="text-slate-500 hover:text-slate-900 font-bold">
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 px-8 rounded-xl w-full sm:w-auto text-base">
                    {loading ? 'Submitting Request...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Request Sent Successfully!</h3>
                <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed mb-8">
                  Thank you, {formData.firstName}. Our Enterprise Solution team will review your deployment requirements and be in touch within 24 hours to schedule a discovery call.
                </p>
                <Button onClick={() => window.location.href = '/'} variant="outline" className="rounded-full font-bold px-8">
                  Return to Home
                </Button>
              </div>
            )}
          </div>

          {/* Side Info Panel */}
          <div className="w-full lg:w-96 shrink-0 space-y-6 lg:mt-0 mt-8">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl">
              <h4 className="text-xl font-bold mb-6">Why Enterprise?</h4>
              
              <ul className="space-y-5">
                <li className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-100">Data Sovereignty</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Keep your client data physically isolated within your geographical boundaries.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-100">Unlimited API Limits</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">No rate limits on API calls, webhooks, or automation triggers.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-100">SLA Guarantees</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Financial backing for 99.99% uptime with immediate resolution routing.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-8 text-center shadow-sm">
              <p className="text-sm font-bold text-blue-900 mb-2">Need immediate assistance?</p>
              <p className="text-xs text-blue-700 leading-relaxed mb-4">
                Call our dedicated enterprise hotline. Available 24/7.
              </p>
              <a href="tel:+18005550199" className="inline-flex items-center gap-2 font-bold text-lg text-blue-700 hover:text-blue-900 transition-colors">
                <Headphones className="w-5 h-5" /> 1-800-OPTAL-HQ
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
