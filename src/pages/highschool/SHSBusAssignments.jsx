import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, Map, Users, BusFront} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSBusAssignments() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [assignments, setAssignments] = useState([]);
 const [students, setStudents] = useState([]);
 const [routes, setRoutes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [newAssignment, setNewAssignment] = useState({
 studentId: '',
 routeId: '',
 pickupPoint: '',
 term: 'Term 1',
 academicYear: new Date().getFullYear().toString()
});

 const fetchData = async () => {
 setLoading(true);
 try {
 const [assignData, studentData, routeData] = await Promise.all([
 base44.getEntities('shs_bus_assignment', user?.company_id),
 base44.getEntities('shs_student', user?.company_id),
 base44.getEntities('shs_transport_route', user?.company_id)
 ]);
 setAssignments(assignData);
 setStudents(studentData.filter(s => s.status === 'Active' && s.data?.boardingStatus !== 'Boarding'));
 setRoutes(routeData.filter(r => r.status === 'Active'));
} catch (error) {
 console.error('Failed to fetch bus assignments:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchData();
}
}, [user]);

 const handleSaveAssignment = async () => {
 try {
 const selectedStudent = students.find(s => s.id === newAssignment.studentId);
 const selectedRoute = routes.find(r => r.id === newAssignment.routeId);

 if (!selectedStudent || !selectedRoute) return;

 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_bus_assignment',
 title: `${selectedStudent.title} - ${selectedRoute.title}`,
 case_number: `B-ASN-${Math.floor(Math.random() * 100000)}`,
 status: 'Active',
 data: {
 ...newAssignment,
 studentName: selectedStudent.title,
 studentIndex: selectedStudent.data?.indexNumber || selectedStudent.case_number,
 routeName: selectedRoute.title,
 feeAmount: selectedRoute.data?.feeAmount
}
};
 
 await base44.createEntity(payload);

 // Generate invoice for transport fee
 if (parseFloat(selectedRoute.data?.feeAmount || 0) > 0) {
 await base44.createEntity({
 company_id: user?.company_id,
 case_type: 'shs_invoice',
 title: `Transport Fee - ${newAssignment.term}`,
 case_number: `INV-TR-${Math.floor(Math.random() * 100000)}`,
 status: 'Unpaid',
 data: {
 studentId: selectedStudent.id,
 studentName: selectedStudent.title,
 amount: parseFloat(selectedRoute.data?.feeAmount),
 term: newAssignment.term,
 academicYear: newAssignment.academicYear,
 category: 'Transport'
}
});
}

 setIsModalOpen(false);
 setNewAssignment({ studentId: '', routeId: '', pickupPoint: '', term: 'Term 1', academicYear: new Date().getFullYear().toString()});
 fetchData();
} catch (error) {
 console.error('Failed to save assignment:', error);
}
};

 const updateStatus = async (id, currentStatus) => {
 const newStatus = currentStatus === 'Active' ? 'Cancelled' : 'Active';
 try {
 await base44.updateEntity(id, { status: newStatus});
 fetchData();
} catch (error) {
 console.error('Failed to update status:', error);
}
};

 const filteredAssignments = assignments.filter(a => 
 a.data?.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 a.data?.routeName?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const selectedRouteObj = routes.find(r => r.id === newAssignment.routeId);
 const pickupPointsOptions = selectedRouteObj?.data?.pickupPointsList || [];

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Transport Roster
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Assign day students to bus routes and manage termly subscriptions.
 </p>
 </div>
 
 <Button onClick={() => setIsModalOpen(true)} className="h-9 gap-2 rounded-md-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> New Assignment
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-md-2xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-md-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <Users className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Active Subscriptions</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{assignments.filter(a => a.status === 'Active').length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-md-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Student Roster</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search student or route..." 
 className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-md-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading assignments...</div>
 ) : filteredAssignments.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-md-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Map className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">No students assigned to buses</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Create assignments to generate transport fee invoices.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 rounded-md-tl-xl">Student</th>
 <th className="px-6 py-4">Route Name</th>
 <th className="px-6 py-4">Pickup Point</th>
 <th className="px-6 py-4">Term / Year</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right rounded-md-tr-xl">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredAssignments.map((asn) => (
 <tr key={asn.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-slate-800 dark:text-slate-100">{asn.data?.studentName}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">{asn.data?.studentIndex}</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2.5 font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">
 <BusFront className="w-4 h-4 text-primary dark:text-primary/70" /> {asn.data?.routeName}
 </div>
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
 {asn.data?.pickupPoint || 'N/A'}
 </td>
 <td className="px-6 py-4 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
 {asn.data?.term} - {asn.data?.academicYear}
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className={
 asn.status === 'Active' ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' : 'bg-rose-50 text-rose-700 border-rose-200'
}>
 {asn.status}
 </Badge>
 </td>
 <td className="px-6 py-4 text-right">
 <Button 
 size="sm" 
 variant="outline" 
 onClick={() => updateStatus(asn.id, asn.status)}
 className={`h-8 text-xs font-semibold ${asn.status === 'Active' ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-primary border-primary/20 hover:bg-slate-50'}`}
 >
 {asn.status === 'Active' ? 'Cancel' : 'Activate'}
 </Button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
 <DialogContent className="sm:max-w-[450px] rounded-md-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Assign Student</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Subscribe a Day Student to a bus route.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Select Student (Day Students Only)</label>
 <select 
 className="w-full h-11 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newAssignment.studentId}
 onChange={e => setNewAssignment({...newAssignment, studentId: e.target.value})}
 >
 <option value="">Search and select student...</option>
 {students.map(s => (
 <option key={s.id} value={s.id}>
 {s.title} ({s.data?.indexNumber || s.case_number})
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Select Route</label>
 <select 
 className="w-full h-11 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newAssignment.routeId}
 onChange={e => {
 setNewAssignment({...newAssignment, routeId: e.target.value, pickupPoint: ''});
}}
 >
 <option value="">Search and select route...</option>
 {routes.map(r => (
 <option key={r.id} value={r.id}>
 {r.title} - ${r.data?.feeAmount || 0}/term
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Specific Pickup Point</label>
 <select 
 className="w-full h-11 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newAssignment.pickupPoint}
 onChange={e => setNewAssignment({...newAssignment, pickupPoint: e.target.value})}
 disabled={!newAssignment.routeId || pickupPointsOptions.length === 0}
 >
 <option value="">Select pickup point...</option>
 {pickupPointsOptions.map((p, idx) => (
 <option key={idx} value={p}>{p}</option>
 ))}
 </select>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Term</label>
 <select 
 className="w-full h-11 rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newAssignment.term}
 onChange={e => setNewAssignment({...newAssignment, term: e.target.value})}
 >
 <option value="Term 1">Term 1</option>
 <option value="Term 2">Term 2</option>
 <option value="Term 3">Term 3</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Academic Year</label>
 <Input 
 className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-primary/40 dark:border-primary/40 rounded-md-xl h-11 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newAssignment.academicYear}
 onChange={e => setNewAssignment({...newAssignment, academicYear: e.target.value})}
 />
 </div>
 </div>

 <div className="p-4 rounded-md-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 text-primary/70 dark:text-primary/10 text-xs tracking-[0.04em]">
 <p>A transport fee invoice will be automatically generated and linked to this student upon saving.</p>
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-md-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleSaveAssignment} 
 disabled={!newAssignment.studentId || !newAssignment.routeId}
 className="rounded-md-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Confirm Subscription
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
