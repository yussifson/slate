import React, { useState} from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { User, MapPin, Mail, Award, BookOpen, Clock, Calendar} from 'lucide-react';

export default function LearnerProfile() {
 const { id} = useParams();
 const navigate = useNavigate();
 const companyId = useCompanyId();
 
 const [activeTab, setActiveTab] = useState('courses');

 const { data: learner} = useQuery({
 queryKey: ["case", id],
 queryFn: () => base44.entities.LegalCase.get(id),
 enabled: !!id && !!companyId
});

 const title = learner?.title || 'Unknown Learner';
 let extra = {};
 try { extra = JSON.parse(learner?.notes || '{}');} catch(e) {}

 const navClass = (tab) => `px-6 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`;

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
 {/* Cover Profile Header */}
 <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-[var(--radius-xl)] overflow-hidden">
 <div className="h-32 bg-gradient-to-r from-[var(--color-surface-2)] to-[var(--color-surface-1)]"></div>
 <div className="px-8 pb-8 relative">
 <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 sm:-mt-16 mb-6">
 <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[var(--color-surface-0)] border-4 border-[var(--color-surface-0)] flex items-center justify-center flex-shrink-0">
 <div className="w-full h-full rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--color-success)] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold font-display">
 {title.charAt(0)}
 </div>
 </div>
 <div className="flex-1 pb-2">
 <h1 className="text-3xl font-bold font-display text-[var(--color-text-primary)]">{title}</h1>
 <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--color-text-secondary)]">
 {extra.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[var(--color-text-tertiary)]" /> {extra.location}</span>}
 {extra.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[var(--color-text-tertiary)]" /> {extra.email}</span>}
 <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" /> Joined {new Date(learner?.created_at || Date.now()).toLocaleDateString()}</span>
 </div>
 </div>
 <div className="pb-2">
 <button className="px-4 py-2 bg-[var(--color-surface-1)] border border-primary/40 text-[var(--color-text-primary)] text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors whitespace-nowrap">
 Message Learner
 </button>
 </div>
 </div>

 {extra.bio && (
 <div className="prose prose-sm text-[var(--color-text-secondary)] max-w-3xl">
 <p>{extra.bio}</p>
 </div>
 )}
 </div>
 
 <div className="border-t border-primary/40 bg-[var(--color-surface-1)] flex px-4">
 <button onClick={() => setActiveTab('courses')} className={navClass('courses')}>Enrolled Courses</button>
 <button onClick={() => setActiveTab('certificates')} className={navClass('certificates')}>Certificates</button>
 <button onClick={() => setActiveTab('activity')} className={navClass('activity')}>Recent Activity</button>
 </div>
 </div>

 {activeTab === 'courses' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-[var(--radius-xl)] p-5 hover:border-[var(--primary)] transition-colors cursor-pointer group">
 <div className="w-12 h-12 bg-[var(--color-surface-1)] rounded-[var(--radius-md)] flex items-center justify-center mb-4 text-[var(--primary)]">
 <BookOpen className="w-6 h-6" />
 </div>
 <h3 className="font-bold text-[var(--text-lg)] text-[var(--color-text-primary)] mb-2">React Foundations</h3>
 <div className="w-full bg-[var(--color-border-default)] h-1.5 rounded-full mb-2 overflow-hidden">
 <div className="bg-[var(--primary)] h-full w-[65%]"></div>
 </div>
 <p className="text-xs text-[var(--color-text-secondary)]">65% Complete</p>
 </div>
 </div>
 )}

 {activeTab === 'certificates' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-[var(--radius-xl)] p-5 flex gap-4 items-center">
 <div className="w-16 h-16 bg-[var(--color-success-subtle)] rounded-full flex items-center justify-center text-[var(--color-success)] flex-shrink-0">
 <Award className="w-8 h-8" />
 </div>
 <div>
 <h3 className="font-bold text-[var(--color-text-primary)]">Introduction to HTML/CSS</h3>
 <p className="text-sm text-[var(--color-text-secondary)] mt-1">Issued: Sep 12, 2026</p>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'activity' && (
 <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-[var(--radius-xl)] p-6 ">
 <div className="relative pl-6 border-l-2 border-primary/40 space-y-8">
 <div className="relative">
 <div className="absolute w-3 h-3 bg-[var(--primary)] rounded-full -left-[31px] top-1.5 ring-4 ring-[var(--color-surface-0)]"></div>
 <h4 className="font-semibold text-[var(--color-text-primary)]">Completed Slate 4 Assessment</h4>
 <p className="text-xs text-[var(--color-text-secondary)] mt-1">Today at 10:45 AM</p>
 </div>
 <div className="relative">
 <div className="absolute w-3 h-3 bg-[var(--color-surface-2)] rounded-full -left-[31px] top-1.5 ring-4 ring-[var(--color-surface-0)]"></div>
 <h4 className="font-semibold text-[var(--color-text-primary)]">Enrolled in React Foundations</h4>
 <p className="text-xs text-[var(--color-text-secondary)] mt-1">Yesterday</p>
 </div>
 </div>
 </div>
 )}

 </div>
 );
}
