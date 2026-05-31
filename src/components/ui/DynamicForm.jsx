import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DynamicForm({ moduleDef, fieldDefinitions = [], onSuccess, onCancel }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (!moduleDef) return;
    setIsSubmitting(true);
    try {
      const record = {
        id: crypto.randomUUID(),
        module_id: moduleDef.id,
        company_id: user?.company_id || moduleDef.company_id,
        data: data,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('dynamic_records').insert(record);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Record created successfully.",
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error creating record", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const fieldName = field.name;
    const label = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const isRequired = field.is_required === 'true' || field.is_required === true;

    switch (field.field_type) {
      case 'boolean':
        return (
          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm" key={field.id}>
            <div className="space-y-0.5">
              <Label className="text-base">{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            </div>
            <Switch
              onCheckedChange={(val) => setValue(fieldName, val)}
              {...register(fieldName)}
            />
          </div>
        );

      case 'select':
        let options = [];
        try {
          options = typeof field.options === 'string' ? JSON.parse(field.options) : (field.options || []);
        } catch (e) {
          options = [];
        }

        return (
          <div className="space-y-2" key={field.id}>
            <Label>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            <Select onValueChange={(val) => setValue(fieldName, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((opt, idx) => (
                  <SelectItem key={idx} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register(fieldName, { required: isRequired })} />
            {errors[fieldName] && <span className="text-xs text-red-500">This field is required</span>}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2" key={field.id}>
            <Label>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            <Input
              type="number"
              placeholder={`Enter ${label.toLowerCase()}`}
              {...register(fieldName, { required: isRequired, valueAsNumber: true })}
            />
            {errors[fieldName] && <span className="text-xs text-red-500">This field is required</span>}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2" key={field.id}>
            <Label>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            <Input
              type="date"
              {...register(fieldName, { required: isRequired })}
            />
            {errors[fieldName] && <span className="text-xs text-red-500">This field is required</span>}
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-2" key={field.id}>
            <Label>{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            <Input
              type="text"
              placeholder={`Enter ${label.toLowerCase()}`}
              {...register(fieldName, { required: isRequired })}
            />
            {errors[fieldName] && <span className="text-xs text-red-500">This field is required</span>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {fieldDefinitions.map(renderField)}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Record'
          )}
        </Button>
      </div>
    </form>
  );
}
