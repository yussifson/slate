import { useTranslation } from "react-i18next";
import { Input } from '@/components/ui/input';

/**
 * CustomFieldsRenderer
 * Dynamically renders custom fields for a specific record type.
 * 
 * Props:
 *   fields: array of custom field definitions
 *   formData: current form state object containing custom data
 *   onChange: function to update form state (key, value) => void
 */
export default function CustomFieldsRenderer({ fields = [], formData = {}, onChange }) {
  const { t } = useTranslation();
  if (!fields.length) return null;

  return (
    <div className="pt-4 mt-4 border-t border-primary/40">
      <h4 className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-3 tracking-[0.04em]">{t("custom_fields", "Custom Fields")}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(field => {
          const value = formData[field.field_name] || '';

          return (
            <div key={field.id}>
              <label className="text-xs font-semibold text-card-foreground flex items-center gap-2 tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                {field.field_label}
                {field.is_required && <span className="text-red-500">*</span>}
              </label>
              {field.field_type === 'select' ? (
                <select
                  value={value}
                  onChange={(e) => onChange(field.field_name, e.target.value)}
                  required={field.is_required}
                  className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">{t("select_option", "Select option...")}</option>
                  {(field.field_options || []).map(opt => {
                    return (<option key={opt} value={opt}>{opt}</option>);
                  })}
                </select>
              ) : field.field_type === 'number' ? (
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => onChange(field.field_name, e.target.value)}
                  required={field.is_required}
                  className="mt-1"
                />
              ) : field.field_type === 'date' ? (
                <Input
                  type="date"
                  value={value}
                  onChange={(e) => onChange(field.field_name, e.target.value)}
                  required={field.is_required}
                  className="mt-1"
                />
              ) : field.field_type === 'boolean' ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value === 'true' || value === true}
                    onChange={(e) => onChange(field.field_name, e.target.checked)}
                    className="rounded-md border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{t("yes_no", "Yes / No")}</span>
                </div>
              ) : (
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(field.field_name, e.target.value)}
                  required={field.is_required}
                  className="mt-1"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
