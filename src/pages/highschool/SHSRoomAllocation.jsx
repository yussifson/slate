import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, Users, BedDouble, Save, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SHSRoomAllocation() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
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
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Room Allocation
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Assign boarding students to specific rooms within their allocated house.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Select Boarding House
              </label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 font-semibold text-slate-700 dark:text-slate-200"
                value={selectedHouseId}
                onChange={(e) => setSelectedHouseId(e.target.value)}
              >
                {houses.map(h => (
                  <option key={h.id} value={h.id}>{h.title} ({h.data?.gender || 'Mixed'})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Search Students
              </label>
              <Input 
                placeholder="Name or Index No..."
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500"
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
            <div className="p-16 text-center text-slate-400 dark:text-slate-500">Loading residents...</div>
          ) : !selectedHouseId ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <BedDouble className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Select a house</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-2">
                Choose a boarding house to assign rooms to its residents.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">
              No unassigned boarders or residents found for this house.
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-100 dark:border-slate-800">
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
                      <tr key={student.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-center text-slate-400 dark:text-slate-500 font-bold">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-slate-100 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            {student.title.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{student.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{student.data?.indexNumber || student.case_number}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {student.data?.classRoom || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className={student.data?.houseId === selectedHouseId ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500"}>
                            {student.data?.houseName || 'Unassigned'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Input 
                            placeholder="e.g. Room 12B"
                            className="h-10 text-center font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-500"
                            value={allocations[student.id] || ''}
                            onChange={(e) => handleRoomChange(student.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {saveSuccess && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                      <CheckCircle2 className="w-4 h-4" /> Allocations Saved
                    </Badge>
                  )}
                </div>
                
                <Button 
                  onClick={handleSaveAllocations}
                  disabled={isSaving}
                  className="h-12 px-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-bold"
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
