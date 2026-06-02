import React from 'react';
import MetricCardBlock from './blocks/MetricCardBlock';
import DataTableBlock from './blocks/DataTableBlock';
import FormBlock from './blocks/FormBlock';
import KanbanBlock from './blocks/KanbanBlock';
import ChartBlock from './blocks/ChartBlock';
import { cn } from '@/lib/utils';

const COMPONENT_MAP = {
  MetricCard: MetricCardBlock,
  DataTable: DataTableBlock,
  FormBlock: FormBlock,
  KanbanBlock: KanbanBlock,
  ChartBlock: ChartBlock
};

export default function PageRenderer({ schema, onBlockClick, selectedBlockId }) {
  if (!schema) return null;

  const { layout = [] } = schema;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {layout.map((block) => {
        const BlockComponent = COMPONENT_MAP[block.component];
        if (!BlockComponent) {
          return (
            <div key={block.id} className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 md:col-span-12">
              Unknown component: {block.component}
            </div>
          );
        }

        const isSelected = selectedBlockId === block.id;
        const colSpan = block.styleConfig?.colSpan || 12;

        return (
          <div 
            key={block.id} 
            className={cn(
              `md:col-span-${colSpan}`,
              "relative group transition-all rounded-xl",
              isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:ring-2 hover:ring-primary/30 hover:ring-offset-1"
            )}
            onClick={() => onBlockClick && onBlockClick(block.id)}
          >
            {/* Editor Overlay handle */}
            {onBlockClick && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer z-10 shadow-sm transition-opacity">
                Edit Block
              </div>
            )}
            
            <BlockComponent dataConfig={block.dataConfig || {}} styleConfig={block.styleConfig || {}} />
          </div>
        );
      })}
    </div>
  );
}
