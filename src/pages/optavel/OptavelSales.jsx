import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign, Target, Plus, MessageSquare, Phone, Mail, FileText, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const STAGES = [
  { id: 'lead', title: 'New Lead' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'demo', title: 'Demo Scheduled' },
  { id: 'negotiating', title: 'Negotiating' },
  { id: 'closed_won', title: 'Closed Won' }
];

export default function OptavelSales() {
  const { user } = useAuth();
  const companyId = user?.profile?.company_id || user?.company_id;
  const queryClient = useQueryClient();

  const [newDealName, setNewDealName] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [newActivityNote, setNewActivityNote] = useState('');
  const [newActivityType, setNewActivityType] = useState('call');

  const { data: deals = [] } = useQuery({
    queryKey: ['optavel_deal_rooms', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_deal_rooms WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['optavel_deal_activities', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await powerSync.execute(
        `SELECT * FROM optavel_deal_activities WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return res.rows._array;
    },
    enabled: !!companyId
  });

  const createDeal = useMutation({
    mutationFn: async () => {
      if (!newDealName || !newDealValue) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_deal_rooms (id, company_id, lead_name, value, stage, probability) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, companyId, newDealName, parseFloat(newDealValue), 'lead', 10]
      );
    },
    onError: (e) => { console.error('Mutation Error:', e); alert('Error: ' + e.message); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
      setNewDealName('');
      setNewDealValue('');
    }
  });

  const updateDealStage = useMutation({
    mutationFn: async ({ id, stage }) => {
      await powerSync.execute(`UPDATE optavel_deal_rooms SET stage = ? WHERE id = ?`, [stage, id]);
    },
    onError: (e) => { console.error('Mutation Error:', e); alert('Error: ' + e.message); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
    }
  });

  const addActivity = useMutation({
    mutationFn: async () => {
      if (!selectedDealId || !newActivityNote) return;
      const id = uuidv4();
      await powerSync.execute(
        `INSERT INTO optavel_deal_activities (id, company_id, deal_id, activity_type, notes) VALUES (?, ?, ?, ?, ?)`,
        [id, companyId, selectedDealId, newActivityType, newActivityNote]
      );
    },
    onError: (e) => { console.error('Mutation Error:', e); alert('Error: ' + e.message); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
      setNewActivityNote('');
    }
  });

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    updateDealStage.mutate({ id: draggableId, stage: destination.droppableId });
  };

  const totalPipeline = deals.filter(d => d.stage !== 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0);
  const activeDeals = deals.filter(d => d.stage !== 'closed_won').length;
  
  const selectedDeal = deals.find(d => d.id === selectedDealId);
  const dealActivities = activities.filter(a => a.deal_id === selectedDealId);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4 text-emerald-500" />;
      case 'email': return <Mail className="w-4 h-4 text-amber-500" />;
      case 'meeting': return <Users className="w-4 h-4 text-blue-500" />;
      default: return <MessageSquare className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-8 font-sans flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-500" />
          Sales & Pipeline
        </h1>
        <p className="text-slate-400 mt-1">Live Deal Rooms, Kanban CRM, and Activity Feed.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-slate-400">Total Pipeline</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">${totalPipeline.toLocaleString()}</h3>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-slate-400">Active Deals</span>
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{activeDeals}</h3>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-slate-400">Add New Deal</span>
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex gap-2 mt-2">
            <input 
              type="text" placeholder="Lead name..." 
              className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-emerald-500 w-full"
              value={newDealName} onChange={e => setNewDealName(e.target.value)}
            />
            <input 
              type="number" placeholder="Value..." 
              className="bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-emerald-500 w-24"
              value={newDealValue} onChange={e => setNewDealValue(e.target.value)}
            />
            <button onClick={() => createDeal.mutate()} className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-[600px] overflow-hidden">
        {/* Kanban Board */}
        <div className={`flex flex-col flex-1 transition-all ${selectedDealId ? 'hidden lg:flex lg:w-2/3' : 'w-full'}`}>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col h-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Kanban Pipeline</h2>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-4 h-full overflow-x-auto pb-2 custom-scrollbar">
                {STAGES.map(stage => {
                  const stageDeals = deals.filter(d => d.stage === stage.id);
                  return (
                    <div key={stage.id} className="w-72 flex flex-col flex-shrink-0 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="p-3 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{stage.title}</h3>
                        <span className="text-slate-500 text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{stageDeals.length}</span>
                      </div>
                      <Droppable droppableId={stage.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-2 overflow-y-auto custom-scrollbar transition-colors ${
                              snapshot.isDraggingOver ? 'bg-slate-200/50 dark:bg-slate-800/50' : ''
                            }`}
                          >
                            {stageDeals.map((deal, index) => (
                              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedDealId(deal.id)}
                                    className={`mb-2 bg-white dark:bg-slate-950 p-3 rounded-xl border ${
                                      selectedDealId === deal.id ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md' :
                                      snapshot.isDragging ? 'border-emerald-400 shadow-lg scale-[1.02]' : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-sm'
                                    } transition-all cursor-pointer`}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{deal.lead_name}</h4>
                                      <ChevronRight className={`w-4 h-4 text-slate-400 ${selectedDealId === deal.id ? 'text-emerald-500' : ''}`} />
                                    </div>
                                    <p className="text-emerald-500 dark:text-emerald-400 font-mono text-sm font-semibold">${(deal.value || 0).toLocaleString()}</p>
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
          </div>
        </div>

        {/* Deal Room Sidebar */}
        {selectedDealId && selectedDeal && (
          <div className="w-full lg:w-1/3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col h-full animate-in slide-in-from-right-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedDeal.lead_name}</h2>
                <p className="text-emerald-500 font-mono text-lg font-semibold mt-1">${(selectedDeal.value || 0).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedDealId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 p-4 mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Add Activity</h3>
              <div className="space-y-3">
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={newActivityType} onChange={e => setNewActivityType(e.target.value)}
                >
                  <option value="call">Phone Call</option>
                  <option value="email">Email Sent</option>
                  <option value="meeting">Meeting Held</option>
                  <option value="note">Internal Note</option>
                </select>
                <textarea 
                  placeholder="Notes..." 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[80px]"
                  value={newActivityNote} onChange={e => setNewActivityNote(e.target.value)}
                />
                <button 
                  onClick={() => addActivity.mutate()} 
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-lg text-white font-medium shadow-sm shadow-emerald-500/20"
                >
                  Save Activity
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">Activity Feed</h3>
              <div className="space-y-4">
                {dealActivities.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No activities logged yet.</p>
                ) : (
                  dealActivities.map(act => (
                    <div key={act.id} className="flex gap-3">
                      <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                        {getActivityIcon(act.activity_type)}
                      </div>
                      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl flex-1 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{act.activity_type}</span>
                          <span className="text-xs text-slate-400">{new Date(act.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{act.notes}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
