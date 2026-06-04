import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, Printer, Download, FileCheck, FileX, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SHSAdmissionDecisions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterType, setFilterType] = useState('All'); // All, Admitted, Rejected

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_applicant', user?.company_id);
      // Filter out pending, only keep those with decisions
      const decided = records.filter(a => a.status === 'Admitted' || a.status === 'Rejected');
      setDecisions(decided);
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchDecisions();
    }
  }, [user]);

  const filteredDecisions = decisions.filter(d => 
    (filterType === 'All' || d.status === filterType) &&
    (d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     d.case_number?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const generateLetter = (decision) => {
    // In a real app, this would trigger a PDF generation or email send
    alert(`Generating ${decision.status.toLowerCase()} letter for ${decision.title}...`);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            Admission Decisions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            View finalized applicant decisions and generate admission or rejection letters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-purple-100 cursor-pointer transition-all hover:bg-blue-50 dark:bg-slate-800" onClick={() => setFilterType('All')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${filterType === 'All' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Total Decisions</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{decisions.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-emerald-100 cursor-pointer transition-all hover:bg-emerald-50" onClick={() => setFilterType('Admitted')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${filterType === 'Admitted' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Admitted</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {decisions.filter(d => d.status === 'Admitted').length}
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-rose-100 cursor-pointer transition-all hover:bg-rose-50" onClick={() => setFilterType('Rejected')}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${filterType === 'Rejected' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'}`}>
              <FileX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Rejected</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {decisions.filter(d => d.status === 'Rejected').length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Decision Results</CardTitle>
              <CardDescription>Filtering by: {filterType}</CardDescription>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input 
                  placeholder="Search applicant name..." 
                  className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 dark:border-slate-700">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading decisions...</div>
          ) : filteredDecisions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-500 dark:text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No decisions found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">There are no finalized decisions in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Applicant Name</th>
                    <th className="px-6 py-4">App ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">BECE Agg.</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDecisions.map((decision) => (
                    <tr key={decision.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                        {decision.title}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                        {decision.case_number}
                      </td>
                      <td className="px-6 py-4">
                        {decision.status === 'Admitted' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1 gap-1">
                            <CheckCircle className="w-3 h-3" /> Admitted
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none px-3 py-1 gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{decision.data?.beceAggregate}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => generateLetter(decision)}
                          className="text-blue-600 dark:text-blue-400 hover:text-[#5200c2] hover:bg-blue-50 dark:bg-slate-800 rounded-lg gap-2 font-semibold"
                        >
                          <Printer className="w-4 h-4" /> Letter
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
    </div>
  );
}
