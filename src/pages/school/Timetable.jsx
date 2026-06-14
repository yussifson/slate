import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Plus, MapPin, Search } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Timetable() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [selectedClass, setSelectedClass] = useState('Grade 9A');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ subject: 'Mathematics', teacher: '', room: '', day: 'Monday', period: '1', startTime: '08:00', endTime: '09:00' });

  const { data: dbRecords = [], isLoading } = useIndustryRecords('timetable_slot');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const classSlots = dbRecords.filter(r => r.data?.className === selectedClass).map(r => ({ id: r.id, ...r.data }));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const [destDay, destPeriod] = destination.droppableId.split('-');
    
    mutateRecord.mutate({
      id: draggableId,
      recordType: 'timetable_slot',
      payload: { ...classSlots.find(s => s.id === draggableId), day: destDay, period: parseInt(destPeriod) },
      status: 'active',
      searchText: `${selectedClass} ${destDay}`
    });
  };

  const handleAddSlot = () => {
    mutateRecord.mutate({
      recordType: 'timetable_slot',
      payload: { ...formData, className: selectedClass, period: parseInt(formData.period) },
      status: 'active',
      searchText: `${selectedClass} ${formData.day}`
    }, {
      onSuccess: () => { toast.success('Slot added!'); setShowModal(false); }
    });
  };

  return (
    <div className="space-y-6 font-dmsans max-w-7xl mx-auto">
      <div className="bg-green-600 p-6 flex justify-between items-center border-4 border-green-900">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">Master Timetable</h1>
        </div>
        <div className="flex gap-4">
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            className="bg-white border-4 border-green-900 px-4 py-2 font-bold text-green-900 focus:outline-none uppercase"
          >
            {['Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B'].map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="bg-white text-green-900 border-4 border-green-900 px-4 py-2 font-black uppercase flex items-center gap-2 hover:bg-green-100 transition-colors">
            <Plus className="w-5 h-5"/> New Slot
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="border-4 border-green-900 bg-white overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-6 border-b-4 border-green-900">
              <div className="bg-green-100 p-4 flex items-center justify-center border-r-4 border-green-900"><Calendar className="w-6 h-6 text-green-800"/></div>
              {DAYS.map(day => (
                <div key={day} className="bg-green-100 p-4 text-center font-black text-green-900 uppercase tracking-widest border-r-4 border-green-900 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {PERIODS.map(period => (
              <div key={period} className="grid grid-cols-6 border-b-4 border-green-900 last:border-b-0 min-h-[120px]">
                <div className="bg-green-50 p-4 flex flex-col items-center justify-center border-r-4 border-green-900">
                  <span className="font-black text-2xl text-green-800">P{period}</span>
                </div>
                {DAYS.map(day => {
                  const slotId = `${day}-${period}`;
                  const slot = classSlots.find(s => s.day === day && s.period === period);
                  return (
                    <Droppable key={slotId} droppableId={slotId}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className={`p-2 border-r-4 border-green-900 last:border-r-0 ${snapshot.isDraggingOver ? 'bg-green-200' : 'bg-white'}`}
                        >
                          {slot && (
                            <Draggable draggableId={slot.id} index={0}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`h-full border-4 border-green-800 p-3 flex flex-col justify-between ${snapshot.isDragging ? 'bg-green-300' : 'bg-green-50'}`}
                                >
                                  <div>
                                    <p className="font-black text-green-900 uppercase leading-tight">{slot.subject}</p>
                                    <p className="text-xs font-bold text-green-700 mt-1">{slot.teacher}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] font-black bg-green-800 text-white px-2 py-1 uppercase">{slot.room}</span>
                                    <button onClick={() => deleteRecord.mutate({ id: slot.id, recordType: 'timetable_slot'})} className="text-red-500 hover:text-red-700">
                                      <Plus className="w-4 h-4 rotate-45" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {showModal && (
        <div className="fixed inset-0 bg-green-900/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-green-900 p-8 max-w-md w-full">
            <h2 className="text-2xl font-black text-green-900 uppercase mb-6">Schedule Class</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-green-800">Subject</label>
                <input value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} className="w-full border-4 border-green-900 p-2 font-bold text-green-900 focus:outline-none bg-green-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-green-800">Day</label>
                  <select value={formData.day} onChange={e=>setFormData({...formData, day: e.target.value})} className="w-full border-4 border-green-900 p-2 font-bold text-green-900 focus:outline-none bg-green-50">
                    {DAYS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-green-800">Period</label>
                  <select value={formData.period} onChange={e=>setFormData({...formData, period: e.target.value})} className="w-full border-4 border-green-900 p-2 font-bold text-green-900 focus:outline-none bg-green-50">
                    {PERIODS.map(p=><option key={p} value={p}>P{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-green-800">Teacher</label>
                  <input value={formData.teacher} onChange={e=>setFormData({...formData, teacher: e.target.value})} className="w-full border-4 border-green-900 p-2 font-bold text-green-900 focus:outline-none bg-green-50" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-green-800">Room</label>
                  <input value={formData.room} onChange={e=>setFormData({...formData, room: e.target.value})} className="w-full border-4 border-green-900 p-2 font-bold text-green-900 focus:outline-none bg-green-50" />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-4 border-green-900 bg-white font-black uppercase py-3 hover:bg-green-50">Cancel</button>
              <button onClick={handleAddSlot} className="flex-1 border-4 border-green-900 bg-green-500 text-white font-black uppercase py-3 hover:bg-green-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
