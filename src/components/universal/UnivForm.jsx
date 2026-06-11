import React, { useState } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, File as FileIcon, Calendar, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivForm({
  title = "Dynamic Form",
  subtitle = "Fill out the required information below.",
  fields = [
    { id: 'f1', label: 'Full Name', type: 'text', placeholder: 'Jane Doe', required: true },
    { id: 'f2', label: 'Email Address', type: 'email', placeholder: 'jane@example.com', required: true },
    { id: 'f3', label: 'Department', type: 'select', options: ['Engineering', 'Marketing', 'Sales', 'HR'], required: true },
    { id: 'f4', label: 'Start Date', type: 'date', required: false },
    { id: 'f5', label: 'Additional Notes', type: 'textarea', placeholder: 'Any extra context...', required: false },
    { id: 'f6', label: 'Resume / Document', type: 'file', required: false }
  ],
  onSubmit = null
}) {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');

  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (id, file) => {
    if (file) {
      setFormData(prev => ({ ...prev, [id]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        toast.success("Form submitted successfully!");
        setFormData({});
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto custom-scrollbar ${view !== 'Default' ? 'hide-default' : ''}">
      <div className="view-header max-w-3xl w-full mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                <input 
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
              ) : field.type === 'textarea' ? (
                <textarea 
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow resize-none"
                />
              ) : field.type === 'select' ? (
                <div className="relative">
                  <select 
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="w-full h-11 pl-4 pr-10 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                  >
                    <option value="" disabled>Select an option</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ) : field.type === 'date' ? (
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <input 
                    type="date"
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              ) : field.type === 'file' ? (
                <div 
                  className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/30'} relative`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileChange(field.id, e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleFileChange(field.id, e.target.files[0]);
                    }}
                  />
                  {formData[field.id] ? (
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Check className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formData[field.id].name}</p>
                      <p className="text-xs text-muted-foreground">{(formData[field.id].size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <div className="w-12 h-12 bg-muted text-muted-foreground rounded-xl flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">SVG, PNG, JPG or PDF (max. 10MB)</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-8">
            <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground bg-muted hover:bg-muted/60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Saving...
                </>
              ) : (
                <>Submit</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
