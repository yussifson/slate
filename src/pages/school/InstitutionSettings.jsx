import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';
import { Save, Building2, Calendar, MapPin, Phone, Mail, Globe } from 'lucide-react';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function InstitutionSettings() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  
  const { data: settingsRecords = [], isLoading } = useIndustryRecords('school_settings');
  const mutateSettings = useMutateIndustryRecord();
  
  const [formData, setFormData] = useState({
    school_name: '',
    school_type: 'Public',
    accreditation: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    motto: '',
    academic_year: '2024/2025',
    current_term: 'Term 1',
    term_start_date: '',
    term_end_date: '',
    levels: ['KG', 'Primary', 'JHS'],
    currency: 'GHS',
    logo_url: ''
  });
  const [existingId, setExistingId] = useState(null);
  
  useEffect(() => {
    if (settingsRecords.length > 0) {
      const record = settingsRecords[0];
      setExistingId(record.id);
      if (record.data) {
        setFormData(prev => ({ ...prev, ...record.data }));
      }
    }
  }, [settingsRecords]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await mutateSettings.mutateAsync({
        id: existingId,
        recordType: 'school_settings',
        payload: formData,
        status: 'Active',
        searchText: `${formData.school_name} ${formData.academic_year}`
      });
      toast.success('Institution settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Institution Settings"
      subtitle="Manage your school profile, academic sessions, and core structures"
      breadcrumb={['School', 'Settings']}
      actions={
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium flex items-center gap-1.5" disabled={mutateSettings.isPending}>
          <Save className="w-4 h-4" /> 
          {mutateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
          {/* Main profile and session banner */}
          <div className="lg:col-span-3 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{formData.academic_year || 'Academic Year'}</h2>
                <p className="text-xs text-indigo-100 font-medium">
                  {formData.current_term} · {formData.term_start_date ? new Date(formData.term_start_date).toLocaleDateString() : 'N/A'} – {formData.term_end_date ? new Date(formData.term_end_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">Current Institution</p>
              <h3 className="font-bold text-base mt-0.5">{formData.school_name || 'My School'}</h3>
            </div>
          </div>

          {/* Left / Middle: academic details & school profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Period */}
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
                <Calendar className="w-4 h-4 text-indigo-600" /> Academic Period
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Academic Year</Label>
                  <Input value={formData.academic_year} onChange={e => handleChange('academic_year', e.target.value)} placeholder="e.g. 2024/2025" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Current Term</Label>
                  <select value={formData.current_term} onChange={e => handleChange('current_term', e.target.value)} className={inputCls}>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Term Start Date</Label>
                  <Input type="date" value={formData.term_start_date} onChange={e => handleChange('term_start_date', e.target.value)} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Term End Date</Label>
                  <Input type="date" value={formData.term_end_date} onChange={e => handleChange('term_end_date', e.target.value)} className="h-10" />
                </div>
              </div>
            </div>

            {/* School Profile */}
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
                <Building2 className="w-4 h-4 text-indigo-600" /> School Profile
              </h3>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold">School Name</Label>
                <Input value={formData.school_name} onChange={e => handleChange('school_name', e.target.value)} placeholder="Enter school name" className="h-10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">School Type</Label>
                  <select value={formData.school_type} onChange={e => handleChange('school_type', e.target.value)} className={inputCls}>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                    <option value="International">International</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Accreditation</Label>
                  <Input value={formData.accreditation} onChange={e => handleChange('accreditation', e.target.value)} placeholder="e.g. GES Accredited" className="h-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold">Motto</Label>
                <Input value={formData.motto} onChange={e => handleChange('motto', e.target.value)} placeholder="School motto" className="h-10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Default Currency</Label>
                  <Input value={formData.currency} onChange={e => handleChange('currency', e.target.value)} placeholder="e.g. GHS" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase font-semibold">Logo URL</Label>
                  <Input value={formData.logo_url} onChange={e => handleChange('logo_url', e.target.value)} placeholder="https://..." className="h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar: contact information */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
                <MapPin className="w-4 h-4 text-indigo-600" /> Contact Info
              </h3>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</Label>
                <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Contact number" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
                <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="Email address" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</Label>
                <Input value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="Website URL" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</Label>
                <textarea 
                  className="flex min-h-[90px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  value={formData.address} 
                  onChange={e => handleChange('address', e.target.value)} 
                  placeholder="Physical address" 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </SchoolPageShell>
  );
}
