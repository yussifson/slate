import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Settings, Save } from 'lucide-react';

export default function IDFormatSettings() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [studentPrefix, setStudentPrefix] = useState('STU');
  const [studentIncludeYear, setStudentIncludeYear] = useState(true);
  const [parentPrefix, setParentPrefix] = useState('PAR');
  
  const { data: settingsRecord, isLoading } = useQuery({
    queryKey: ['school_settings', companyId],
    queryFn: async () => {
      const records = await base44.entities.LegalCase.filter({
        company_id: companyId,
        case_type: 'school_settings'
      });
      if (records.length > 0 && records[0].data) {
        setStudentPrefix(records[0].data.studentPrefix || 'STU');
        setStudentIncludeYear(records[0].data.studentIncludeYear !== false);
        setParentPrefix(records[0].data.parentPrefix || 'PAR');
        return records[0];
      }
      return null;
    },
    enabled: !!companyId
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      const payload = {
        studentPrefix,
        studentIncludeYear,
        parentPrefix
      };
      if (settingsRecord) {
        return base44.entities.LegalCase.update(settingsRecord.id, { notes: JSON.stringify(payload) });
      } else {
        return base44.entities.LegalCase.create({
          company_id: companyId,
          case_type: 'school_settings',
          title: 'Settings',
          status: 'Active',
          notes: JSON.stringify(payload)
        });
      }
    },
    onSuccess: () => {
      toast.success("ID Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ['school_settings', companyId] });
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">Dynamic ID Generation Settings</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground border-b border-border pb-2">Student ID Format</h4>
          <div>
            <Label>Prefix</Label>
            <Input value={studentPrefix} onChange={e => setStudentPrefix(e.target.value)} placeholder="e.g. STU" className="mt-1" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="includeYear" checked={studentIncludeYear} onChange={e => setStudentIncludeYear(e.target.checked)} className="rounded border-input text-primary focus:ring-primary" />
            <Label htmlFor="includeYear">Include Current Year (e.g. {new Date().getFullYear()})</Label>
          </div>
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">Preview:</p>
            <p className="font-mono font-bold text-primary">
              {studentPrefix}{studentPrefix ? '-' : ''}{studentIncludeYear ? new Date().getFullYear() + '-' : ''}0001
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground border-b border-border pb-2">Parent ID Format</h4>
          <div>
            <Label>Prefix</Label>
            <Input value={parentPrefix} onChange={e => setParentPrefix(e.target.value)} placeholder="e.g. PAR" className="mt-1" />
          </div>
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 mt-8">
            <p className="text-xs text-muted-foreground">Preview:</p>
            <p className="font-mono font-bold text-primary">
              {parentPrefix}{parentPrefix ? '-' : ''}0001
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="w-4 h-4" /> {saveSettings.isPending ? 'Saving...' : 'Save Format Settings'}
        </Button>
      </div>
    </div>
  );
}
