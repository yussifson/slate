import React, { useState, useEffect, useMemo } from 'react';
import {
  Star, RefreshCw, MessageSquare, ThumbsUp, Shield, Wrench, Search, Plus, User, Building2
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function JCLContractorReviews() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [reviews, setReviews] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    contractorName: '',
    rating: 5,
    reviewText: ''
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const [revRes, conRes] = await Promise.all([
        powerSync.execute('SELECT * FROM univ_re_contractor_reviews WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
        powerSync.execute('SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY name ASC', [companyId]).catch(() => ({ rows: [] }))
      ]);

      setReviews(revRes.rows._array || Array.from(revRes.rows || []));
      setContractors(conRes.rows._array || Array.from(conRes.rows || []));
    } catch (_err) {
      toast.error('Failed to load contractor reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r =>
      !search ||
      (r.contractor_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.review_text || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [reviews, search]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.contractorName || !formData.reviewText) {
      toast.error('Vendor name and feedback details are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      const newId = generateUUID();
      await powerSync.execute(
        `INSERT INTO univ_re_contractor_reviews (id, created_at, company_id, contractor_name, rating, review_text, reviewer_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId, now, companyId, formData.contractorName, Number(formData.rating) || 5, formData.reviewText, user?.user_metadata?.full_name || 'Inspector']
      );
      toast.success('Vendor evaluation recorded');
      setShowForm(false);
      fetchData();
    } catch (_err) {
      toast.error('Failed to save review');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#006065] to-[#004e52] flex items-center justify-center text-white shadow-md shadow-[#006065]/20">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Contractor Reviews & Performance Audits
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified vendor evaluation scorecards, punctuality ratings, and work order audit notes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button onClick={() => setShowForm(true)} size="sm" className="h-9 px-4 text-xs font-bold gap-1.5 bg-[#006065] hover:bg-[#004e52] text-white shadow-sm">
            <Plus className="h-4 w-4" /> Submit Audit Review
          </Button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-card p-3 rounded-xl border border-border shadow-xs max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search vendor reviews..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* ── Review Cards ── */}
      {filteredReviews.length === 0 ? (
        <div className="p-16 border border-dashed border-border rounded-2xl text-center bg-card">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No vendor reviews submitted yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Audit work order quality and submit ratings for trade partners.
          </p>
          <Button onClick={() => setShowForm(true)} size="sm" className="mt-4 text-xs bg-[#006065] hover:bg-[#004e52] text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Submit Review
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map(r => (
            <div key={r.id} className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 transition-all shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{r.contractor_name || 'Vendor Partner'}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Evaluated by: <strong className="text-foreground">{r.reviewer_name || 'Property Manager'}</strong></p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    <span>{r.rating || 5}/5</span>
                  </div>
                </div>

                <p className="text-xs text-foreground/90 bg-muted/30 p-3 rounded-xl border border-border/60 leading-relaxed italic">
                  "{r.review_text || 'Excellent response time and high quality repair execution.'}"
                </p>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-600" /> Verified Audit</span>
                <span className="font-mono text-[10px]">{r.created_at ? format(new Date(r.created_at), 'MMM dd, yyyy') : 'Recent'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Submit Contractor Review</SheetTitle>
            <SheetDescription>Rate work order quality and vendor responsiveness</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Select Vendor / Contractor *</Label>
              <Select value={formData.contractorName} onValueChange={v => setFormData({ ...formData, contractorName: v })}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue placeholder="Pick a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {contractors.map(c => (
                    <SelectItem key={c.id} value={c.name} className="text-xs">{c.name} ({c.specialty})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Rating Score (1 to 5 Stars)</Label>
              <Select value={String(formData.rating)} onValueChange={v => setFormData({ ...formData, rating: Number(v) })}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-xs">5 Stars — Outstanding Quality</SelectItem>
                  <SelectItem value="4" className="text-xs">4 Stars — Good Execution</SelectItem>
                  <SelectItem value="3" className="text-xs">3 Stars — Satisfactory</SelectItem>
                  <SelectItem value="2" className="text-xs">2 Stars — Needs Improvement</SelectItem>
                  <SelectItem value="1" className="text-xs">1 Star — Poor Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Audit Comments & Performance Feedback *</Label>
              <Input
                value={formData.reviewText}
                onChange={e => setFormData({ ...formData, reviewText: e.target.value })}
                className="h-9 text-xs mt-1"
                placeholder="Describe repair quality, cleanliness, and timing..."
                required
              />
            </div>

            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#006065] hover:bg-[#004e52] text-white mt-2">
              Save Review
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
