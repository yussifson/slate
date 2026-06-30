import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'react-hot-toast';
import { FlaskConical, Filter, Send, ExternalLink, Activity, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { REPageHeader } from '@/components/real-estate/RealEstateViewKit'; // Reusing nicely designed header

export default function AdminFeatureInsider() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Announcement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementDesc, setAnnouncementDesc] = useState('');
  const [moduleIdentifier, setModuleIdentifier] = useState('');

  // Update Status Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('pending');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [adminFeedback, setAdminFeedback] = useState('');

  const fetchRequests = async () => {
    try {
      // Fetch requests without join (no FK exists between univ_feature_requests and companies)
      const { data, error } = await supabase
        .from('univ_feature_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Separately fetch company names for all unique company_ids and merge
      const companyIds = [...new Set((data || []).map(r => r.company_id).filter(Boolean))];
      let companyMap = {};
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);
        (companies || []).forEach(c => { companyMap[c.id] = c.name; });
      }

      const enriched = (data || []).map(r => ({
        ...r,
        company: { name: companyMap[r.company_id] || 'Unknown Company' }
      }));

      setRequests(enriched);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openAnnouncementModal = (req) => {
    setSelectedRequest(req);
    setAnnouncementTitle(req.title);
    setAnnouncementDesc(req.description);
    setModuleIdentifier(req.title.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    setIsModalOpen(true);
  };

  const openUpdateModal = (req) => {
    setSelectedRequest(req);
    setUpdateStatus(req.status || 'pending');
    setUpdateProgress(req.progress || 0);
    setAdminFeedback(req.admin_feedback || '');
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await supabase.from('univ_feature_requests').update({ 
        status: updateStatus,
        progress: updateProgress,
        admin_feedback: adminFeedback,
        updated_at: new Date().toISOString()
      }).eq('id', selectedRequest.id);

      toast.success('Feature status updated successfully!');
      setIsUpdateModalOpen(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update feature');
    }
  };

  const handleDeployFeature = async () => {
    if (!announcementTitle || !moduleIdentifier) {
      toast.error('Please fill in title and module identifier');
      return;
    }

    try {
      // 1. Create Announcement
      const { error: annErr } = await supabase.from('univ_feature_announcements').insert({
        title: announcementTitle,
        description: announcementDesc,
        announcement_type: selectedRequest.request_type,
        target_company_id: selectedRequest.request_type === 'specific' ? selectedRequest.company_id : null,
        module_identifier: moduleIdentifier
      });

      if (annErr) throw annErr;

      // 2. Update request status to built
      await supabase.from('univ_feature_requests').update({ status: 'built' }).eq('id', selectedRequest.id);

      toast.success('Feature deployed and announced successfully!');
      setIsModalOpen(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error('Failed to deploy feature');
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <REPageHeader 
        title="Feature Insider (Admin)" 
        subtitle="Manage custom feature requests from all companies and deploy modules."
        actions={
          <Badge variant="outline" className="px-4 py-2 border-indigo-200 text-indigo-700 bg-indigo-50 font-semibold gap-2">
            <Activity className="w-4 h-4" />
            {requests.filter(r => r.status === 'pending').length} Pending
          </Badge>
        }
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search requests..." className="pl-9 bg-white dark:bg-slate-800" />
          </div>
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filter</Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading requests...</TableCell></TableRow>
            ) : requests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">No feature requests yet.</TableCell></TableRow>
            ) : (
              requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.company?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{req.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{req.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {req.request_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge className={
                        req.status === 'built' || req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                        'bg-amber-100 text-amber-800 hover:bg-amber-100'
                      }>
                        {req.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(req.progress || 0, 0)}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">{req.progress || 0}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => openUpdateModal(req)} size="sm" variant="outline" className="gap-2">
                        <Activity className="w-3 h-3" /> Update Status
                      </Button>
                      {(req.status === 'pending' || req.status === 'accepted') && (
                        <Button onClick={() => openAnnouncementModal(req)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                          <Send className="w-3 h-3" /> Deploy
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deploy Feature</DialogTitle>
            <DialogDescription>
              Announce this newly built feature to {selectedRequest?.request_type === 'specific' ? `only ${selectedRequest?.company?.name}` : 'all companies'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Announcement Title</Label>
              <Input value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={announcementDesc} onChange={e => setAnnouncementDesc(e.target.value)} className="h-24" />
            </div>
            <div className="space-y-2">
              <Label>Module Identifier Key</Label>
              <Input value={moduleIdentifier} onChange={e => setModuleIdentifier(e.target.value)} placeholder="e.g. custom_inventory_pro" />
              <p className="text-xs text-slate-500">This key will be added to the company's active_modules when they accept it.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDeployFeature} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Send className="w-4 h-4" /> Push Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Feature Status</DialogTitle>
            <DialogDescription>
              Manage the progress and status of this feature request. Companies will see these updates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Request Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="built">Built (Completed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Development Progress</Label>
                <span className="text-sm font-medium text-indigo-600">{updateProgress}%</span>
              </div>
              <Slider 
                value={[updateProgress]} 
                onValueChange={(val) => setUpdateProgress(val[0])} 
                max={100} 
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Admin Feedback (Visible to Company)</Label>
              <Textarea 
                value={adminFeedback} 
                onChange={e => setAdminFeedback(e.target.value)} 
                className="h-24 resize-none" 
                placeholder="Explain why this was accepted/rejected, or provide a status update..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Updates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
