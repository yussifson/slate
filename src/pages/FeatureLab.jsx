import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePowerSync } from '@powersync/react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'react-hot-toast';
import { Sparkles, PlusCircle, CheckCircle2, FlaskConical, LayoutDashboard, Send, Activity, Info, Edit, Trash2, X, MessageSquare, Lightbulb, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { generateText } from '@/lib/cloudflareAI';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import clsx from 'clsx';


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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Determine limits based on plan
  const plan = user?.subscription_plan?.toLowerCase() || 'starter';
  const getLimit = () => {
    if (user?.role === 'super_admin') return 999999; // Unlimited for super admins
    if (['business', 'enterprise'].includes(plan)) return 3;
    if (plan === 'professional') return 1;
    if (plan !== 'starter' && plan !== 'free') return 1; // Any other paid plan gets 1
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

  const handleAIBrainstorm = async () => {
    if (!title.trim() && !description.trim()) {
      toast.error('Please write a brief title or description first so AI can brainstorm ideas for you.');
      return;
    }
    
    setIsGeneratingAI(true);
    try {
      const prompt = `You are a visionary product manager and software architect for an enterprise SaaS platform. A user is proposing a new feature.
They wrote this draft:
${title ? `Title: "${title}"` : ''}
${description ? `Description: "${description}"` : ''}

Brainstorm and expand this idea. Instead of just rewriting it, provide 3 innovative variations or expansions of their idea that would add immense business value. 
Format your response using Markdown with clear headers for each idea variation, including:
- The Core Concept
- Why it's valuable
- Potential implementation details

Do NOT wrap the output in markdown code blocks (\`\`\`). Output the raw text directly.`;
      
      const formatted = await generateText(prompt);
      if (formatted) {
        setDescription(formatted.trim());
        toast.success('AI has brainstormed new ideas for your feature!');
      } else {
        toast.error('AI response was empty. Please try again.');
      }
    } catch (err) {
      console.error('AI Format Error:', err);
      toast.error('Failed to generate AI ideas.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit && !isEditing) return;
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && activeRequest) {
        await powerSync.execute(
          `UPDATE univ_feature_requests SET title = ?, description = ?, request_type = ?, updated_at = ? WHERE id = ?`,
          [title, description, requestType, new Date().toISOString(), activeRequest.id]
        );
        toast.success('Feature request updated successfully!');
      } else {
        await powerSync.execute(
          `INSERT INTO univ_feature_requests (id, company_id, user_id, title, description, request_type, status, created_at, updated_at, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), user.company_id, user.id, title, description, requestType, 'pending', new Date().toISOString(), new Date().toISOString(), 0]
        );
        toast.success('Feature request submitted successfully!');
      }

      setTitle('');
      setDescription('');
      setIsViewModalOpen(false);
      setIsEditing(false);
      setActiveRequest(null);
      fetchRequests(); // Refresh count
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? 'Failed to update feature request.' : 'Failed to submit feature request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewModal = (req) => {
    setActiveRequest(req);
    setIsViewModalOpen(true);
    setIsEditing(false);
  };

  const openEditMode = () => {
    setTitle(activeRequest.title);
    setDescription(activeRequest.description);
    setRequestType(activeRequest.request_type);
    setIsEditing(true);
    setIsViewModalOpen(false);
    document.getElementById("featureForm")?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 relative z-10">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-indigo-600" />
            Feature Insider
          </h1>
          <p className="text-slate-500 mt-1">Shape the future of the platform. Submit custom feature requests and track their progress.</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Submissions:</div>
          <Badge variant={remaining > 0 ? 'default' : 'secondary'} className={remaining > 0 ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 ring-1 ring-indigo-200 shadow-sm' : ''}>
            {limit >= 999999 ? 'Unlimited' : `${used} / ${limit} Used`}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-indigo-200/50 dark:border-indigo-900/30 shadow-xl shadow-indigo-900/5 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-white">
                {isEditing ? <Edit className="w-5 h-5 text-indigo-500" /> : <PlusCircle className="w-5 h-5 text-indigo-500" />}
                {isEditing ? 'Edit Feature Idea' : 'Submit a New Idea'}
              </CardTitle>
              <CardDescription>Tell us what you need. Is it a platform-wide idea or something specific to your company?</CardDescription>
            </CardHeader>
            <CardContent>
              {limit === 0 ? (
                <div className="p-8 text-center bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl">
                  <LayoutDashboard className="w-12 h-12 text-slate-400 mx-auto mb-4 drop-shadow-sm" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upgrade to Suggest Features</h3>
                  <p className="text-slate-500 mt-2 mb-6 max-w-md mx-auto leading-relaxed">Your current plan ({plan}) does not include feature requests. Upgrade to Professional or Business to start submitting ideas to the Feature Insider.</p>
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
                      <Label htmlFor="desc" className="text-sm font-semibold">Feature Description</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAIBrainstorm} disabled={isGeneratingAI} className="border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-800 gap-1.5 h-8 rounded-full shadow-sm hover:shadow">
                        {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4 text-amber-500" />}
                        {isGeneratingAI ? 'Brainstorming...' : 'Brainstorm Ideas'}
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
              <CardFooter className="bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-between items-center backdrop-blur-xl">
                {isEditing ? (
                  <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setTitle(''); setDescription(''); }} className="text-slate-500 hover:text-slate-700">Cancel Edit</Button>
                ) : <div/>}
                <Button type="submit" form="featureForm" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 min-w-[140px] h-11 rounded-xl font-semibold">
                  {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4 mr-2" /> {isEditing ? 'Save Changes' : 'Submit Request'}</>}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl sticky top-24">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" /> 
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-slate-400">Loading...</div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center">
                  <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                  No requests submitted this month.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {requests.map(req => (
                    <div 
                      key={req.id} 
                      onClick={() => openViewModal(req)}
                      className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">{req.title}</span>
                        <Badge variant="outline" className={clsx(
                          "text-[10px] uppercase border font-semibold",
                          req.status === 'built' || req.status === 'accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          req.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                          'bg-amber-50 border-amber-200 text-amber-700'
                        )}>
                          {req.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 capitalize mb-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span> {req.request_type} Feature
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Progress</span>
                          <span className="text-indigo-600">{req.progress || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${Math.max(req.progress || 0, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 border-0 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          {activeRequest && (
            <>
              <div className="bg-slate-50/80 dark:bg-slate-900/80 p-6 border-b border-slate-100 dark:border-slate-800 backdrop-blur-xl shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 uppercase text-[10px] tracking-wider font-bold text-indigo-600 border-indigo-100">
                    {activeRequest.request_type} Feature
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">{new Date(activeRequest.created_at).toLocaleDateString()}</span>
                </div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {activeRequest.title}
                </DialogTitle>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-[#0B1120]">
                {/* Status & Progress Box */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</span>
                    <Badge className={clsx(
                      "uppercase text-[11px] font-bold tracking-wider px-2.5 py-1",
                      activeRequest.status === 'built' || activeRequest.status === 'accepted' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                      activeRequest.status === 'rejected' ? 'bg-red-500 hover:bg-red-600 text-white' :
                      'bg-amber-500 hover:bg-amber-600 text-white'
                    )}>
                      {activeRequest.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Development Progress</span>
                      <span className="text-indigo-600">{activeRequest.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 bg-[length:200%_auto] animate-shimmer" 
                        style={{ width: `${Math.max(activeRequest.progress || 0, 2)}%` }}
                      />
                    </div>
                  </div>

                  {activeRequest.admin_feedback && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Super Admin Feedback</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">"{activeRequest.admin_feedback}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description content */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Feature Requirements</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap">
                    {activeRequest.description}
                  </div>
                </div>
              </div>

              <DialogFooter className="bg-slate-50/80 dark:bg-slate-900/80 p-5 border-t border-slate-100 dark:border-slate-800 backdrop-blur-xl shrink-0">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="rounded-xl font-semibold border-slate-200 hover:bg-slate-100">Close</Button>
                <Button onClick={openEditMode} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 font-semibold px-6 gap-2">
                  <Edit className="w-4 h-4" /> Edit Feature
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
