import React from "react";
import { format } from "date-fns";

export default function DynamicGrid({ data, fieldDefinitions, theme }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground bg-card border border-border rounded-xl shadow-sm">
        No records found. Click "Add Record" to create one.
      </div>
    );
  }

  // Get primary title fields (first 2 string fields)
  const titleFields = fieldDefinitions.filter(f => f.field_type === 'text').slice(0, 2);
  const otherFields = fieldDefinitions.filter(f => !titleFields.includes(f)).slice(0, 3); // show up to 3 more

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((record) => (
        <div key={record.id} className={`bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden group`}>
          {theme && theme !== 'primary' && (
            <div className={`absolute top-0 left-0 w-full h-1 bg-${theme}-500`} />
          )}
          {(!theme || theme === 'primary') && (
            <div className={`absolute top-0 left-0 w-full h-1 bg-primary`} />
          )}

          <div className="mb-4">
            {titleFields.map((field, idx) => (
              <div key={field.id} className={idx === 0 ? "font-bold text-lg text-foreground mb-1" : "text-sm text-muted-foreground"}>
                {record.data[field.name] || '-'}
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            {otherFields.map(field => (
              <div key={field.id} className="flex justify-between items-center border-t border-border pt-2">
                <span className="text-muted-foreground text-xs">{field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <span className="font-medium text-foreground truncate max-w-[120px]" title={record.data[field.name]}>
                  {field.field_type === 'boolean' ? (record.data[field.name] ? 'Yes' : 'No') : 
                   field.field_type === 'date' && record.data[field.name] ? format(new Date(record.data[field.name]), 'MMM d, yyyy') :
                   record.data[field.name] || '-'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
            <span>Added {format(new Date(record.created_at || new Date()), 'MMM d')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
