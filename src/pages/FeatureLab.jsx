import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'react-hot-toast';
import { Sparkles, PlusCircle, CheckCircle2, FlaskConical, LayoutDashboard, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';


export default function FeatureLab() {
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestType, setRequestType] = useState('general'); // 'general' or 'specific'
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine limits based on plan
  const plan = user?.subscription_plan?.toLowerCase() || 'starter';
  const getLimit = () => {
    if (['business', 'enterprise'].includes(plan)) return 3;
    if (plan === 'professional') return 1;
    return 0; // starter/free
  };
  
  const limit = getLimit();
  
  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('univ_feature_requests')
        .select('*')
        .eq('company_id', user?.company_id);
        
      if (error) throw error;
      
      // Filter for this month
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const monthlyReqs = (data || []).filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });
      
      setRequests(monthlyReqs);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchRequests();
    }
  }, [user]);

  const used = requests.length;
  const remaining = limit - used;
  const canSubmit = limit > 0 && remaining > 0;

  const handleAIFormat = async () => {
    if (!description.trim()) {
      toast.error('Please write a brief description first so AI can expand it.');
      return;
    }
    
    setIsGeneratingAI(true);
    // Simulate AI API call formatting the request
    setTimeout(() => {
      const formatted = `### Problem Statement\n${description}\n\n### Proposed Solution\nWe suggest building a dedicated module or component that streamlines this workflow.\n\n### Business Value\nThis will save time, reduce manual errors, and improve team efficiency.`;
      setDescription(formatted);
      setIsGeneratingAI(false);
      toast.success('Description formatted with AI Sparkles!');
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('univ_feature_requests').insert({
        company_id: user.company_id,
        user_id: user.id,
        title,
        description,
        request_type: requestType,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Feature request submitted successfully!');
      setTitle('');
      setDescription('');
      fetchRequests(); // Refresh count
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit feature request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-indigo-600" />
            Feature Lab
          </h1>
          <p className="text-slate-500 mt-1">Shape the future of the platform. Submit custom feature requests for your workspace.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-sm">
          <div className="text-sm font-medium">Monthly Requests:</div>
          <Badge variant={remaining > 0 ? 'default' : 'secondary'} className={remaining > 0 ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : ''}>
            {used} / {limit} Used
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardHeader>
              <CardTitle>Submit a New Idea</CardTitle>
              <CardDescription>Tell us what you need. Is it a platform-wide idea or something specific to your company?</CardDescription>
            </CardHeader>
            <CardContent>
              {limit === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <LayoutDashboard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold">Upgrade to Suggest Features</h3>
                  <p className="text-slate-500 mt-2 mb-4 max-w-md mx-auto">Your current plan ({plan}) does not include feature requests. Upgrade to Professional or Business to start submitting ideas to the Feature Lab.</p>
                  <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">View Plans</Button>
                </div>
              ) : !canSubmit ? (
                <div className="p-8 text-center bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-80" />
                  <h3 className="text-lg font-bold">Monthly Limit Reached</h3>
                  <p className="mt-2 mb-4 opacity-80 max-w-md mx-auto">You've reached your limit of {limit} feature requests for this month. Check back next month to submit more!</p>
                </div>
              ) : (
                <form id="featureForm" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-3">
                    <Label>Request Type</Label>
                    <RadioGroup defaultValue={requestType} onValueChange={setRequestType} className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center space-x-2 border rounded-xl p-4 flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <RadioGroupItem value="general" id="r1" />
                        <Label htmlFor="r1" className="cursor-pointer">
                          <span className="block font-semibold">General Feature</span>
                          <span className="block text-xs text-slate-500 font-normal mt-0.5">Useful for all companies on the platform</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-xl p-4 flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <RadioGroupItem value="specific" id="r2" />
                        <Label htmlFor="r2" className="cursor-pointer">
                          <span className="block font-semibold">Company Specific</span>
                          <span className="block text-xs text-slate-500 font-normal mt-0.5">Custom module built specifically for your needs</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Feature Title</Label>
                    <Input id="title" placeholder="e.g. Advanced Inventory Forecasting" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="desc">Feature Description</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={handleAIFormat} disabled={isGeneratingAI} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1.5 h-8">
                        {isGeneratingAI ? <span className="animate-spin text-lg">⏳</span> : <Sparkles className="w-4 h-4" />}
                        {isGeneratingAI ? 'Formatting...' : 'Write with AI'}
                      </Button>
                    </div>
                    <Textarea 
                      id="desc" 
                      placeholder="Briefly describe what this feature should do..." 
                      className="min-h-[150px] resize-y leading-relaxed" 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                    />
                  </div>
                </form>
              )}
            </CardContent>
            {canSubmit && (
              <CardFooter className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-end">
                <Button type="submit" form="featureForm" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none min-w-[120px]">
                  {isSubmitting ? 'Submitting...' : <><Send className="w-4 h-4 mr-2" /> Submit Request</>}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month's Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-400">Loading...</div>
              ) : requests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No requests submitted this month.</div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm line-clamp-1">{req.title}</span>
                        <Badge variant="outline" className="text-[10px] uppercase bg-slate-50">{req.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 capitalize">{req.request_type} Feature</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
