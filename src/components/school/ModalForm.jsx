import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function ModalForm({
  open,
  onOpenChange,
  title,
  fields = [],
  formData,
  onChange,
  onSubmit,
  loading = false,
  submitText = 'Save'
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';
    const inputClass = "mt-2 rounded-xl border border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-indigo-600 focus-visible:ring-indigo-600 focus-visible:border-indigo-600";

    switch (field.type) {
      case 'select':
        return (
          <Select value={String(value)} onValueChange={(v) => onChange(field.name, v)}>
            <SelectTrigger className={`mt-2 rounded-xl border border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-indigo-600 focus:border-indigo-600`}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-xl shadow-xl">
              {field.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
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
            className={inputClass}
            rows={4}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={inputClass}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        );
      case 'tel':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
            required={field.required}
          />
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto rounded-l-[2rem] border-l border-[#F0EBE1] bg-[#FCFAF7] dark:bg-zinc-950 shadow-2xl p-8 font-outfit">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="text-sm font-semibold text-[#1F1E1C] dark:text-zinc-200 block mb-1">
                {field.label}
                {field.required && <span className="text-rose-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {field.hint && <p className="text-xs text-zinc-400 mt-1">{field.hint}</p>}
            </div>
          ))}

          <div className="flex gap-3 pt-6 border-t border-[#F0EBE1] dark:border-zinc-800/80">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-95 text-white font-semibold shadow-md transition-all hover:scale-[1.02] border-0"
            >
              {loading ? 'Saving...' : submitText}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 text-[#1F1E1C] dark:text-zinc-50 font-semibold"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
