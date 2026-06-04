import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Calendar as CalendarIcon, CalendarDays, Clock, Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SHSAcademicCalendar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: '',
    endDate: '',
    type: 'Term Dates', // Term Dates, Holiday, Exam Period, School Event
    description: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_calendar_event', user?.company_id);
      
      // Sort by start date ascending
      records.sort((a, b) => new Date(a.data?.startDate) - new Date(b.data?.startDate));
      
      setEvents(records);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchEvents();
    }
  }, [user]);

  const handleAddEvent = async () => {
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_calendar_event',
        title: newEvent.title,
        case_number: `EVT-${Math.floor(Math.random() * 10000)}`,
        status: 'Active',
        data: newEvent
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewEvent({ title: '', startDate: '', endDate: '', type: 'Term Dates', description: '' });
      fetchEvents();
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventIcon = (type) => {
    switch(type) {
      case 'Term Dates': return <CalendarDays className="w-5 h-5" />;
      case 'Holiday': return <Clock className="w-5 h-5" />;
      case 'Exam Period': return <Flag className="w-5 h-5" />;
      default: return <CalendarIcon className="w-5 h-5" />;
    }
  };

  const getEventColor = (type) => {
    switch(type) {
      case 'Term Dates': return 'border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-slate-800/30';
      case 'Holiday': return 'border-emerald-500 bg-emerald-50/30';
      case 'Exam Period': return 'border-rose-500 bg-rose-50/30';
      default: return 'border-blue-500 bg-blue-50/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Academic Calendar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage term dates, holidays, and key events for the academic year.
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Event Schedule</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input 
                placeholder="Search events..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading calendar...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-blue-500 dark:text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No events scheduled</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Add key dates to build the academic calendar.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 md:ml-6 space-y-8 pb-8">
                {filteredEvents.map((evt) => {
                  const startDate = new Date(evt.data?.startDate);
                  const isPast = startDate < new Date();
                  
                  return (
                    <div key={evt.id} className="relative pl-8 md:pl-10">
                      <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white ${isPast ? 'bg-slate-300' : 'bg-blue-600 dark:bg-blue-500'} shadow-sm`} />
                      
                      <div className={`p-5 rounded-2xl border-l-4 shadow-sm bg-white dark:bg-slate-900 ${getEventColor(evt.data?.type)} ${isPast ? 'opacity-60' : ''}`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-white dark:bg-slate-900">{evt.data?.type}</Badge>
                              {isPast && <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500">Past</Badge>}
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{evt.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 shrink-0">
                            {getEventIcon(evt.data?.type)}
                            <span>
                              {new Date(evt.data?.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              {evt.data?.endDate && evt.data.startDate !== evt.data.endDate && 
                                ` - ${new Date(evt.data.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                              }
                            </span>
                          </div>
                        </div>
                        {evt.data?.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2">{evt.data.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Add Calendar Event</DialogTitle>
              <DialogDescription className="text-blue-100 dark:text-blue-900">
                Schedule a new event or term date.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Event Title</label>
              <Input 
                placeholder="e.g. First Term Begins"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Event Type</label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                value={newEvent.type}
                onChange={e => setNewEvent({...newEvent, type: e.target.value})}
              >
                <option value="Term Dates">Term Dates</option>
                <option value="Holiday">Holiday</option>
                <option value="Exam Period">Exam Period</option>
                <option value="School Event">School Event (e.g. Sports Day)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Start Date</label>
                <Input 
                  type="date"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newEvent.startDate}
                  onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">End Date (Optional)</label>
                <Input 
                  type="date"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newEvent.endDate}
                  onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Description</label>
              <textarea 
                className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 resize-none text-sm"
                placeholder="Optional details..."
                value={newEvent.description}
                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAddEvent} 
              disabled={!newEvent.title || !newEvent.startDate}
              className="rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold"
            >
              Save Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
