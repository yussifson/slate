import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, GraduationCap, HeartPulse, Shield, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('academics');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const rec = await base44.entities.Client.get(id);
      if (!rec || String(rec.company_id) !== String(companyId)) throw new Error("Student not found");
      let extra = {};
      try { extra = JSON.parse(rec.notes || '{}'); } catch(e) {}
      return { ...rec, ...extra };
    },
    enabled: !!id && !!companyId
  });

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-emerald-500 font-bold animate-pulse text-lg tracking-widest uppercase">Loading Profile...</div>
    </div>
  );
  if (!student) return <div className="p-8 text-center text-red-500 font-bold border-2 border-red-500 bg-red-50">Student not found.</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/school/students')} className="gap-2 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-none border-2 border-transparent hover:border-emerald-800 font-bold transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Directory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-emerald-50 border-4 border-emerald-500 p-6 text-center">
            <div className="w-32 h-32 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center text-5xl font-black mb-6 border-4 border-emerald-900">
              {student.avatar || student.name?.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-2xl font-black text-emerald-950 mb-1 leading-tight">{student.name}</h2>
            <p className="text-sm font-bold text-emerald-700 mb-4">{student.id_number}</p>
            <div className="inline-block px-4 py-1.5 bg-emerald-900 text-emerald-50 text-xs font-black uppercase tracking-widest border-2 border-emerald-950">
              {student.status || 'Active'}
            </div>
          </div>

          <div className="bg-white border-4 border-emerald-950 p-0">
            <div className="bg-emerald-950 text-emerald-50 p-3 font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <User className="w-4 h-4"/> Overview
            </div>
            <div className="p-4 space-y-4 text-sm font-medium">
              <div className="flex flex-col">
                <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Class</span>
                <span className="font-black text-emerald-950 text-lg">{student.class}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Gender</span>
                <span className="font-black text-emerald-950 text-lg">{student.gender}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Date of Birth</span>
                <span className="font-black text-emerald-950 text-lg">{student.dateOfBirth || `${student.age} yrs`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="md:col-span-3">
          {/* Custom Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveTab('academics')} className={`px-6 py-3 font-black uppercase tracking-widest text-sm transition-colors border-4 ${activeTab === 'academics' ? 'bg-emerald-500 border-emerald-950 text-emerald-950' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-500'}`}>Academics</button>
            <button onClick={() => setActiveTab('contact')} className={`px-6 py-3 font-black uppercase tracking-widest text-sm transition-colors border-4 ${activeTab === 'contact' ? 'bg-emerald-500 border-emerald-950 text-emerald-950' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-500'}`}>Contact Info</button>
            <button onClick={() => setActiveTab('medical')} className={`px-6 py-3 font-black uppercase tracking-widest text-sm transition-colors border-4 ${activeTab === 'medical' ? 'bg-emerald-500 border-emerald-950 text-emerald-950' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-500'}`}>Medical</button>
          </div>

          <div className="bg-white border-4 border-emerald-950 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'academics' && (
                <motion.div key="academics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                  <h3 className="text-3xl font-black text-emerald-950 mb-8 flex items-center gap-3">
                    <GraduationCap className="w-8 h-8 text-emerald-500" /> Academic Dossier
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 p-6 border-2 border-emerald-200">
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider block mb-1">Previous School</span>
                      <span className="font-black text-emerald-950 text-xl">{student.previousSchool || 'N/A'}</span>
                    </div>
                    <div className="bg-emerald-50 p-6 border-2 border-emerald-200">
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider block mb-1">Transfer Status</span>
                      <span className="font-black text-emerald-950 text-xl">{student.transferStatus || 'No'}</span>
                    </div>
                    <div className="bg-emerald-50 p-6 border-2 border-emerald-200">
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider block mb-1">Alumni Status</span>
                      <span className="font-black text-emerald-950 text-xl">{student.alumniStatus || 'Active'}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'contact' && (
                <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                  <h3 className="text-3xl font-black text-emerald-950 mb-8 flex items-center gap-3">
                    <Mail className="w-8 h-8 text-emerald-500" /> Contact & Guardians
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-4 border-emerald-100 p-6">
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Parent/Guardian</span>
                      <p className="font-black text-emerald-950 text-2xl">{student.parent || 'Not Provided'}</p>
                    </div>
                    <div className="border-4 border-emerald-100 p-6">
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><Phone className="w-4 h-4"/> Phone</span>
                      <p className="font-black text-emerald-950 text-2xl">{student.phone || 'Not Provided'}</p>
                    </div>
                    <div className="border-4 border-emerald-100 p-6">
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><Mail className="w-4 h-4"/> Email</span>
                      <p className="font-black text-emerald-950 text-xl truncate">{student.parentEmail || 'Not Provided'}</p>
                    </div>
                    <div className="border-4 border-red-100 bg-red-50 p-6">
                      <span className="text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2"><Shield className="w-4 h-4"/> Emergency Contact</span>
                      <p className="font-black text-red-950 text-xl">{student.emergencyContactName || 'Not Provided'}</p>
                      {student.emergencyContactPhone && <p className="font-bold text-red-800 mt-1">{student.emergencyContactPhone}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'medical' && (
                <motion.div key="medical" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                  <h3 className="text-3xl font-black text-emerald-950 mb-8 flex items-center gap-3">
                    <HeartPulse className="w-8 h-8 text-emerald-500" /> Health Records
                  </h3>
                  <div className="bg-emerald-50 border-l-8 border-emerald-500 p-6">
                    <p className="text-lg font-medium text-emerald-900 leading-relaxed">
                      {student.medicalNotes || "No medical conditions or allergies reported in the current system records."}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
