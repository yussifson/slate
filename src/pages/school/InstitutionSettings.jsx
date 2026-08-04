import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIndustryRecords, useMutateIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';
import { Save, Building2, Calendar, MapPin, Phone, Mail, Globe, GraduationCap } from 'lucide-react';
import SchoolAPI from '@/api/SchoolAPI';

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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-[var(--primary)] font-semibold animate-pulse text-lg tracking-tight">Loading Settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tracking-[-0.02em]">
            {t('institution_settings', 'Institution Settings')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
            Manage your school profile, academic sessions, and core structures.
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2" disabled={mutateSettings.isPending}>
          <Save className="w-4 h-4" /> 
          {mutateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-primary">{formData.academic_year}</h2>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {formData.current_term} • {formData.term_start_date ? new Date(formData.term_start_date).toLocaleDateString() : 'N/A'} - {formData.term_end_date ? new Date(formData.term_end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Current Session</div>
                <div className="text-lg font-medium text-slate-800 dark:text-slate-200">{formData.school_name || 'School Name'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Settings */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5"/> Academic Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={formData.academic_year} onChange={e => handleChange('academic_year', e.target.value)} placeholder="e.g. 2024/2025" />
              </div>
              <div className="space-y-2">
                <Label>Current Term</Label>
                <Select value={formData.current_term} onValueChange={v => handleChange('current_term', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term Start Date</Label>
                <Input type="date" value={formData.term_start_date} onChange={e => handleChange('term_start_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Term End Date</Label>
                <Input type="date" value={formData.term_end_date} onChange={e => handleChange('term_end_date', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Profile */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5"/> School Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input value={formData.school_name} onChange={e => handleChange('school_name', e.target.value)} placeholder="Enter school name" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School Type</Label>
                <Select value={formData.school_type} onValueChange={v => handleChange('school_type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="International">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Accreditation</Label>
                <Input value={formData.accreditation} onChange={e => handleChange('accreditation', e.target.value)} placeholder="e.g. GES Accredited" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motto</Label>
              <Input value={formData.motto} onChange={e => handleChange('motto', e.target.value)} placeholder="School motto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Input value={formData.currency} onChange={e => handleChange('currency', e.target.value)} placeholder="e.g. GHS" />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={formData.logo_url} onChange={e => handleChange('logo_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5"/> Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="w-3 h-3"/> Phone</Label>
              <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Contact number" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="w-3 h-3"/> Email</Label>
              <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="Email address" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Globe className="w-3 h-3"/> Website</Label>
              <Input value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="Website URL" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="w-3 h-3"/> Address</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.address} 
                onChange={e => handleChange('address', e.target.value)} 
                placeholder="Physical address" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
