import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { ShieldAlert, Plus, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { format } from "date-fns";

export default function Discipline() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ studentName: '', type: 'Infraction', date: '', description: '', actionTaken: '' });

  const { data: records = [], isLoading } = useIndustryRecords('discipline');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const logs = records.map(r => ({ id: r.id, ...r.data })).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = () => {
    mutateRecord.mutate({
      recordType: 'discipline',
      payload: { ...formData, date: formData.date || new Date().toISOString() },
      status: 'active',
      searchText: `${formData.studentName} ${formData.type}`
    }, {
      onSuccess: () => setShowModal(false)
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-dmsans">
      <div className="bg-green-600 p-8 border-4 border-green-900 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <ShieldAlert className="w-10 h-10" /> Discipline Log
          </h1>
          <p className="text-green-100 font-bold mt-2 text-lg">Secure timeline of behavioral records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-white text-green-900 border-4 border-green-900 px-6 py-3 font-black uppercase flex items-center gap-2 hover:bg-green-100 transition-colors">
          <Plus className="w-5 h-5"/> Record Incident
        </button>
      </div>

      <div className="relative border-l-4 border-green-800 ml-8 space-y-12 pb-12">
        {logs.map((log, i) => (
          <div key={log.id} className="relative pl-12">
            <div className={`absolute -left-[26px] top-4 w-12 h-12 border-4 border-green-900 rounded-full flex items-center justify-center ${log.type === 'Merit' ? 'bg-green-400' : 'bg-red-400'}`}>
              {log.type === 'Merit' ? <ShieldCheck className="w-6 h-6 text-green-900" /> : <AlertTriangle className="w-6 h-6 text-red-900" />}
            </div>
            <div className="bg-white border-4 border-green-900 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`px-3 py-1 font-black text-xs uppercase tracking-widest border-2 border-green-900 ${log.type === 'Merit' ? 'bg-green-200' : 'bg-red-200'}`}>
                    {log.type}
                  </span>
                  <h3 className="text-2xl font-black text-green-900 mt-2">{log.studentName}</h3>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700 font-mono">{log.date ? format(new Date(log.date), 'MMM dd, yyyy') : '-'}</p>
                  <button onClick={() => deleteRecord.mutate({ id: log.id, recordType: 'discipline'})} className="text-xs font-black text-red-600 hover:underline mt-2 uppercase">Delete</button>
                </div>
              </div>
              <p className="text-green-800 font-medium mb-4 text-lg leading-relaxed">{log.description}</p>
              <div className="bg-green-50 border-2 border-green-800 p-4">
                <p className="text-xs font-black uppercase text-green-600 mb-1">Action Taken</p>
                <p className="font-bold text-green-900">{log.actionTaken}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-green-900/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-green-900 p-8 max-w-lg w-full">
            <h2 className="text-2xl font-black text-green-900 uppercase mb-6">Log Incident</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-green-800">Student Name</label>
                <input value={formData.studentName} onChange={e=>setFormData({...formData, studentName: e.target.value})} className="w-full border-4 border-green-900 p-3 font-bold text-green-900 focus:outline-none bg-green-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-green-800">Type</label>
                  <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full border-4 border-green-900 p-3 font-bold text-green-900 focus:outline-none bg-green-50">
                    <option>Infraction</option><option>Merit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-green-800">Date</label>
                  <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full border-4 border-green-900 p-3 font-bold text-green-900 focus:outline-none bg-green-50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-green-800">Description</label>
                <textarea rows={3} value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full border-4 border-green-900 p-3 font-bold text-green-900 focus:outline-none bg-green-50 resize-none" />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-green-800">Action Taken</label>
                <input value={formData.actionTaken} onChange={e=>setFormData({...formData, actionTaken: e.target.value})} className="w-full border-4 border-green-900 p-3 font-bold text-green-900 focus:outline-none bg-green-50" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-4 border-green-900 bg-white font-black uppercase py-3 hover:bg-green-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 border-4 border-green-900 bg-green-500 text-white font-black uppercase py-3 hover:bg-green-600">Save Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
