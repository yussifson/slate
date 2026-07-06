import React, { useState, useEffect } from 'react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Settings, Trash2, Edit, Eye } from 'lucide-react';
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
  defaultStages = [],
  onEdit,
  onDelete,
  onView
}) {
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  
  const [stages, setStages] = useState([]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageName, setStageName] = useState('');
  
  const [localData, setLocalData] = useState(data || []);

  useEffect(() => {
    setLocalData(data || []);
  }, [data]);

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
          'INSERT INTO univ_kanban_boards (id, company_id, board_key, stages) VALUES (?, ?, ?, ?)',
          [crypto.randomUUID(), companyId, boardKey, stagesJson]
        );
      }
      toast.success('Stages saved');
    } catch (e) {
      console.error('Save stages error:', e);
      toast.error('Failed to save stages');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return; // Reordering in same column not supported yet
    
    // Save previous state for rollback
    const previousData = [...localData];
    
    // Optimistic local update
    const newData = localData.map(item => {
      if (item.id === draggableId) {
        return { ...item, [statusKey]: destination.droppableId };
      }
      return item;
    });
    setLocalData(newData);

    // Call the parent update function
    if (onStatusChange) {
      try {
        await onStatusChange(draggableId, destination.droppableId);
      } catch (e) {
        // Revert on failure
        console.error('Kanban status change failed, reverting:', e);
        setLocalData(previousData);
        toast.error('Failed to update status');
      }
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
          <Button onClick={openAddStage} variant="outline" size="sm" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5 dark:hover:bg-primary/30/20">
            <Plus className="w-4 h-4 mr-2" /> Add Stage
          </Button>
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 p-6 overflow-x-auto min-h-[600px] bg-card shadow-sm rounded-3xl border border-border/40 pb-12 custom-scrollbar">
          {stages.map((status, index) => {
            // Function support for dynamic status matching (e.g. 'Low Stock' computed from quantity)
            // But since this is drag and drop, statuses need to be exact strings that match statusKey
            const items = localData.filter(d => d[statusKey] === status);
            
            return (
              <div key={status} className="flex-shrink-0 w-[320px] bg-muted/20 border border-border/60 rounded-3xl flex flex-col h-full max-h-[80vh] overflow-hidden shadow-sm">
                <div className="flex justify-between items-center p-4 border-b border-border/50 bg-muted/40">
                  <h3 className="font-extrabold text-foreground uppercase text-xs tracking-wider">{status}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-background text-foreground text-xs font-bold px-2.5 py-0.5 rounded-full border border-border/60 shadow-sm">{items.length}</span>
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
                      className={`flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                    >
                      {items.map((item, i) => (
                        <Draggable key={item.id} draggableId={item.id} index={i}>
                          {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{...provided.draggableProps.style, zIndex: snapshot.isDragging ? 9999 : 1}}
                                className={`bg-background border border-border/60 shadow-sm p-5 rounded-2xl transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/40 group relative overflow-hidden flex flex-col ${snapshot.isDragging ? 'shadow-xl border-primary ring-2 ring-primary/20 rotate-2' : ''}`}
                              >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  {onView && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" onClick={() => onView(item)}>
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {onEdit && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" onClick={() => onEdit(item)}>
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  {onDelete && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-sm" onClick={() => onDelete(item.id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                                <h4 className="font-bold text-sm text-foreground mb-3 pr-20 leading-snug">{item[titleKey] || 'Untitled'}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {Object.keys(item).filter(k => k !== 'company_id' && k !== 'id' && k !== 'created_at' && k !== statusKey && k !== titleKey).slice(0, 3).map(k => (
                                    <span key={k} className="bg-muted/50 border border-border/40 text-foreground/70 font-semibold text-[10px] px-2.5 py-1 rounded-md capitalize truncate max-w-[120px]">
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
            <Button onClick={handleSaveStage} className="bg-primary hover:bg-primary/90 text-white">Save Stage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
