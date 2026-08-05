import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export default function ModalForm({
  open,
  onOpenChange,
  title,
  subtitle,
  isEditing = false,
  fields = [],
  formData,
  onChange,
  onSubmit,
  loading = false,
  submitText
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const renderField = (field) => {
    const value = formData[field.name] ?? '';

    switch (field.type) {
      case 'select':
        return (
          <Select value={String(value)} onValueChange={(v) => onChange(field.name, v)} disabled={field.disabled}>
            <SelectTrigger className="mt-1.5 h-10 rounded-xl border-border/50 bg-background text-sm">
              <SelectValue placeholder={field.placeholder || 'Select option...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1.5 rounded-xl border-border/50 bg-background text-sm p-3"
            rows={field.rows || 4}
            disabled={field.disabled}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1.5 h-10 rounded-xl border-border/50 bg-background text-sm"
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={field.disabled}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="mt-1.5 h-10 rounded-xl border-border/50 bg-background text-sm"
            disabled={field.disabled}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1.5 h-10 rounded-xl border-border/50 bg-background text-sm"
            disabled={field.disabled}
          />
        );
      case 'tel':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1.5 h-10 rounded-xl border-border/50 bg-background text-sm"
            disabled={field.disabled}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1.5 h-10 rounded-xl border-border/50 bg-background text-sm"
            required={field.required}
            disabled={field.disabled}
            readOnly={field.readOnly}
          />
        );
    }
  };

  const finalSubmitText = submitText || (isEditing ? 'Save Changes' : 'Create Record');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-lg p-0 border-l border-border/40 shadow-2xl flex flex-col h-full bg-card">
        {/* Header styling matches Grades modal: Indigo for Add, Amber for Edit */}
        <div className={`px-6 py-5 flex items-center justify-between transition-colors flex-shrink-0 ${
          isEditing 
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white' 
            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
        }`}>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="text-xs text-white/80 mt-0.5">
              {subtitle || (isEditing ? 'Modify existing record details' : 'Fill in information to create a new entry')}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => onOpenChange(false)} 
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  {field.label}
                  {field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {field.hint && <p className="text-[11px] text-muted-foreground/70 mt-1">{field.hint}</p>}
              </div>
            ))}
          </div>

          {/* Sticky Footer */}
          <div className="p-4 border-t border-border/30 bg-muted/20 flex gap-3 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`flex-1 h-10 rounded-xl font-semibold text-white transition-colors ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Processing...' : finalSubmitText}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
