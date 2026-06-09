import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Filter, Plus, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'not_equals', label: 'Not equals' },
];

function emptyCondition() {
  return { field: '', operator: 'equals', value: '' };
}

/**
 * QueryBuilder — premium filter panel with AND/OR logic and saved views integration.
 *
 * Props:
 *   fields: [{key, label, type: 'text'|'select'|'number', options?: string[]}]
 *   onApply: ({logic, conditions}) => void
 *   onClear: () => void
 */
export default function QueryBuilder({ fields = [], onApply, onClear }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [logic, setLogic] = useState('AND');
  const [conditions, setConditions] = useState([emptyCondition()]);

  const activeCount = conditions.filter(c => c.field && c.value).length;

  const updateCondition = (idx, patch) => {
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  const addCondition = () => setConditions(prev => [...prev, emptyCondition()]);
  const removeCondition = (idx) => setConditions(prev => prev.filter((_, i) => i !== idx));

  const handleApply = () => {
    const valid = conditions.filter(c => c.field && c.value);
    if (onApply) onApply({ logic, conditions: valid });
    setIsOpen(false);
  };

  const handleClear = () => {
    setConditions([emptyCondition()]);
    if (onClear) onClear();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
          activeCount > 0
            ? 'border-primary bg-slate-100 text-primary'
            : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {t("filters", "Filters")}
        {activeCount > 0 && (
          <span className="ml-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
      </button>
      {/* Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-30 w-[480px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> {t("advanced_filters", "Advanced Filters")}
            </h3>
            {/* AND / OR toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {['AND', 'OR'].map(l => {
                return (
                  <button
                    key={l}
                    onClick={() => setLogic(l)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      logic === l ? 'bg-card shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {conditions.map((cond, idx) => {
              const fieldDef = fields.find(f => f.key === cond.field);
              return (
                <div key={idx} className="flex items-center gap-2 group">
                  {/* Logic label */}
                  <span className="text-[10px] font-bold text-muted-foreground w-7 text-right flex-shrink-0">
                    {idx === 0 ? 'WHERE' : logic}
                  </span>
                  {/* Field selector */}
                  <Select value={cond.field} onValueChange={v => updateCondition(idx, { field: v, value: '' })}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-0 bg-background">
                      <SelectValue placeholder="Choose field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map(f => {
                        return (<SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>);
                      })}
                    </SelectContent>
                  </Select>
                  {/* Operator selector */}
                  <Select value={cond.operator} onValueChange={v => updateCondition(idx, { operator: v })}>
                    <SelectTrigger className="h-8 text-xs w-32 flex-shrink-0 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => {
                        return (<SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>);
                      })}
                    </SelectContent>
                  </Select>
                  {/* Value input or select */}
                  {fieldDef?.type === 'select' ? (
                    <Select value={cond.value} onValueChange={v => updateCondition(idx, { value: v })}>
                      <SelectTrigger className="h-8 text-xs flex-1 bg-background">
                        <SelectValue placeholder="Value..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(fieldDef.options || []).map(opt => {
                          return (<SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>);
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={cond.value}
                      onChange={e => updateCondition(idx, { value: e.target.value })}
                      placeholder="Value..."
                      className="h-8 text-xs flex-1 bg-background"
                      type={fieldDef?.type === 'number' ? 'number' : 'text'}
                    />
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => removeCondition(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add condition */}
          <button
            onClick={addCondition}
            className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> {t("add_condition", "Add Condition")}
          </button>

          {/* Footer actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">{t("clear_all", "Clear All")}</Button>
            <Button size="sm" onClick={handleApply} className="flex-1 bg-primary text-primary-foreground">
              {t("apply_filters", "Apply Filters")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Apply a filter object from QueryBuilder to an array of records.
 * Works client-side for in-memory arrays.
 */
export function applyFilters(records, { logic = 'AND', conditions = [] } = {}) {
  if (!conditions.length) return records;
  return records.filter(record => {
    const results = conditions.map(({ field, operator, value }) => {
      if (!field || value === '') return true;
      const recordVal = String(record[field] ?? '').toLowerCase();
      const filterVal = String(value).toLowerCase();
      switch (operator) {
        case 'equals': return recordVal === filterVal;
        case 'not_equals': return recordVal !== filterVal;
        case 'contains': return recordVal.includes(filterVal);
        case 'starts_with': return recordVal.startsWith(filterVal);
        case 'greater_than': return parseFloat(record[field]) > parseFloat(value);
        case 'less_than': return parseFloat(record[field]) < parseFloat(value);
        default: return true;
      }
    });
    return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  });
}
