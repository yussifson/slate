import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, User, Eye, ChevronLeft, ChevronRight, Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const statusColors = {
  scheduled: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800/30', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  completed: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800/30', badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  cancelled: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800/30', badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  rescheduled: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/30', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' }
};

export default function Viewings() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [viewings, setViewings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1));
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '', propertyAddress: '', clientId: '', clientName: '',
    agentId: '', agentName: '', viewingDate: '', viewingTime: '', status: 'scheduled', notes: ''
  });

  useEffect(() => {
    const fetchViewings = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setViewings(data);
      } catch (e) {
        console.error('[Viewings]:', e);
        toast.error('Failed to load viewings');
      }
      setIsLoading(false);
    };
    if (companyId) fetchViewings();
  }, [companyId]);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2.5 bg-slate-50/50 dark:bg-slate-900/20 border-r border-b border-slate-200 dark:border-slate-800"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayViewings = viewings.filter(v => {
        const vDate = new Date(v.viewing_date);
        return vDate.toDateString() === date.toDateString();
      });
      
      days.push(
        <div key={day} className="min-h-[100px] p-2.5 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 ease-in-out cursor-pointer bg-white dark:bg-slate-900/50 group">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{day}</div>
          <div className="space-y-1.5">
            {dayViewings.slice(0, 2).map(v => (
              <div key={v.id} className={`text-xs px-2 py-1 rounded-md font-medium shadow-sm border border-white/20 dark:border-white/5 ${statusColors[v.status]?.badge} truncate transition-all`}>
                {v.client_name}
              </div>
            ))}
            {dayViewings.length > 2 && <div className="text-xs font-medium text-slate-500 dark:text-slate-400">+{dayViewings.length - 2} more</div>}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const upcomingViewings = viewings.filter(v => new Date(v.viewing_date) >= new Date()).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800/50">
                <Calendar className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              Property Viewings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Schedule and track property showings seamlessly</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-600/20 dark:shadow-blue-900/20 gap-2 transition-all duration-300 rounded-xl">
            <Plus className="w-5 h-5" /> Schedule Viewing
          </Button>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <Card className="border border-slate-200 dark:border-white/10 shadow-xl dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-bold tracking-wide">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200 dark:border-slate-600/30">
                    <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 h-8 w-8 p-0 rounded-md transition-colors shadow-sm">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNextMonth} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 h-8 w-8 p-0 rounded-md transition-colors shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 border-l border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-7 gap-0">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 px-2 text-center text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800">
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Viewings Sidebar */}
          <div>
            <Card className="border border-slate-200 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900/50 backdrop-blur-sm h-full flex flex-col transition-all duration-300">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                    <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 custom-scrollbar scrollbar-green">
                  {upcomingViewings.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full min-h-[200px]">
                      <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700">
                        <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="font-medium">No upcoming viewings</p>
                      <p className="text-sm mt-1 text-slate-400">Your schedule is clear</p>
                    </div>
                  ) : (
                    upcomingViewings.map(viewing => (
                      <div key={viewing.id} className="p-5 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{viewing.client_name}</p>
                          <Badge className={`${statusColors[viewing.status]?.badge} border-0 shadow-sm px-2.5 py-0.5`}>{viewing.status}</Badge>
                        </div>
                        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" /> 
                            <span className="leading-snug">{viewing.property_address}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                            <span>{viewing.viewing_date} at {viewing.viewing_time}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                            <span>{viewing.agent_name}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Sheet */}
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetContent side="right" className="w-full sm:w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Schedule Property Viewing</SheetTitle>
              <SheetDescription>Enter viewing details below</SheetDescription>
            </SheetHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (!formData.propertyAddress || !formData.clientName || !formData.viewingDate) {
                  toast.error('Please fill in all required fields');
                  return;
                }
                const submitData = {
                  ...formData,
                  viewingTime: formData.viewingTime || '09:00'
                };
                const viewingId = await RealEstateAPI.createViewing(companyId, submitData, user?.id);
                
                // Wait a moment for PowerSync to sync
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const res = await powerSync.execute(
                  'SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC',
                  [companyId]
                );
                const data = res.rows._array || Array.from(res.rows);
                setViewings(data);
                toast.success('Viewing scheduled successfully');
                setShowForm(false);
                setFormData({
                  propertyId: '', propertyAddress: '', clientId: '', clientName: '',
                  agentId: '', agentName: '', viewingDate: '', viewingTime: '', status: 'scheduled', notes: ''
                });
              } catch (error) {
                console.error('Error creating viewing:', error);
                toast.error('Failed to schedule viewing');
              }
            }} className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Property ID</label>
                <input type="text" placeholder="Property ID" value={formData.propertyId} onChange={(e) => setFormData({...formData, propertyId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Property Address *</label>
                <input type="text" placeholder="Property Address" value={formData.propertyAddress} onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Client ID</label>
                <input type="text" placeholder="Client ID" value={formData.clientId} onChange={(e) => setFormData({...formData, clientId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Client Name *</label>
                <input type="text" placeholder="Client Name" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Agent ID</label>
                <input type="text" placeholder="Agent ID" value={formData.agentId} onChange={(e) => setFormData({...formData, agentId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Agent Name</label>
                <input type="text" placeholder="Agent Name" value={formData.agentName} onChange={(e) => setFormData({...formData, agentName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Viewing Date *</label>
                  <input type="date" value={formData.viewingDate} onChange={(e) => setFormData({...formData, viewingDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Time</label>
                  <input type="time" value={formData.viewingTime} onChange={(e) => setFormData({...formData, viewingTime: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block">Notes</label>
                <textarea placeholder="Additional notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" rows="3"></textarea>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/20 py-2.5 transition-all">Schedule Viewing</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
