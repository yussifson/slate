import React, { useState, useEffect } from 'react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function GenericKanban({ 
  data, 
  statusKey, 
  titleKey, 
  onStatusChange, 
  boardKey,
  defaultStages = []
}) {
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  
  const [stages, setStages] = useState([]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageName, setStageName] = useState('');

  // Fallback if no boardKey: just extract unique statuses from data or use defaultStages
  useEffect(() => {
    if (!boardKey) {
      if (defaultStages.length > 0) {
        setStages(defaultStages);
      } else if (data && data.length > 0) {
        setStages([...new Set(data.map(d => d[statusKey]).filter(Boolean))]);
      }
      return;
    }
    
    // Load custom stages
    const loadStages = async () => {
      try {
        const result = await powerSync.execute(
          'SELECT stages FROM univ_kanban_boards WHERE company_id = ? AND board_key = ?',
          [companyId, boardKey]
        );
        if (result.rows.length > 0 && result.rows.item(0).stages) {
          try {
            setStages(JSON.parse(result.rows.item(0).stages));
          } catch(e) {
            setStages(defaultStages);
          }
        } else {
          setStages(defaultStages);
        }
      } catch (e) {
        console.error('Failed to load stages', e);
        setStages(defaultStages);
      }
    };
    
    loadStages();
  }, [companyId, boardKey, data, defaultStages]);

  const saveStages = async (newStages) => {
    setStages(newStages);
    if (!boardKey) return;
    
    try {
      // Upsert
      const result = await powerSync.execute(
        'SELECT id FROM univ_kanban_boards WHERE company_id = ? AND board_key = ?',
        [companyId, boardKey]
      );
      
      const stagesJson = JSON.stringify(newStages);
      
      if (result.rows.length > 0) {
        await powerSync.execute(
          'UPDATE univ_kanban_boards SET stages = ? WHERE id = ?',
          [stagesJson, result.rows.item(0).id]
        );
      } else {
        await powerSync.execute(
          'INSERT INTO univ_kanban_boards (id, company_id, board_key, stages) VALUES (uuid_generate_v4(), ?, ?, ?)',
          [companyId, boardKey, stagesJson]
        );
      }
      toast.success('Stages saved');
    } catch (e) {
      console.error('Save stages error:', e);
      toast.error('Failed to save stages');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return; // Reordering in same column not supported yet
    
    // Call the parent update function
    if (onStatusChange) {
      onStatusChange(draggableId, destination.droppableId);
    }
  };

  const handleSaveStage = () => {
    if (!stageName.trim()) return;
    
    if (editingStage !== null) {
      // Edit
      const newStages = [...stages];
      newStages[editingStage] = stageName.trim();
      saveStages(newStages);
    } else {
      // Add
      if (stages.includes(stageName.trim())) {
        toast.error('Stage already exists');
        return;
      }
      saveStages([...stages, stageName.trim()]);
    }
    
    setShowStageModal(false);
    setStageName('');
    setEditingStage(null);
  };

  const handleDeleteStage = (index) => {
    if (confirm('Are you sure you want to delete this stage? Cards in this stage will be hidden until their status changes.')) {
      const newStages = stages.filter((_, i) => i !== index);
      saveStages(newStages);
    }
  };

  const openAddStage = () => {
    setStageName('');
    setEditingStage(null);
    setShowStageModal(true);
  };

  const openEditStage = (index, currentName) => {
    setStageName(currentName);
    setEditingStage(index);
    setShowStageModal(true);
  };

  if (!data && !stages.length) return <div className="p-8 text-center text-[#71717a] dark:text-gray-400">No data for Kanban view.</div>;

  return (
    <div className="flex flex-col gap-4">
      {boardKey && (
        <div className="flex justify-end px-6">
          <Button onClick={openAddStage} variant="outline" size="sm" className="rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            <Plus className="w-4 h-4 mr-2" /> Add Stage
          </Button>
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 p-6 overflow-x-auto min-h-[600px] bg-muted/5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 pb-12 custom-scrollbar">
          {stages.map((status, index) => {
            // Function support for dynamic status matching (e.g. 'Low Stock' computed from quantity)
            // But since this is drag and drop, statuses need to be exact strings that match statusKey
            const items = (data || []).filter(d => d[statusKey] === status);
            
            return (
              <div key={status} className="flex-shrink-0 w-[320px] bg-muted/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-3xl flex flex-col h-full max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b border-border/30 bg-muted/20 rounded-t-3xl">
                  <h3 className="font-extrabold text-foreground tracking-tight uppercase text-sm tracking-[0.04em]">{status}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-background text-foreground text-xs font-semibold px-2.5 py-1 rounded-full border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 tracking-[0.04em]">{items.length}</span>
                    {boardKey && (
                      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity absolute right-4 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => openEditStage(index, status)}>
                          <Settings className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600" onClick={() => handleDeleteStage(index)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-emerald-500/5' : ''}`}
                    >
                      {items.map((item, i) => (
                        <Draggable key={item.id} draggableId={item.id} index={i}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{...provided.draggableProps.style, zIndex: snapshot.isDragging ? 999 : 1}}
                              className={`bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-4 rounded-2xl transition-all cursor-grab active:cursor-grabbing hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] ${snapshot.isDragging ? 'shadow-xl border-emerald-500 ring-2 ring-emerald-500/20 rotate-2' : ''}`}
                            >
                              <h4 className="font-semibold text-sm text-foreground mb-3 leading-snug">{item[titleKey] || 'Untitled'}</h4>
                              <div className="flex flex-wrap gap-2.5">
                                {Object.keys(item).filter(k => k !== 'company_id' && k !== 'id' && k !== 'created_at' && k !== statusKey && k !== titleKey).slice(0, 3).map(k => (
                                  <span key={k} className="bg-muted text-[#71717a] dark:text-gray-400 font-medium text-[10px] px-2 py-1 rounded-lg capitalize truncate max-w-[120px]">
                                    {String(item[k] || '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingStage !== null ? 'Edit Stage' : 'Add New Stage'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={stageName} 
              onChange={e => setStageName(e.target.value)} 
              placeholder="Stage Name (e.g., Quality Control)" 
              className="rounded-xl"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveStage()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageModal(false)}>Cancel</Button>
            <Button onClick={handleSaveStage} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Stage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
