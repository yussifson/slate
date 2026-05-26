import { useState } from 'react';
import { Users, Search, Plus, GraduationCap, Phone, Mail, Filter, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';

const feeColors = { Paid: 'bg-green-100 text-green-700', Owing: 'bg-red-100 text-red-700', Partial: 'bg-amber-100 text-amber-700' };
const statusColors = { Active: 'bg-blue-100 text-blue-700', Suspended: 'bg-red-100 text-red-700', Graduated: 'bg-purple-100 text-purple-700' };

export default function Students() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [showModal, setShowModal] = useState(false);
  
  // Real Database Hooks
  const { data: records = [], isLoading } = useIndustryRecords('student');
  const mutateStudent = useMutateIndustryRecord();
  const deleteStudent = useDeleteIndustryRecord();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'Female', class: 'Grade 7B', parentName: '', parentPhone: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);

  // Map DB records to UI format
  const students = records.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const classes = ['All', 'Grade 7B', 'Grade 8C', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'];
  const filtered = students.filter(s =>
    (filterClass === 'All' || s.class === filterClass) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.includes(search))
  );

  const stats = [
    { label: 'Total Students', value: students.length, color: 'bg-blue-500', icon: Users },
    { label: 'Active', value: students.filter(s => s.status === 'Active').length, color: 'bg-green-500', icon: CheckCircle },
    { label: 'Fees Owing', value: students.filter(s => s.feeStatus !== 'Paid').length, color: 'bg-red-500', icon: XCircle },
    { label: 'Classes', value: 8, color: 'bg-purple-500', icon: GraduationCap },
  ];

  const handleEnroll = () => {
    const fullName = formData.firstName ? `${formData.firstName} ${formData.lastName}`.trim() : formData.name;
    if (!fullName) return toast.error("Please enter student name");
    
    // Auto-generate a random student ID
    const studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const age = formData.dateOfBirth ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() : 0;
    
    const payload = {
      name: fullName,
      studentId,
      class: formData.class,
      age,
      gender: formData.gender,
      parent: formData.parentName,
      phone: formData.parentPhone,
      feeStatus: 'Owing',
      avatar: fullName.substring(0,2).toUpperCase()
    };

    if (editingId) {
      mutateStudent.mutate({
        id: editingId,
        recordType: 'student',
        payload: payload,
        status: formData.status || 'Active',
        searchText: `${fullName} ${studentId}`
      }, {
        onSuccess: () => {
          toast.success("Student updated successfully!");
          setShowModal(false);
          setEditingId(null);
          setFormData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'Female', class: 'Grade 7B', parentName: '', parentPhone: '' });
        }
      });
    } else {
      mutateStudent.mutate({
        recordType: 'student',
        payload: payload,
        status: 'Active',
        searchText: `${fullName} ${studentId}`
      }, {
        onSuccess: () => {
          toast.success("Student enrolled successfully!");
          setShowModal(false);
          setFormData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'Female', class: 'Grade 7B', parentName: '', parentPhone: '' });
        }
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteStudent.mutate({ id, recordType: 'student' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage student enrollment and records</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> Enroll Student
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {classes.map(c => (
              <button key={c} onClick={() => setFilterClass(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterClass === c ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-slate-200'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                {['Student', 'ID', 'Class', 'Age', 'Parent / Guardian', 'Fee Status', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {s.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-card-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.studentId}</td>
                  <td className="px-4 py-3"><Link to={`/classes`} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md hover:underline">{s.class}</Link></td>
                  <td className="px-4 py-3 text-foreground">{s.age} yrs</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-foreground font-medium">{s.parent}</p>
                      <p className="text-xs text-muted-foreground">{s.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feeColors[s.feeStatus]}`}>{s.feeStatus}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[s.status] || 'bg-blue-100 text-blue-700'}`}>{s.status}</span></td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setViewDetails(s)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingId(s.id);
                          setFormData({ 
                            ...s, 
                            firstName: s.name?.split(' ')[0] || '', 
                            lastName: s.name?.split(' ').slice(1).join(' ') || '',
                            parentName: s.parent,
                            parentPhone: s.phone
                          });
                          setShowModal(true);
                        }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleDelete(s.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No students found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Student' : 'Enroll New Student'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">First Name</label><Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="mt-1" placeholder="Ama" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Last Name</label><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="mt-1" placeholder="Owusu" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Date of Birth</label><Input value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="mt-1" type="date" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Female</option><option>Male</option>
                </select>
              </div>
              <div className="col-span-2"><label className="text-xs font-bold text-muted-foreground uppercase">Class</label>
                <select value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {classes.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Parent Name</label><Input value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="mt-1" placeholder="Kwame Owusu" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Parent Phone</label><Input value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="mt-1" placeholder="+233 24..." /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={mutateStudent.isPending}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEnroll} disabled={mutateStudent.isPending}>
                {mutateStudent.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Enroll Student')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* View Details Sheet */}
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Student Details</SheetTitle>
            <SheetDescription>Comprehensive view of student records.</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {viewDetails.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">{viewDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewDetails.studentId}</p>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[viewDetails.status] || 'bg-blue-100 text-blue-700'}`}>
                    {viewDetails.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Class</p>
                  <Link to="/classes" className="text-primary hover:underline font-medium">{viewDetails.class}</Link>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Age</p>
                  <p className="font-medium text-foreground">{viewDetails.age} yrs</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Gender</p>
                  <p className="font-medium text-foreground">{viewDetails.gender}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Fee Status</p>
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${feeColors[viewDetails.feeStatus]}`}>
                    {viewDetails.feeStatus}
                  </span>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Phone className="w-4 h-4"/> Guardian Info</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {viewDetails.parent}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {viewDetails.phone}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
