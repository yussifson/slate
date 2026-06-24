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
import RealEstateAPI from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

const statusColors = {
  scheduled: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  completed: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800' },
  cancelled: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  rescheduled: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800' }
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
      days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayViewings = viewings.filter(v => {
        const vDate = new Date(v.viewing_date);
        return vDate.toDateString() === date.toDateString();
      });
      
      days.push(
        <div key={day} className="min-h-24 p-2 border border-gray-200 hover:bg-green-50 transition-colors cursor-pointer bg-white">
          <div className="text-sm font-semibold text-gray-700 mb-1">{day}</div>
          <div className="space-y-1">
            {dayViewings.slice(0, 2).map(v => (
              <div key={v.id} className={`text-xs p-1 rounded ${statusColors[v.status]?.badge} truncate`}>
                {v.client_name}
              </div>
            ))}
            {dayViewings.length > 2 && <div className="text-xs text-gray-500">+{dayViewings.length - 2} more</div>}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const upcomingViewings = viewings.filter(v => new Date(v.viewing_date) >= new Date()).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-7 h-7 text-blue-600" /></div>
              Property Viewings
            </h1>
            <p className="text-gray-600 mt-1">Schedule and track property showings</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" /> Schedule Viewing
          </Button>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="text-white hover:bg-blue-500">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNextMonth} className="text-white hover:bg-blue-500">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-7 gap-0">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-100 border-b border-gray-200">
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
            <Card className="border-0 shadow-lg h-full">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {upcomingViewings.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 flex flex-col items-center justify-center h-40">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p>No upcoming viewings</p>
                    </div>
                  ) : (
                    upcomingViewings.map(viewing => (
                      <div key={viewing.id} className="p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900 text-sm">{viewing.client_name}</p>
                          <Badge className={statusColors[viewing.status]?.badge}>{viewing.status}</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> {viewing.property_address}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {viewing.viewing_date} at {viewing.viewing_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" /> {viewing.agent_name}
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
                await RealEstateAPI.createViewing(companyId, submitData, user?.id);
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
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Property ID</label>
                <input type="text" placeholder="Property ID" value={formData.propertyId} onChange={(e) => setFormData({...formData, propertyId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Property Address *</label>
                <input type="text" placeholder="Property Address" value={formData.propertyAddress} onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Client ID</label>
                <input type="text" placeholder="Client ID" value={formData.clientId} onChange={(e) => setFormData({...formData, clientId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Client Name *</label>
                <input type="text" placeholder="Client Name" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Agent ID</label>
                <input type="text" placeholder="Agent ID" value={formData.agentId} onChange={(e) => setFormData({...formData, agentId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Agent Name</label>
                <input type="text" placeholder="Agent Name" value={formData.agentName} onChange={(e) => setFormData({...formData, agentName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Viewing Date *</label>
                  <input type="date" value={formData.viewingDate} onChange={(e) => setFormData({...formData, viewingDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Time</label>
                  <input type="time" value={formData.viewingTime} onChange={(e) => setFormData({...formData, viewingTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
                <textarea placeholder="Additional notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="3"></textarea>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Schedule Viewing</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
