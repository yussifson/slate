import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Home, Users, BedDouble, Save, CheckCircle2} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function SHSRoomAllocation() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [houses, setHouses] = useState([]);
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 
 const [selectedHouseId, setSelectedHouseId] = useState('');
 const [searchQuery, setSearchQuery] = useState('');
 
 // local state for assignments
 const [allocations, setAllocations] = useState({}); // studentId -> roomNumber
 const [isSaving, setIsSaving] = useState(false);
 const [saveSuccess, setSaveSuccess] = useState(false);

 useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 try {
 const [houseData, studentData] = await Promise.all([
 base44.getEntities('shs_house', user?.company_id),
 base44.getEntities('shs_student', user?.company_id)
 ]);
 
 setHouses(houseData);
 // Only get active boarding students
 setStudents(studentData.filter(s => s.status === 'Active' && s.data?.isBoarder));
 
 // Initialize state
 const initialAllocations = {};
 studentData.forEach(s => {
 if (s.data?.roomNumber) {
 initialAllocations[s.id] = s.data.roomNumber;
} else {
 initialAllocations[s.id] = '';
}
});
 setAllocations(initialAllocations);
 
 if (houseData.length > 0) setSelectedHouseId(houseData[0].id);
} catch (error) {
 console.error('Failed to fetch data:', error);
} finally {
 setLoading(false);
}
};

 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const handleRoomChange = (studentId, roomStr) => {
 setAllocations(prev => ({
 ...prev,
 [studentId]: roomStr
}));
 setSaveSuccess(false);
};

 const handleSaveAllocations = async () => {
 setIsSaving(true);
 try {
 const selectedHouse = houses.find(h => h.id === selectedHouseId);
 
 const promises = filteredStudents.map(student => {
 const newRoom = allocations[student.id];
 // Only update if changed
 if (newRoom !== (student.data?.roomNumber || '')) {
 return base44.updateEntity(student.id, {
 data: {
 ...student.data,
 houseId: selectedHouseId,
 houseName: selectedHouse?.title,
 roomNumber: newRoom
}
});
}
 return null;
}).filter(p => p !== null);
 
 await Promise.all(promises);
 
 setSaveSuccess(true);
 setTimeout(() => setSaveSuccess(false), 3000);
} catch (error) {
 console.error('Failed to save allocations:', error);
} finally {
 setIsSaving(false);
}
};

 const selectedHouse = houses.find(h => h.id === selectedHouseId);
 
 // Filter students: they must either already belong to this house, OR not be assigned to any house yet.
 const eligibleStudents = students.filter(s => 
 !s.data?.houseId || s.data?.houseId === selectedHouseId
 );
 
 const filteredStudents = eligibleStudents.filter(s => 
 s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 s.data?.indexNumber?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Room Allocation
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Assign boarding students to specific rooms within their allocated house.
 </p>
 </div>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
 <div className="flex flex-col md:flex-row gap-6 items-end">
 <div className="space-y-2 flex-1">
 <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <Home className="w-4 h-4 text-primary dark:text-primary/70" /> Select Boarding House
 </label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={selectedHouseId}
 onChange={(e) => setSelectedHouseId(e.target.value)}
 >
 {houses.map(h => (
 <option key={h.id} value={h.id}>{h.title} ({h.data?.gender || 'Mixed'})</option>
 ))}
 </select>
 </div>
 
 <div className="space-y-2 flex-1">
 <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 tracking-[0.04em]">
 <Search className="w-4 h-4 text-primary dark:text-primary/70" /> Search Students
 </label>
 <Input 
 placeholder="Name or Index No..."
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 
 <div className="flex-1 hidden lg:block">
 {/* Spacer */}
 </div>
 </div>
 </CardHeader>
 
 <CardContent className="p-0">
 {loading ? (
 <div className="p-16 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading residents...</div>
 ) : !selectedHouseId ? (
 <div className="p-20 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <BedDouble className="w-8 h-8 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">Select a house</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
 Choose a boarding house to assign rooms to its residents.
 </p>
 </div>
 ) : filteredStudents.length === 0 ? (
 <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 No unassigned boarders or residents found for this house.
 </div>
 ) : (
 <div>
 <div className="overflow-x-auto max-h-[600px]">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl w-12 text-center">#</th>
 <th className="px-6 py-4">Student Details</th>
 <th className="px-6 py-4 text-center">Class / Form</th>
 <th className="px-6 py-4 text-center">Current House</th>
 <th className="px-6 py-4 text-center w-48 rounded-tr-xl">Room Assignment</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredStudents.map((student, index) => (
 <tr key={student.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold">
 {index + 1}
 </td>
 <td className="px-6 py-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-slate-100 flex items-center justify-center font-semibold text-primary dark:text-primary/70 shrink-0">
 {student.title.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-slate-800 dark:text-slate-100">{student.title}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">{student.data?.indexNumber || student.case_number}</p>
 </div>
 </td>
 <td className="px-6 py-4 text-center font-semibold text-slate-600 dark:text-slate-300">
 {student.data?.classRoom || 'N/A'}
 </td>
 <td className="px-6 py-4 text-center">
 <Badge variant="outline" className={student.data?.houseId === selectedHouseId ? "bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20" : "bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400"}>
 {student.data?.houseName || 'Unassigned'}
 </Badge>
 </td>
 <td className="px-6 py-4 text-center">
 <Input 
 placeholder="e.g. Room 12B"
 className="h-10 text-center font-semibold bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={allocations[student.id] || ''}
 onChange={(e) => handleRoomChange(student.id, e.target.value)}
 />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex items-center justify-between">
 <div>
 {saveSuccess && (
 <Badge className="bg-slate-100 text-primary/90 border-none px-3 py-1 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
 <CheckCircle2 className="w-4 h-4" /> Allocations Saved
 </Badge>
 )}
 </div>
 
 <Button 
 onClick={handleSaveAllocations}
 disabled={isSaving}
 className="h-12 px-8 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20 font-semibold"
 >
 {isSaving ? 'Saving...' : (
 <><Save className="w-5 h-5 mr-2" /> Save Room Allocations</>
 )}
 </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
