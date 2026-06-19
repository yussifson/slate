import React, { useState} from 'react';
import { useMutation, useQueryClient} from '@tanstack/react-query';
import { base44} from '@/api/base44Client';
import { cn} from '@/lib/utils';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Label} from '@/components/ui/label';
import { toast} from 'react-hot-toast';

export default function FormBlock({ dataConfig, styleConfig}) {
 const { table, fields} = dataConfig;
 const { theme, padding} = styleConfig || {};
 const queryClient = useQueryClient();

 const [formData, setFormData] = useState({});

 const mutation = useMutation({
 mutationFn: (data) => base44.entities[table].create(data),
 onSuccess: () => {
 toast.success("Record created successfully!");
 setFormData({});
 queryClient.invalidateQueries({ queryKey: ['dynamic_table']});
 queryClient.invalidateQueries({ queryKey: ['dynamic_kanban']});
 queryClient.invalidateQueries({ queryKey: ['dynamic_metric']});
},
 onError: (err) => {
 toast.error("Failed to create record: " + err.message);
}
});

 const handleSubmit = (e) => {
 e.preventDefault();
 mutation.mutate(formData);
};

 const bgClass = theme === 'dark' ? 'bg-slate-900 text-white border-primary/40' : 'bg-card text-card-foreground border-primary/40';
 const padClass = padding || 'p-6';

 return (
 <div className={cn("rounded-xl border ", bgClass, padClass)}>
 <h3 className="font-semibold text-lg mb-4">Create New {table ? table.replace(/_/g, ' ') : 'Record'}</h3>
 <form onSubmit={handleSubmit} className="space-y-4">
 {fields?.map((f, i) => (
 <div key={i}>
 <Label className="mb-1 block">{f.label || f.name}</Label>
 <Input 
 type={f.type || 'text'} 
 value={formData[f.name] || ''} 
 onChange={(e) => setFormData(prev => ({ ...prev, [f.name]: e.target.value}))}
 required={f.required}
 className={theme === 'dark' ? 'bg-slate-800 border-primary/40' : ''}
 placeholder={f.placeholder || `Enter ${f.label || f.name}`}
 />
 </div>
 ))}
 <Button type="submit" disabled={mutation.isPending} className="w-full mt-2">
 {mutation.isPending ? 'Saving...' : 'Submit'}
 </Button>
 </form>
 </div>
 );
}
