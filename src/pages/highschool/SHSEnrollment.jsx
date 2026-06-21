import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, UserCheck, ArrowRight, BookOpen, Building, GraduationCap, CheckCircle} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSEnrollment() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [admittedApplicants, setAdmittedApplicants] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [selectedApplicant, setSelectedApplicant] = useState(null);
 const [enrollmentData, setEnrollmentData] = useState({
 indexNumber: '',
 house: '',
 classRoom: '',
 enrollmentDate: new Date().toISOString().split('T')[0]
});
 
 const [isEnrolling, setIsEnrolling] = useState(false);
 const [successMsg, setSuccessMsg] = useState('');

 const fetchApplicants = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_applicant', user?.company_id);
 setAdmittedApplicants(records.filter(a => a.status === 'Admitted'));
} catch (error) {
 console.error('Failed to fetch admitted applicants:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchApplicants();
}
}, [user]);

 const handleEnrollment = async () => {
 if (!selectedApplicant) return;
 setIsEnrolling(true);
 try {
 // 1. Create a new SHS Student entity
 const studentPayload = {
 company_id: user?.company_id,
 case_type: 'shs_student',
 title: selectedApplicant.title,
 case_number: enrollmentData.indexNumber || `IDX-${Math.floor(Math.random() * 100000)}`,
 status: 'Active',
 data: {
 ...selectedApplicant.data,
 indexNumber: enrollmentData.indexNumber,
 house: enrollmentData.house,
 classRoom: enrollmentData.classRoom,
 enrollmentDate: enrollmentData.enrollmentDate,
 grade: 'Form 1',
 program: selectedApplicant.data?.programChoice1 // Assuming they got their 1st choice
}
};
 await base44.createEntity(studentPayload);
 
 // 2. Update Applicant status to Enrolled
 await base44.updateEntity(selectedApplicant.id, { status: 'Enrolled'});
 
 setSuccessMsg(`Successfully enrolled ${selectedApplicant.title}!`);
 setTimeout(() => setSuccessMsg(''), 4000);
 
 setSelectedApplicant(null);
 setEnrollmentData({ indexNumber: '', house: '', classRoom: '', enrollmentDate: new Date().toISOString().split('T')[0]});
 await fetchApplicants();
} catch (error) {
 console.error('Enrollment failed:', error);
} finally {
 setIsEnrolling(false);
}
};

 const filteredApplicants = admittedApplicants.filter(a => 
 a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 a.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 flex flex-col h-[calc(100vh-100px)]">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Student Enrollment
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Finalize admissions by enrolling accepted applicants into the school system.
 </p>
 </div>
 </div>

 <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
 {/* Left Panel: Admitted List */}
 <Card className="w-full md:w-[400px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/5">
 <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
 Ready to Enroll <Badge className="bg-slate-100 text-primary/90">{admittedApplicants.length}</Badge>
 </h3>
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary dark:text-primary" />
 <Input 
 placeholder="Search admitted students..." 
 className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading admitted students...</div>
 ) : filteredApplicants.length === 0 ? (
 <div className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">No students currently awaiting enrollment.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredApplicants.map(app => (
 <button
 key={app.id}
 onClick={() => setSelectedApplicant(app)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedApplicant?.id === app.id 
 ? 'bg-primary dark:bg-primary text-white -emerald-500/20' 
 : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 ${
 selectedApplicant?.id === app.id ? 'bg-white dark:bg-slate-900/40 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70'
}`}>
 <UserCheck className="w-5 h-5" />
 </div>
 <div className="overflow-hidden flex-1">
 <p className="font-semibold truncate">{app.title}</p>
 <p className={`text-xs truncate ${selectedApplicant?.id === app.id ? 'text-primary/20 dark:text-primary/80' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>
 {app.case_number}
 </p>
 </div>
 <ArrowRight className={`w-4 h-4 ${selectedApplicant?.id === app.id ? 'text-white' : 'text-slate-300'}`} />
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 {/* Right Panel: Enrollment Form */}
 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {successMsg && (
 <div className="absolute inset-x-0 top-0 bg-primary text-white p-3 text-center text-sm font-semibold animate-in slide-in-from-top flex justify-center items-center gap-2 z-50">
 <CheckCircle className="w-4 h-4" /> {successMsg}
 </div>
 )}
 
 {selectedApplicant ? (
 <>
 <div className="p-8 bg-gradient-to-r from-primary/5 to-white border-b border-primary/40 dark:border-primary/40">
 <div className="flex items-start justify-between">
 <div>
 <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{selectedApplicant.title}</h2>
 <div className="flex items-center gap-3 mt-2">
 <Badge variant="outline" className="border-primary/20 dark:border-primary/40 text-primary dark:text-primary/70 bg-white dark:bg-slate-900/40 dark:bg-slate-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{selectedApplicant.case_number}</Badge>
 <span className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">Admitted to: {selectedApplicant.data?.programChoice1}</span>
 </div>
 </div>
 <Badge className="bg-slate-100 text-primary/90 px-3 py-1 gap-2 text-sm border-none ">
 <CheckCircle className="w-4 h-4" /> Cleared for Enrollment
 </Badge>
 </div>
 </div>
 
 <ScrollArea className="flex-1 p-8">
 <div className="max-w-xl mx-auto space-y-8">
 
 <div className="space-y-6 school-page-enter font-dmsans">
 <h3 className="font-semibold text-slate-800 dark:text-slate-100 border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 pb-2">Assign Student Details</h3>
 
 <div className="space-y-2">
 <label className="text-xs font-semibold text-primary dark:text-primary/70 uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <BookOpen className="w-4 h-4" /> Official Index Number
 </label>
 <Input 
 placeholder="e.g. 0010123456"
 className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-xl h-12 text-lg font-medium"
 value={enrollmentData.indexNumber}
 onChange={(e) => setEnrollmentData({...enrollmentData, indexNumber: e.target.value})}
 />
 <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">Leave blank to auto-generate a temporary ID.</p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <Building className="w-4 h-4" /> Boarding House
 </label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={enrollmentData.house}
 onChange={(e) => setEnrollmentData({...enrollmentData, house: e.target.value})}
 >
 <option value="">Assign House...</option>
 <option value="Aggrey House">Aggrey House</option>
 <option value="Gyamfi House">Gyamfi House</option>
 <option value="Livingstone House">Livingstone House</option>
 <option value="Slessor House">Slessor House</option>
 </select>
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <BookOpen className="w-4 h-4" /> Form / Class
 </label>
 <Input 
 placeholder="e.g. 1 Sci A"
 className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-xl h-11"
 value={enrollmentData.classRoom}
 onChange={(e) => setEnrollmentData({...enrollmentData, classRoom: e.target.value})}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Date of Enrollment</label>
 <Input 
 type="date"
 className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-xl h-11"
 value={enrollmentData.enrollmentDate}
 onChange={(e) => setEnrollmentData({...enrollmentData, enrollmentDate: e.target.value})}
 />
 </div>
 </div>

 <div className="pt-8 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end">
 <Button 
 onClick={handleEnrollment}
 disabled={isEnrolling || !enrollmentData.house}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white px-8 h-12 font-semibold w-full sm:w-auto"
 >
 {isEnrolling ? 'Processing...' : (
 <><GraduationCap className="w-5 h-5 mr-2" /> Complete Enrollment</>
 )}
 </Button>
 </div>
 
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
 <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
 <GraduationCap className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">No Applicant Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select an admitted applicant from the left panel to assign their house, class, and officially enroll them into the system.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
