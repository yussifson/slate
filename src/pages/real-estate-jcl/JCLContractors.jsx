import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Star, Plus, Edit, Trash2, Search, Phone, Mail, CheckCircle2, Shield, RefreshCw, Eye, Grid, List, Building2, User
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function JCLContractors() {
  const companyId = useCompanyId();
  const powerSync = usePowerSync();

  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  // Sheets & Modals
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [inspectorContractor, setInspectorContractor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'Plumbing',
    phone: '',
    email: '',
    rating: 4.8,
    licenseNumber: '',
    hourlyRate: 85,
    notes: ''
  });

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_contractors WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setContractors(res.rows._array || Array.from(res.rows || []));
    } catch (_err) {
      toast.error('Failed to load contractors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredContractors = useMemo(() => {
    return contractors.filter(c => {
      const matchSearch =
        !search ||
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.specialty || '').toLowerCase().includes(search.toLowerCase());
      const matchSpecialty = specialtyFilter === 'all' || (c.specialty || '').toLowerCase() === specialtyFilter.toLowerCase();
      return matchSearch && matchSpecialty;
    });
  }, [contractors, search, specialtyFilter]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      specialty: 'Plumbing',
      phone: '',
      email: '',
      rating: 4.8,
      licenseNumber: '',
      hourlyRate: 85,
      notes: ''
    });
    setShowFormSheet(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name || '',
      specialty: c.specialty || 'General Trade',
      phone: c.phone || '',
      email: c.email || '',
      rating: c.rating || 4.8,
      licenseNumber: c.license_number || '',
      hourlyRate: c.hourly_rate || 85,
      notes: c.notes || ''
    });
    setShowFormSheet(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Contractor name is required');
      return;
    }

    try {
      const now = new Date().toISOString();
      if (editingId) {
        await powerSync.execute(
          `UPDATE univ_re_contractors SET name = ?, specialty = ?, phone = ?, email = ?, rating = ?, notes = ? WHERE id = ? AND company_id = ?`,
          [formData.name, formData.specialty, formData.phone || null, formData.email || null, Number(formData.rating) || 4.8, formData.notes || null, editingId, companyId]
        );
        toast.success('Contractor details updated');
      } else {
        const newId = generateUUID();
        await powerSync.execute(
          `INSERT INTO univ_re_contractors (id, created_at, company_id, name, specialty, phone, email, rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, now, companyId, formData.name, formData.specialty, formData.phone || null, formData.email || null, Number(formData.rating) || 4.8, formData.notes || null]
        );
        toast.success('New contractor onboarded');
      }
      setShowFormSheet(false);
      fetchData();
    } catch (_err) {
      toast.error('Failed to save contractor');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await powerSync.execute('DELETE FROM univ_re_contractors WHERE id = ? AND company_id = ?', [deleteTarget.id, companyId]);
      toast.success('Contractor record deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (_err) {
      toast.error('Failed to delete contractor');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-28 w-full max-w-full space-y-6 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#006065] to-[#004e52] flex items-center justify-center text-white shadow-md shadow-[#006065]/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Contractors & Maintenance Vendors
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified trade partners, licensed plumbers, electricians, HVAC specialists, and rate cards
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9 px-3 text-xs gap-1.5 border-border">
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button onClick={handleOpenCreate} size="sm" className="h-9 px-4 text-xs font-bold gap-1.5 bg-[#006065] hover:bg-[#004e52] text-white shadow-sm">
            <Plus className="h-4 w-4" /> Add Contractor
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by vendor name or trade specialty..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background">
              <SelectValue placeholder="Trade Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Specialties</SelectItem>
              <SelectItem value="plumbing" className="text-xs">Plumbing</SelectItem>
              <SelectItem value="electrical" className="text-xs">Electrical</SelectItem>
              <SelectItem value="hvac" className="text-xs">HVAC Aircon</SelectItem>
              <SelectItem value="general trade" className="text-xs">General Trade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Grid ── */}
      {filteredContractors.length === 0 ? (
        <div className="p-16 border border-dashed border-border rounded-2xl text-center bg-card">
          <Wrench className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No contractors registered</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Onboard trade vendors to handle maintenance tickets and work orders.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="mt-4 text-xs bg-[#006065] hover:bg-[#004e52] text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Contractor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContractors.map(c => {
            const initials = (c.name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div
                key={c.id}
                onClick={() => setInspectorContractor(c)}
                className="group relative flex flex-col rounded-2xl border border-border/60 hover:border-emerald-500/50 bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {/* Emerald Header Banner */}
                <div className="relative h-24 flex items-center justify-between p-4 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-base font-black shadow-inner">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight tracking-tight">{c.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                        {c.specialty || 'General Trade'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm text-xs font-bold relative z-10">
                    <Star className="h-3.5 w-3.5 fill-white text-white" />
                    <span>{c.rating || 4.9}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60">
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" /> {c.phone || 'Phone Unlisted'}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-blue-600" /> Email
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between mt-auto" onClick={e => e.stopPropagation()}>
                    <Badge variant="outline" className="text-[10px] bg-[#006065]/10 text-emerald-700 dark:text-emerald-400 border-[#006065]/30 font-bold uppercase">
                      Verified Partner
                    </Badge>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600" onClick={() => setInspectorContractor(c)} title="Inspect">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(c)} title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDeleteTarget(c)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Form Sheet ── */}
      <Sheet open={showFormSheet} onOpenChange={setShowFormSheet}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingId ? 'Edit Contractor Record' : 'Onboard New Trade Vendor'}</SheetTitle>
            <SheetDescription>Maintain contractor contact details and license information</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <Label className="text-xs">Contractor / Firm Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">Trade Specialty</Label>
              <Select value={formData.specialty} onValueChange={v => setFormData({ ...formData, specialty: v })}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plumbing" className="text-xs">Plumbing</SelectItem>
                  <SelectItem value="Electrical" className="text-xs">Electrical</SelectItem>
                  <SelectItem value="HVAC Aircon" className="text-xs">HVAC Aircon</SelectItem>
                  <SelectItem value="General Trade" className="text-xs">General Trade</SelectItem>
                  <SelectItem value="Roofing & Masonry" className="text-xs">Roofing & Masonry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-9 text-xs font-bold bg-[#006065] hover:bg-[#004e52] text-white mt-2">
              Save Vendor Record
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Slide-Over Inspector Drawer ── */}
      <Sheet open={!!inspectorContractor} onOpenChange={open => !open && setInspectorContractor(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-0 flex flex-col font-sans">
          {inspectorContractor && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                    {inspectorContractor.specialty || 'General Trade'}
                  </Badge>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-md">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    <span>{inspectorContractor.rating || 4.9} Audit Score</span>
                  </div>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground mt-2">
                  {inspectorContractor.name}
                </SheetTitle>
              </SheetHeader>

              <div className="p-6 space-y-6 flex-1">
                <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
                  <p className="font-semibold text-foreground flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> {inspectorContractor.phone || 'Phone Unlisted'}</p>
                  <p className="font-semibold text-foreground flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /> {inspectorContractor.email || 'Email Unlisted'}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteTarget?.name} from vendor registry?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
