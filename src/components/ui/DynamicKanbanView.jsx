import { supabase } from '@/api/supabaseClient';
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal, Plus } from 'lucide-react';
import { powerSync } from "@/api/PowerSyncConnector";
import { useToast } from '@/components/ui/use-toast';

// A simple Kanban board for any module that has a "status" field
export default function DynamicKanbanView({ data, records, moduleDef, fieldDefinitions, onRecordUpdated }) {
  const { toast } = useToast();
  const [columns, setColumns] = useState({});
  const items = data || records || [];

  useEffect(() => {
    // Find if there is a 'status' or 'stage' field
    const statusField = fieldDefinitions.find(f => f.name === 'status' || f.name === 'stage');
    
    // Default columns if no explicit options found
    let colKeys = ['Todo', 'In Progress', 'Done'];
    
    if (statusField && statusField.options && statusField.options.length > 0) {
      colKeys = statusField.options;
    }

    // Group records by status
    const newCols = {};
    colKeys.forEach(k => newCols[k] = []);
    newCols['Uncategorized'] = [];

    items.forEach(r => {
      const statusVal = r.data?.status || r.data?.stage;
      if (statusVal && newCols[statusVal]) {
        newCols[statusVal].push(r);
      } else if (statusVal && !newCols[statusVal]) {
        // If it has a status that wasn't in our predefined keys, create a column for it
        newCols[statusVal] = [r];
      } else {
        newCols['Uncategorized'].push(r);
      }
    });

    // Remove empty uncategorized if unnecessary
    if (newCols['Uncategorized'].length === 0 && colKeys.length > 0) {
      delete newCols['Uncategorized'];
    }

    setColumns(newCols);
  }, [data, records, fieldDefinitions]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = [...columns[source.droppableId]];
      const destCol = [...columns[destination.droppableId]];
      const [removed] = sourceCol.splice(source.index, 1);
      destCol.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [source.droppableId]: sourceCol,
        [destination.droppableId]: destCol
      });

      // Update record in Supabase
      const statusFieldName = fieldDefinitions.find(f => f.name === 'status' || f.name === 'stage')?.name || 'status';
      const updatedData = { ...removed.data, [statusFieldName]: destination.droppableId };
      
      try {
        const { error } = await supabase
          .from('dynamic_records')
          .update({ data: updatedData })
          .eq('id', removed.id);
          
        if (error) throw error;
        
        if (onRecordUpdated) onRecordUpdated();
      } catch (err) {
        console.error(err);
        toast({ title: "Update Failed", description: "Could not move record.", variant: "destructive" });
        // Optional: revert state
      }
    } else {
      const col = [...columns[source.droppableId]];
      const [removed] = col.splice(source.index, 1);
      col.splice(destination.index, 0, removed);
      setColumns({ ...columns, [source.droppableId]: col });
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-[650px] items-start pt-2 px-1">
      <DragDropContext onDragEnd={onDragEnd}>
        {Object.entries(columns).map(([colId, colRecords]) => (
          <div key={colId} className="w-[300px] flex-shrink-0 bg-muted/80 rounded-xl flex flex-col max-h-full shadow-sm border border-border/60">
            <div className="p-3 border-b border-border/80 flex items-center justify-between bg-muted rounded-t-xl">
              <h3 className="font-semibold text-foreground text-sm">{colId}</h3>
              <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                {colRecords.length}
              </span>
            </div>
            
            <Droppable droppableId={colId}>
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                  style={{ minHeight: '150px' }}
                >
                  {colRecords.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-card p-3 rounded-lg shadow-sm border border-border group transition-all
                            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 rotate-2' : 'hover:border-primary/30'}
                          `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-slate-800 text-sm line-clamp-2">
                              {item.data?.name || item.data?.title || Object.values(item.data)[0] || 'Untitled'}
                            </h4>
                            <button className="text-muted-foreground hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {fieldDefinitions.slice(1, 4).map(f => {
                              const val = item.data[f.name];
                              if (!val || f.name === 'status' || f.name === 'stage') return null;
                              return (
                                <span key={f.name} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded truncate max-w-full">
                                  {String(val)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <div className="p-2 border-t border-border/80 bg-muted/50/50 rounded-b-xl">
               <button className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors py-1.5 rounded-lg hover:bg-muted">
                 <Plus className="w-3.5 h-3.5" /> Add card
               </button>
            </div>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
}
