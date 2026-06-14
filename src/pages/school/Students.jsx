import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Users, Search, Plus, GraduationCap, Phone, Mail, Filter, CheckCircle, XCircle, Clock, UserCheck, AlertCircle, MapPin, HeartPulse, FileText } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { registerSchoolUser } from "@/api/authUtils";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { motion, AnimatePresence } from 'framer-motion';

const feeColors = { Paid: 'bg-green-100 text-green-800 border-green-200', Owing: 'bg-red-100 text-red-800 border-red-200', Partial: 'bg-amber-100 text-amber-800 border-amber-200' };
const statusColors = { Active: 'bg-green-100 text-green-800 border-green-200', Suspended: 'bg-red-100 text-red-800 border-red-200', Graduated: 'bg-blue-100 text-blue-800 border-blue-200' };

export default function Students() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileTab, setProfileTab] = useState('academics');

  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery({ 
    queryKey: ["clients", companyId, "student"], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }), 
    enabled: !!companyId 
  });

  const students = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.name,
      studentId: r.id_number,
      phone: r.phone || extra.phone || '',
      email: extra.email || '',
      status: r.status || 'Active',
      class: extra.class || 'Unknown',
      age: extra.age || 0,
      gender: extra.gender || 'Unknown',
      parent: extra.parent || '',
      parentPhone: extra.parentPhone || r.phone || '',
      parentEmail: extra.parentEmail || '',
      address: extra.address || '',
      medicalNotes: extra.medicalNotes || 'No known allergies or medical conditions.',
      previousSchool: extra.previousSchool || '',
      emergencyContactName: extra.emergencyContactName || '',
      emergencyContactPhone: extra.emergencyContactPhone || '',
      feeStatus: extra.feeStatus || 'Owing',
      avatar: extra.avatar || r.name?.substring(0,2).toUpperCase()
    };
  });

  const classes = ['All', 'Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];

  const filtered = students.filter(s =>
    (statusFilter === 'All' || s.status === statusFilter) &&
    (filterClass === 'All' || s.class === filterClass) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.includes(search))
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 font-dmsans">
      {/* Left Pane: Directory */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-1/3 flex flex-col bg-green-50 border-2 border-green-200 rounded-none overflow-hidden"
      >
        <div className="p-5 border-b-2 border-green-200 bg-green-500 text-white">
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" /> Student Directory
          </h2>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-700" />
              <input 
                placeholder="Search students..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 bg-white text-green-900 placeholder:text-green-700 border-2 border-transparent focus:border-green-300 focus:outline-none rounded-none text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="flex-1 bg-white border-2 border-transparent focus:border-green-300 rounded-none px-2 py-1.5 text-xs text-green-900 font-semibold focus:outline-none"
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 bg-white border-2 border-transparent focus:border-green-300 rounded-none px-2 py-1.5 text-xs text-green-900 font-semibold focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-10 text-green-600 font-medium animate-pulse">Loading directory...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-green-600/50">No students found.</div>
          ) : (
            filtered.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full text-left p-3 border-2 transition-colors flex items-center gap-3 ${
                  selectedStudent?.id === student.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-green-100 hover:border-green-300 bg-white'
                }`}
              >
                <div className="w-10 h-10 bg-green-200 text-green-800 font-bold flex items-center justify-center shrink-0">
                  {student.avatar}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-green-900 truncate">{student.name}</p>
                  <p className="text-xs text-green-600 truncate font-mono">{student.studentId} • {student.class}</p>
                </div>
                <div className={`w-3 h-3 shrink-0 rounded-full border-2 border-white ${student.status === 'Active' ? 'bg-green-500' : student.status === 'Graduated' ? 'bg-blue-500' : 'bg-red-500'}`} />
              </button>
            ))
          )}
        </div>
      </motion.div>

      {/* Right Pane: Student Profile */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col bg-white border-2 border-green-200 overflow-hidden"
      >
        {selectedStudent ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b-2 border-green-200 bg-green-50/50 flex items-start gap-6">
              <div className="w-24 h-24 bg-green-200 text-green-800 text-3xl font-bold flex items-center justify-center border-4 border-white">
                {selectedStudent.avatar}
              </div>
              <div className="flex-1 pt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-extrabold text-green-900 tracking-tight">{selectedStudent.name}</h1>
                    <p className="text-green-700 font-mono mt-1">{selectedStudent.studentId}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 border-2 text-xs font-bold uppercase tracking-wider ${statusColors[selectedStudent.status] || statusColors.Active}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mt-4 text-sm font-semibold text-green-800">
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-green-500" /> {selectedStudent.class}</span>
                  <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-green-500" /> {selectedStudent.gender}, {selectedStudent.age} yrs</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b-2 border-green-200 bg-white px-6 gap-6">
              {[
                { id: 'academics', label: 'Academics', icon: FileText },
                { id: 'medical', label: 'Medical & Health', icon: HeartPulse },
                { id: 'contact', label: 'Contact Details', icon: MapPin },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProfileTab(tab.id)}
                  className={`py-4 px-2 font-bold text-sm flex items-center gap-2 border-b-4 transition-colors ${
                    profileTab === tab.id 
                      ? 'border-green-500 text-green-900' 
                      : 'border-transparent text-green-600 hover:text-green-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
              <AnimatePresence mode="wait">
                {profileTab === 'academics' && (
                  <motion.div key="academics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border-2 border-green-100 bg-green-50">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Current Class</p>
                        <p className="text-lg font-bold text-green-900">{selectedStudent.class}</p>
                      </div>
                      <div className="p-4 border-2 border-green-100 bg-green-50">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Fee Status</p>
                        <span className={`inline-block px-2 py-1 text-xs font-bold uppercase border-2 ${feeColors[selectedStudent.feeStatus] || feeColors.Owing}`}>
                          {selectedStudent.feeStatus}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border-2 border-green-200">
                      <h3 className="font-bold text-green-900 mb-3 uppercase tracking-wide text-sm border-b-2 border-green-100 pb-2">Academic History</h3>
                      <p className="text-sm font-medium text-green-800"><span className="text-green-600">Previous School:</span> {selectedStudent.previousSchool || 'None recorded'}</p>
                    </div>
                  </motion.div>
                )}

                {profileTab === 'medical' && (
                  <motion.div key="medical" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="p-5 border-2 border-red-200 bg-red-50">
                      <h3 className="font-bold text-red-900 flex items-center gap-2 mb-3">
                        <HeartPulse className="w-5 h-5 text-red-500" /> Medical Notes & Allergies
                      </h3>
                      <p className="text-sm font-medium text-red-800 whitespace-pre-wrap">
                        {selectedStudent.medicalNotes || 'No specific medical notes provided.'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {profileTab === 'contact' && (
                  <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 border-2 border-green-200">
                        <h3 className="font-bold text-green-900 mb-4 uppercase tracking-wide text-sm flex items-center gap-2 border-b-2 border-green-100 pb-2">
                          <Users className="w-4 h-4 text-green-500" /> Guardian Info
                        </h3>
                        <div className="space-y-3 text-sm font-medium text-green-800">
                          <p><span className="text-green-600 block text-xs uppercase mb-0.5">Name</span> {selectedStudent.parent || '—'}</p>
                          <p><span className="text-green-600 block text-xs uppercase mb-0.5">Phone</span> {selectedStudent.parentPhone || '—'}</p>
                          <p><span className="text-green-600 block text-xs uppercase mb-0.5">Email</span> {selectedStudent.parentEmail || '—'}</p>
                        </div>
                      </div>

                      <div className="p-4 border-2 border-amber-200 bg-amber-50">
                        <h3 className="font-bold text-amber-900 mb-4 uppercase tracking-wide text-sm flex items-center gap-2 border-b-2 border-amber-200/50 pb-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" /> Emergency Contact
                        </h3>
                        <div className="space-y-3 text-sm font-medium text-amber-900">
                          <p><span className="text-amber-700/70 block text-xs uppercase mb-0.5">Name</span> {selectedStudent.emergencyContactName || '—'}</p>
                          <p><span className="text-amber-700/70 block text-xs uppercase mb-0.5">Phone</span> {selectedStudent.emergencyContactPhone || '—'}</p>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 p-4 border-2 border-green-200">
                        <h3 className="font-bold text-green-900 mb-3 uppercase tracking-wide text-sm flex items-center gap-2 border-b-2 border-green-100 pb-2">
                          <MapPin className="w-4 h-4 text-green-500" /> Home Address
                        </h3>
                        <p className="text-sm font-medium text-green-800">
                          {selectedStudent.address || 'No address on file.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-green-300 p-8 text-center">
            <Users className="w-20 h-20 mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">No Student Selected</h3>
            <p className="text-green-600 font-medium">Select a student from the directory to view their rich profile.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
