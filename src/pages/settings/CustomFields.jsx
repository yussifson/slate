import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Database, Plus, Trash2, Edit2, CheckCircle2, ShieldAlert} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { toast} from 'react-hot-toast';
import { useCustomFields, useMutateCustomField, useDeleteCustomField} from '@/hooks/useCustomFields';

const RECORD_TYPES = [
 { id: 'customer', label: 'Customers'},
 { id: 'inventory', label: 'Inventory Items'},
 { id: 'sale', label: 'Sales Transactions'},
 { id: 'employee', label: 'Employees'},
 { id: 'patient', label: 'Patients'},
 { id: 'student', label: 'Students'},
 { id: 'shipment', label: 'Logistics Shipments'},
 { id: 'underwriting_application', label: 'Underwriting Applications'},
];

export default function CustomFields() {
 const { t} = useTranslation();
 const [selectedType, setSelectedType] = useState('customer');
 const { data: fields = [], isLoading} = useCustomFields(selectedType);
 const mutateField = useMutateCustomField();
 const deleteField = useDeleteCustomField();

 const [showModal, setShowModal] = useState(false);
 const [editingField, setEditingField] = useState(null);

 const [formData, setFormData] = useState({
 fieldLabel: '',
 fieldName: '',
 fieldType: 'text',
 fieldOptions: '', // comma separated
 isRequired: false
});

 const handleOpenModal = (field = null) => {
 if (field) {
 setEditingField(field);
 setFormData({
 fieldLabel: field.field_label,
 fieldName: field.field_name,
 fieldType: field.field_type,
 fieldOptions: (field.field_options || []).join(', '),
 isRequired: field.is_required
});
} else {
 setEditingField(null);
 setFormData({
 fieldLabel: '',
 fieldName: '',
 fieldType: 'text',
 fieldOptions: '',
 isRequired: false
});
}
 setShowModal(true);
};

 const handleSave = () => {
 if (!formData.fieldLabel || !formData.fieldName) {
 return toast.error('Label and Name are required');
}

 const options = formData.fieldType === 'select' 
 ? formData.fieldOptions.split(',').map(s => s.trim()).filter(Boolean)
 : [];

 mutateField.mutate({
 id: editingField?.id,
 recordType: selectedType,
 fieldName: formData.fieldName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
 fieldLabel: formData.fieldLabel,
 fieldType: formData.fieldType,
 fieldOptions: options,
 isRequired: formData.isRequired
}, {
 onSuccess: () => {
 toast.success(editingField ? 'Field updated!' : 'Field created!');
 setShowModal(false);
},
 onError: (err) => {
 toast.error('Failed to save field: ' + err.message);
}
});
};

 const handleDelete = (id) => {
 if (confirm('Are you sure you want to delete this custom field? Data previously entered into this field will not be lost, but it will no longer be visible in forms.')) {
 deleteField.mutate(id, {
 onSuccess: () => toast.success('Field deleted!')
});
}
};

 return (
 <div className="space-y-6 max-w-5xl mx-auto pb-12 pt-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Database className="w-6 h-6 text-primary" />
 {t("custom_fields_engine", "Custom Fields Engine")}
 </h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">{t(
 "add_organization_specific_data",
 "Add organization-specific data fields to standard records."
 )}</p>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 {/* Sidebar */}
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl p-4 h-fit hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-3 tracking-[0.04em]">{t("record_types", "Record Types")}</h3>
 <div className="space-y-1">
 {RECORD_TYPES.map(type => {
 return (
 <button
 key={type.id}
 onClick={() => setSelectedType(type.id)}
 className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${
 selectedType === type.id 
 ? 'bg-primary text-primary-foreground font-medium ' 
 : 'text-[#71717a] dark:text-gray-400 hover:bg-muted hover:text-foreground'
}`}
 >
 {type.label}
 </button>
 );
})}
 </div>
 </div>

 {/* Main Content */}
 <div className="md:col-span-3 space-y-4">
 <div className="flex items-center justify-between bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-xl  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div>
 <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {t("fields_for", "Fields for")} {RECORD_TYPES.find(item => item.id === selectedType)?.label}
 </h2>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t(
 "manage_the_custom_schema_for_t",
 "Manage the custom schema for these records."
 )}</p>
 </div>
 <Button onClick={() => handleOpenModal()} className="gap-2 bg-primary text-primary-foreground">
 <Plus className="w-4 h-4" /> {t("add_field", "Add Field")}
 </Button>
 </div>

 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {isLoading ? (
 <div className="p-8 text-center text-[#71717a] dark:text-gray-400">{t("loading_custom_schema", "Loading custom schema...")}</div>
 ) : fields.length === 0 ? (
 <div className="p-12 text-center text-[#71717a] dark:text-gray-400">
 <Database className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_custom_fields_yet", "No Custom Fields Yet")}</p>
 <p className="text-sm mt-1 max-w-md mx-auto">{t(
 "click_add_field_to_attach_spec",
 "Click \"Add Field\" to attach specialized data tracking to this record type."
 )}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-b border-primary/40 text-left">
 <tr>
 <th className="px-6 py-4 text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("field_info", "Field Info")}</th>
 <th className="px-6 py-4 text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("internal_key", "Internal Key")}</th>
 <th className="px-6 py-4 text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("type_validation", "Type & Validation")}</th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("actions", "Actions")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {fields.map(field => {
 return (
 <tr key={field.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{field.field_label}</p>
 </td>
 <td className="px-6 py-4 font-mono text-xs text-primary tracking-[0.04em]">{field.field_name}</td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium uppercase tracking-[0.04em]">{field.field_type}</span>
 {field.is_required && (
 <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold uppercase tracking-[0.04em]">{t("required", "Required")}</span>
 )}
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <Button variant="ghost" size="sm" onClick={() => handleOpenModal(field)} className="h-8 w-8 p-0">
 <Edit2 className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => handleDelete(field.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 )}
 </div>
 </div>
 </div>
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{editingField ? 'Edit Custom Field' : 'New Custom Field'}</h2>
 
 <div className="space-y-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("field_label_ui", "Field Label (UI)")}</label>
 <Input 
 value={formData.fieldLabel} 
 onChange={e => {
 const val = e.target.value;
 setFormData(prev => ({
 ...prev, 
 fieldLabel: val,
 // auto-generate field_name if not editing
 fieldName: !editingField ? val.toLowerCase().replace(/[^a-z0-9]/g, '_') : prev.fieldName
}))
}} 
 placeholder="e.g. Tax ID Number" 
 className="mt-1" 
 />
 </div>

 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase flex items-center justify-between tracking-[0.04em]">
 <span>{t("internal_key", "Internal Key")}</span>
 <span className="text-red-500 font-normal lowercase tracking-wide opacity-80 text-[10px]"><ShieldAlert className="w-3 h-3 inline mr-0.5"/> {t("cannot_change_later", "cannot change later")}</span>
 </label>
 <Input 
 value={formData.fieldName} 
 onChange={e => setFormData({...formData, fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})} 
 placeholder="tax_id_number" 
 className="mt-1 font-mono text-sm"
 disabled={!!editingField} 
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("data_type", "Data Type")}</label>
 <select 
 value={formData.fieldType} 
 onChange={e => setFormData({...formData, fieldType: e.target.value})} 
 className="mt-1 w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm text-foreground"
 >
 <option value="text">{t("short_text", "Short Text")}</option>
 <option value="number">{t("number", "Number")}</option>
 <option value="date">{t("date", "Date")}</option>
 <option value="boolean">{t("yes_no", "Yes/No")}</option>
 <option value="select">{t("dropdown_select", "Dropdown Select")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("requirement", "Requirement")}</label>
 <div className="mt-2 flex items-center gap-2">
 <input 
 type="checkbox" 
 checked={formData.isRequired}
 onChange={e => setFormData({...formData, isRequired: e.target.checked})}
 className="rounded-md border-input text-primary focus:ring-primary"
 />
 <span className="text-sm font-medium">{t("must_fill", "Must fill")}</span>
 </div>
 </div>
 </div>

 {formData.fieldType === 'select' && (
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("dropdown_options", "Dropdown Options")}</label>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 mb-1">{t("separate_options_with_commas", "Separate options with commas.")}</p>
 <Input 
 value={formData.fieldOptions} 
 onChange={e => setFormData({...formData, fieldOptions: e.target.value})} 
 placeholder="Option A, Option B, Option C" 
 />
 </div>
 )}
 </div>

 <div className="flex gap-3 pt-4 border-t border-primary/40 mt-6">
 <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleSave}>{t("save_schema", "Save Schema")}</Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
