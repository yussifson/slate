import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, ArrowRightLeft, Building, FileText, CheckCircle2} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSStudentTransfers() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [selectedStudent, setSelectedStudent] = useState(null);
 const [transferType, setTransferType] = useState('External'); // 'External' or 'Internal'
 const [transferData, setTransferData] = useState({
 destination: '',
 reason: '',
 date: new Date().toISOString().split('T')[0],
 newProgram: '',
 newHouse: ''
});
 
 const [isProcessing, setIsProcessing] = useState(false);
 const [successMsg, setSuccessMsg] = useState('');

 const fetchStudents = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_student', user?.company_id);
 setStudents(records.filter(s => s.status === 'Active')); // Only active students can be transferred
} catch (error) {
 console.error('Failed to fetch students:', error);
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

 const handleTransfer = async () => {
 if (!selectedStudent) return;
 setIsProcessing(true);
 try {
 if (transferType === 'External') {
 // Transfer out of school
 const updatedData = { 
 ...selectedStudent.data, 
 transferDetails: {
 destination: transferData.destination,
 reason: transferData.reason,
 date: transferData.date,
 type: 'External'
}
};
 await base44.updateEntity(selectedStudent.id, { 
 status: 'Transferred', 
 data: updatedData 
});
} else {
 // Internal transfer (change program or house)
 const updatedData = { 
 ...selectedStudent.data,
 program: transferData.newProgram || selectedStudent.data.program,
 house: transferData.newHouse || selectedStudent.data.house,
 transferDetails: {
 previousProgram: selectedStudent.data.program,
 previousHouse: selectedStudent.data.house,
 reason: transferData.reason,
 date: transferData.date,
 type: 'Internal'
}
};
 await base44.updateEntity(selectedStudent.id, { data: updatedData});
}
 
 setSuccessMsg('Transfer processed successfully!');
 setTimeout(() => setSuccessMsg(''), 3000);
 setSelectedStudent(null);
 setTransferData({ destination: '', reason: '', date: new Date().toISOString().split('T')[0], newProgram: '', newHouse: ''});
 await fetchStudents();
} catch (error) {
 console.error('Transfer failed:', error);
} finally {
 setIsProcessing(false);
}
};

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 flex flex-col h-[calc(100vh-100px)]">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Student Transfers
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Process internal programme changes or external school withdrawals.
 </p>
 </div>
 </div>

 <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
 {/* Left Panel: Student Selection */}
 <Card className="w-full md:w-[400px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="p-4 border-b border-primary/5">
 <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Select Student</h3>
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary dark:text-primary" />
 <Input 
 placeholder="Search active students..." 
 className="pl-9 h-10 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-primary/30 text-sm">Loading directory...</div>
 ) : filteredStudents.length === 0 ? (
 <div className="p-8 text-center text-slate-400 dark:text-slate-500 dark:text-muted-foreground text-sm">No active students match search.</div>
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
 <div className="overflow-hidden flex-1">
 <p className="font-semibold truncate">{student.title}</p>
 <p className={`text-xs truncate ${selectedStudent?.id === student.id ? 'text-primary/20 dark:text-primary/80' : 'text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground'}`}>
 {student.case_number} • {student.data?.program}
 </p>
 </div>
 <ArrowRightLeft className={`w-4 h-4 ${selectedStudent?.id === student.id ? 'text-white' : 'text-slate-300'}`} />
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 {/* Right Panel: Transfer Form */}
 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-primary/50 overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {successMsg && (
 <div className="absolute inset-x-0 top-0 bg-primary text-white p-3 text-center text-sm font-semibold animate-in slide-in-from-top flex justify-center items-center gap-2 z-50">
 <CheckCircle2 className="w-4 h-4" /> {successMsg}
 </div>
 )}
 
 {selectedStudent ? (
 <>
 <div className="p-6 bg-slate-500 dark:bg-secondary/50 border-b border-primary/40 dark:border-primary/40">
 <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Transfer Request for {selectedStudent.title}</h2>
 <div className="flex items-center gap-2 mt-2">
 <Badge variant="outline" className="border-primary/20 dark:border-primary/40 text-primary dark:text-primary/70 bg-white dark:bg-card/40 dark:bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{selectedStudent.case_number}</Badge>
 <span className="text-xs font-medium text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground tracking-[0.04em]">Current: {selectedStudent.data?.program} ({selectedStudent.data?.grade})</span>
 </div>
 </div>
 
 <ScrollArea className="flex-1 p-6">
 <div className="max-w-2xl mx-auto space-y-8">
 
 {/* Transfer Type Selector */}
 <div className="grid grid-cols-2 gap-4">
 <button
 onClick={() => setTransferType('External')}
 className={`p-4 rounded-2xl border-2 text-left transition-all ${
 transferType === 'External' 
 ? 'border-primary dark:border-primary bg-slate-50 dark:bg-secondary/50 dark:bg-secondary text-primary dark:text-primary/70' 
 : 'border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card hover:border-primary/20 dark:border-primary/40 text-slate-600 dark:text-foreground'
}`}
 >
 <Building className="w-6 h-6 mb-2" />
 <h4 className="font-semibold">External Transfer</h4>
 <p className="text-xs opacity-80 mt-1 tracking-[0.04em]">Transfer out to another school. Marks student as 'Transferred'.</p>
 </button>
 
 <button
 onClick={() => setTransferType('Internal')}
 className={`p-4 rounded-2xl border-2 text-left transition-all ${
 transferType === 'Internal' 
 ? 'border-primary dark:border-primary bg-slate-50 dark:bg-secondary/50 dark:bg-secondary text-primary dark:text-primary/70' 
 : 'border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card hover:border-primary/20 dark:border-primary/40 text-slate-600 dark:text-foreground'
}`}
 >
 <ArrowRightLeft className="w-6 h-6 mb-2" />
 <h4 className="font-semibold">Internal Transfer</h4>
 <p className="text-xs opacity-80 mt-1 tracking-[0.04em]">Change programme or house within the same school.</p>
 </button>
 </div>

 <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-card/40 dark:bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 dark:border-primary/40  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
 <FileText className="w-4 h-4 text-primary dark:text-primary/70" /> Transfer Details
 </h3>
 
 {transferType === 'External' ? (
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Destination School</label>
 <Input 
 placeholder="e.g. Achimota School"
 className="bg-slate-50 dark:bg-secondary/50 dark:bg-secondary border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-xl h-11"
 value={transferData.destination}
 onChange={(e) => setTransferData({...transferData, destination: e.target.value})}
 />
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">New Programme</label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-secondary/50 dark:bg-secondary px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
 value={transferData.newProgram}
 onChange={(e) => setTransferData({...transferData, newProgram: e.target.value})}
 >
 <option value="">Keep Current ({selectedStudent.data?.program || 'None'})</option>
 <option value="General Science">General Science</option>
 <option value="General Arts">General Arts</option>
 <option value="Business">Business</option>
 <option value="Visual Arts">Visual Arts</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">New House</label>
 <Input 
 placeholder="e.g. Gyamfi House"
 className="bg-slate-50 dark:bg-secondary/50 dark:bg-secondary border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-xl h-11"
 value={transferData.newHouse}
 onChange={(e) => setTransferData({...transferData, newHouse: e.target.value})}
 />
 </div>
 </div>
 )}
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Effective Date</label>
 <Input 
 type="date"
 className="bg-slate-50 dark:bg-secondary/50 dark:bg-secondary border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-xl h-11"
 value={transferData.date}
 onChange={(e) => setTransferData({...transferData, date: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-foreground uppercase tracking-wider tracking-[0.04em]">Reason for Transfer</label>
 <Input 
 placeholder="e.g. Relocation, Academic preference"
 className="bg-slate-50 dark:bg-secondary/50 dark:bg-secondary border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary rounded-xl h-11"
 value={transferData.reason}
 onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
 />
 </div>
 </div>
 </div>
 
 <div className="flex justify-end pt-4">
 <Button 
 onClick={handleTransfer}
 disabled={isProcessing}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white px-8 h-12 font-semibold "
 >
 {isProcessing ? 'Processing...' : 'Authorize Transfer'}
 </Button>
 </div>
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-secondary/50 dark:bg-secondary/50 dark:bg-secondary/50">
 <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-secondary flex items-center justify-center mb-6">
 <ArrowRightLeft className="w-10 h-10 text-primary/30" />
 </div>
 <h3 className="text-xl font-semibold text-slate-700 dark:text-foreground dark:text-foreground">No Student Selected</h3>
 <p className="text-slate-500 dark:text-muted-foreground dark:text-muted-foreground dark:text-slate-500 dark:text-muted-foreground max-w-sm mt-2">
 Select an active student from the left panel to initiate an internal programme change or external school transfer.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
