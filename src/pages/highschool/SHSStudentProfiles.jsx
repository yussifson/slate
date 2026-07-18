import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, UserCircle, Users, MapPin, Phone, Mail, GraduationCap, ShieldAlert, FileText, HeartPulse} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export default function SHSStudentProfiles() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedStudent, setSelectedStudent] = useState(null);

 const fetchStudents = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_student', user?.company_id);
 setStudents(records);
 if (records.length > 0 && !selectedStudent) {
 setSelectedStudent(records[0]);
}
} catch (error) {
 console.error('Failed to fetch student profiles:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchStudents();
}
}, [user]);

 const filteredStudents = students.filter(s => 
 s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 s.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 
 {/* Header Section */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Student Profiles
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 View detailed demographic, academic, and family information for students.
 </p>
 </div>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 {/* Left Panel: Student List */}
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/5">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary dark:text-primary" />
 <Input 
 placeholder="Search students..." 
 className="pl-9 h-10 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading profiles...</div>
 ) : filteredStudents.length === 0 ? (
 <div className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground text-sm">No students found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredStudents.map(student => (
 <button
 key={student.id}
 onClick={() => setSelectedStudent(student)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedStudent?.id === student.id 
 ? 'bg-primary dark:bg-primary text-white -emerald-500/20' 
 : 'hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary text-slate-700 dark:text-foreground dark:text-foreground'
}`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 ${
 selectedStudent?.id === student.id ? 'bg-white dark:bg-card/40 dark:bg-card/20' : 'bg-slate-100 dark:bg-secondary text-primary dark:text-primary/70'
}`}>
 {student.title?.charAt(0)}
 </div>
 <div className="overflow-hidden">
 <p className="font-semibold truncate">{student.title}</p>
 <p className={`text-xs truncate ${selectedStudent?.id === student.id ? 'text-primary/20 dark:text-primary/80' : 'text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground'}`}>
 {student.case_number} • {student.data?.grade}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 {/* Right Panel: Student Details */}
 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {selectedStudent ? (
 <>
 {/* Profile Header Background */}
 <div className="h-32 bg-gradient-to-r from-primary/90 to-primary relative shrink-0">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 </div>
 
 <ScrollArea className="flex-1 -mt-12">
 <div className="px-8 pb-8">
 {/* Profile Avatar & Primary Info */}
 <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
 <div className="w-24 h-24 rounded-3xl bg-white dark:bg-card/40 dark:bg-card p-1 shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary flex items-center justify-center text-primary dark:text-primary/70">
 <UserCircle className="w-12 h-12" />
 </div>
 </div>
 <div className="flex-1 mt-4 sm:mt-12">
 <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{selectedStudent.title}</h2>
 <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-foreground font-medium">
 <span className="flex items-center gap-2.5"><Badge variant="outline" className="border-primary/20 dark:border-primary/40 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary text-primary dark:text-primary/70">{selectedStudent.case_number}</Badge></span>
 <span>•</span>
 <span className="flex items-center gap-2.5"><GraduationCap className="w-4 h-4 text-primary dark:text-primary" /> {selectedStudent.data?.program}</span>
 <span>•</span>
 <span className="flex items-center gap-2.5"><Badge className={selectedStudent.status === 'Active' ? 'bg-primary' : 'bg-amber-500'}>{selectedStudent.status}</Badge></span>
 </div>
 </div>
 </div>

 <div className="mt-8">
 <Tabs defaultValue="overview" className="w-full">
 <TabsList className="bg-slate-500 dark:bg-secondary/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40">
 <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white dark:bg-card/40 dark:bg-card data-[state=active]:text-primary dark:text-primary/70 data-[state=active]: hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Overview</TabsTrigger>
 <TabsTrigger value="family" className="rounded-xl data-[state=active]:bg-white dark:bg-card/40 dark:bg-card data-[state=active]:text-primary dark:text-primary/70 data-[state=active]: hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Family & Contacts</TabsTrigger>
 <TabsTrigger value="medical" className="rounded-xl data-[state=active]:bg-white dark:bg-card/40 dark:bg-card data-[state=active]:text-primary dark:text-primary/70 data-[state=active]: hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Medical Summary</TabsTrigger>
 <TabsTrigger value="documents" className="rounded-xl data-[state=active]:bg-white dark:bg-card/40 dark:bg-card data-[state=active]:text-primary dark:text-primary/70 data-[state=active]: hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Documents</TabsTrigger>
 </TabsList>
 
 <div className="mt-6">
 <TabsContent value="overview" className="space-y-6 outline-none">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-5 rounded-2xl bg-primary/30 dark:bg-secondary/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 space-y-4">
 <h3 className="text-sm font-semibold text-primary dark:text-primary/70 uppercase tracking-wider tracking-[0.04em]">Demographics</h3>
 <div className="grid grid-cols-2 gap-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Gender</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedStudent.data?.gender || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Date of Birth</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedStudent.data?.dob || 'Not Provided'}</p>
 </div>
 <div className="col-span-2">
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Address</p>
 <p className="font-medium text-slate-800 dark:text-slate-100 flex items-start gap-2 mt-1">
 <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 dark:text-muted-foreground shrink-0 mt-0.5" />
 {selectedStudent.data?.address || 'Address not logged in system'}
 </p>
 </div>
 </div>
 </div>
 
 <div className="p-5 rounded-2xl bg-primary/30 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 space-y-4">
 <h3 className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Enrollment Info</h3>
 <div className="grid grid-cols-2 gap-y-4">
 <div>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Current Grade</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedStudent.data?.grade || 'N/A'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Boarding Status</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedStudent.data?.boardingStatus || 'Day Student'}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Enrollment Date</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{new Date(selectedStudent.created_date).toLocaleDateString()}</p>
 </div>
 <div>
 <p className="text-xs text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">House</p>
 <p className="font-medium text-slate-800 dark:text-slate-100">{selectedStudent.data?.house || 'Unassigned'}</p>
 </div>
 </div>
 </div>
 </div>
 </TabsContent>
 
 <TabsContent value="family" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-primary/40 dark:border-primary/40 rounded-2xl bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/20">
 <Users className="w-10 h-10 text-primary/30 mx-auto mb-3" />
 <h4 className="text-slate-700 dark:text-foreground dark:text-foreground font-semibold">No Family Contacts Added</h4>
 <p className="text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground text-sm mt-1 mb-4">You have not added any emergency contacts or guardians for this student.</p>
 <Button variant="outline" className="border-primary/20 dark:border-primary/40 text-primary dark:text-primary/70 hover:bg-slate-50 dark:bg-secondary/50 dark:bg-secondary rounded-xl">Add Contact</Button>
 </div>
 </TabsContent>

 <TabsContent value="medical" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-rose-100 rounded-2xl bg-rose-50/20">
 <HeartPulse className="w-10 h-10 text-rose-300 mx-auto mb-3" />
 <h4 className="text-slate-700 dark:text-foreground dark:text-foreground font-semibold">No Medical Records</h4>
 <p className="text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground text-sm mt-1 mb-4">No allergies, conditions, or medical history logged.</p>
 <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl">Update Medical Info</Button>
 </div>
 </TabsContent>

 <TabsContent value="documents" className="outline-none">
 <div className="p-8 text-center border-2 border-dashed border-primary/40 dark:border-primary/40 rounded-2xl">
 <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
 <h4 className="text-slate-700 dark:text-foreground dark:text-foreground font-semibold">No Documents Uploaded</h4>
 <p className="text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground text-sm mt-1 mb-4">Upload birth certificates, previous report cards, etc.</p>
 <Button variant="outline" className="rounded-xl">Upload Document</Button>
 </div>
 </TabsContent>
 </div>
 </Tabs>
 </div>
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
 <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-secondary/50 dark:bg-secondary flex items-center justify-center mb-6">
 <UserCircle className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-semibold text-slate-700 dark:text-foreground dark:text-foreground">No Student Selected</h3>
 <p className="text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground max-w-sm mt-2">
 Select a student from the list on the left to view their detailed profile, family contacts, and medical summary.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
