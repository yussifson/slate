import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Shield, Plus, Trash2, Edit2, Wand2, Check } from 'lucide-react';
import { powerSync } from '@/api/PowerSyncConnector';
import { toast } from 'react-hot-toast';
import { useCompanyId, useCompany } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { INDUSTRIES } from '@/config/industries';
import { generateText } from '@/lib/cloudflareAI';



export default function RoleManagementSettings() {
  const companyId = useCompanyId();
  const { company } = useCompany();
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', description: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  const activeIndustry = sessionStorage.getItem('slate_industry_override') || company?.industry_type || user?.company_industry || 'law';
  const AVAILABLE_FEATURES = (INDUSTRIES[activeIndustry]?.nav || []).map(n => ({
    id: n.path,
    label: n.label,
    category: 'Industry Feature'
  }));


  
  useEffect(() => {
    if (companyId && roles.length === 0) {
      const activeInd = sessionStorage.getItem('slate_industry_override') || company?.industry_type || user?.company_industry || 'law';
      import('@/config/industries').then(({ INDUSTRIES }) => {
        const defaultRoles = INDUSTRIES[activeInd]?.roles || [];
        if (defaultRoles.length > 0) {
          // Check again just to be safe
          powerSync.execute('SELECT count(*) as c FROM platform_roles WHERE company_id = ?', [companyId]).then(res => {
            if (res.rows.item(0).c === 0) {
              const promises = defaultRoles.map(r => 
                powerSync.execute('INSERT INTO platform_roles (id, company_id, name, description) VALUES (uuid(), ?, ?, ?)', [companyId, r.label, 'Predefined industry role'])
              );
              Promise.all(promises).then(() => fetchRoles());
            }
          });
        }
      });
    }
  }, [companyId, roles.length]);

  useEffect(() => {
    if (companyId) {
      fetchRoles();
      fetchPermissions();
    }
  }, [companyId]);

  const fetchRoles = async () => {
    try {
      const res = await powerSync.execute('SELECT * FROM platform_roles WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
      setRoles(res.rows._array || Array.from(res.rows));
    } catch (e) { console.error(e); }
  };

  const fetchPermissions = async () => {
    try {
      const res = await powerSync.execute('SELECT * FROM platform_role_permissions WHERE company_id = ?', [companyId]);
      setPermissions(res.rows._array || Array.from(res.rows));
    } catch (e) { console.error(e); }
  };

  const saveRole = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await powerSync.execute('UPDATE platform_roles SET name=?, description=? WHERE id=?', [formData.name, formData.description, formData.id]);
        toast.success('Role updated');
      } else {
        await powerSync.execute('INSERT INTO platform_roles (id, company_id, name, description) VALUES (uuid(), ?, ?, ?)', [companyId, formData.name, formData.description]);
        toast.success('Role created');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) { toast.error('Failed to save role'); }
  };

  const deleteRole = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await powerSync.execute('DELETE FROM platform_roles WHERE id=?', [id]);
      toast.success('Role deleted');
      if (activeRole?.id === id) setActiveRole(null);
      fetchRoles();
    } catch (err) { toast.error('Failed to delete role'); }
  };

  const generateAIAssignedRoles = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('AI analyzing industry to generate roles...');
    try {
      const industry = sessionStorage.getItem('slate_industry_override') || user?.company_industry || 'hr';
      const prompt = `Based on the industry "${industry}", generate 3 common role names and their descriptions. Return ONLY a valid JSON array of objects with keys "name" and "description". Do not use markdown blocks.`;
      
      let aiResponse = await generateText(prompt);
      if (typeof aiResponse !== 'string') {
        aiResponse = aiResponse.response || aiResponse.result?.response || aiResponse.text || JSON.stringify(aiResponse);
      }
      
      const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedRoles = JSON.parse(jsonStr);

      for (let r of generatedRoles) {
        await powerSync.execute('INSERT INTO platform_roles (id, company_id, name, description) VALUES (uuid(), ?, ?, ?)', [companyId, r.name, r.description]);
      }
      toast.success('AI successfully generated roles!', { id: toastId });
      fetchRoles();
    } catch (err) {
      toast.error('AI generation failed. ' + err.message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // Features available vs assigned
  const activePermissions = permissions.filter(p => p.role_id === activeRole?.id);
  const assignedFeaturePaths = activePermissions.map(p => p.feature_path);
  
  const assignedFeatures = AVAILABLE_FEATURES.filter(f => assignedFeaturePaths.includes(f.id));
  const unassignedFeatures = AVAILABLE_FEATURES.filter(f => !assignedFeaturePaths.includes(f.id));

  const onDragEnd = async (result) => {
    if (!result.destination || !activeRole) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    if (destination.droppableId === 'assigned') {
      // Optimistic Update
      const newPerm = { id: crypto.randomUUID(), company_id: companyId, role_id: activeRole.id, feature_path: draggableId, can_view: 1, can_edit: 1 };
      setPermissions(prev => [...prev, newPerm]);
      // DB operation
      await powerSync.execute('INSERT INTO platform_role_permissions (id, company_id, role_id, feature_path, can_view, can_edit) VALUES (?, ?, ?, ?, 1, 1)', 
        [newPerm.id, companyId, activeRole.id, draggableId]);
    } else {
      // Optimistic Update
      setPermissions(prev => prev.filter(p => !(p.role_id === activeRole.id && p.feature_path === draggableId)));
      // DB operation
      await powerSync.execute('DELETE FROM platform_role_permissions WHERE role_id=? AND feature_path=?', 
        [activeRole.id, draggableId]);
    }
  };

  return (
    <div className="space-y-6 school-page-enter font-dmsans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Role Management & RBAC</h2>
          <p className="text-sm text-muted-foreground mt-1">Create custom roles and drag-and-drop feature access.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAIAssignedRoles} disabled={isGenerating} className="h-10 px-4 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-purple-100 transition-colors">
            <Wand2 className="w-4 h-4"/> AI Auto-Generate
          </button>
          <button onClick={() => { setFormData({id:'', name:'', description:''}); setIsModalOpen(true); }} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4"/> Add Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Roles List */}
        <div className="col-span-4 bg-card border-[0.5px] border-primary/20 rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-primary/20 bg-muted/30">
            <h3 className="font-semibold text-sm">Roles</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {roles.map(r => (
              <div key={r.id} onClick={() => setActiveRole(r)} className={`p-3 rounded-lg cursor-pointer transition-colors border-[0.5px] group flex justify-between items-center ${activeRole?.id === r.id ? 'bg-primary/5 border-primary text-primary' : 'border-transparent hover:bg-muted/50'}`}>
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); setFormData(r); setIsModalOpen(true); }} className="p-1 text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteRole(r.id); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drag and Drop Permissions */}
        <div className="col-span-8 bg-card border-[0.5px] border-primary/20 rounded-xl flex flex-col h-[500px]">
          {activeRole ? (
            <div className="flex flex-col h-full p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{activeRole.name} Permissions</h3>
                <p className="text-sm text-muted-foreground">Drag features from available to assigned to grant access.</p>
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                  {/* Unassigned */}
                  <Droppable droppableId="unassigned">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="bg-muted/30 rounded-xl p-3 flex flex-col overflow-y-auto border-[0.5px] border-dashed border-primary/20">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center">Available Features</h4>
                        {unassignedFeatures.map((f, index) => (
                          <Draggable key={f.id} draggableId={f.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-card p-3 rounded-lg border-[0.5px] border-black/10 dark:border-white/10 mb-2 shadow-sm flex items-center justify-between group">
                                <span className="text-sm font-medium">{f.label}</span>
                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{f.category}</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  {/* Assigned */}
                  <Droppable droppableId="assigned">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="bg-primary/5 rounded-xl p-3 flex flex-col overflow-y-auto border-[0.5px] border-dashed border-primary/40">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 text-center">Assigned to Role</h4>
                        {assignedFeatures.map((f, index) => (
                          <Draggable key={f.id} draggableId={f.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-card p-3 rounded-lg border-[0.5px] border-primary/40 mb-2 shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium">{f.label}</span>
                                </div>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{f.category}</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </DragDropContext>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col">
              <Shield className="w-12 h-12 mb-3 opacity-20" />
              <p>Select a role to manage its permissions.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border-[0.5px] border-primary/20 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">{formData.id ? 'Edit' : 'Create'} Role</h2>
            <form onSubmit={saveRole} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Role Name</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full h-10 px-3 bg-background border-[0.5px] border-primary/40 rounded-xl text-sm" placeholder="e.g. Manager" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
                <textarea rows={3} value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} className="w-full p-3 bg-background border-[0.5px] border-primary/40 rounded-xl text-sm resize-none" placeholder="Brief description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 bg-secondary rounded-xl text-sm font-semibold">Cancel</button>
                <button type="submit" className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
