import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Award, Download, CheckCircle, Clock, Plus, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VCertificates() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCert, setNewCert] = useState({ title: '', student_name: '', qualification_name: '', issue_date: '' });

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_certificate', user?.company_id);
      setCertificates(records);
      if (records.length > 0 && !selectedCert) {
        setSelectedCert(records[0]);
      } else if (selectedCert) {
        const updated = records.find(r => r.id === selectedCert.id);
        if (updated) setSelectedCert(updated);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchCertificates();
    }
  }, [user]);

  const handleCreateCert = async () => {
    if (!newCert.student_name || !newCert.qualification_name) {
      toast.error('Student Name and Qualification are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_certificate', {
        title: newCert.title || `${newCert.student_name} - ${newCert.qualification_name}`,
        data: {
          student_name: newCert.student_name,
          qualification_name: newCert.qualification_name,
          issue_date: newCert.issue_date || new Date().toISOString().split('T')[0],
          certificate_id: `CERT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        }
      }, user?.company_id);
      toast.success('Certificate issued successfully');
      setIsDialogOpen(false);
      setNewCert({ title: '', student_name: '', qualification_name: '', issue_date: '' });
      fetchCertificates();
      setSelectedCert(created);
    } catch (error) {
      console.error('Failed to issue certificate:', error);
      toast.error('Failed to issue certificate');
    }
  };

  const filteredCerts = certificates.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.data?.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('certificates_directory', 'Certificates Directory')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {t('certificates_desc', 'Generate, verify, and manage vocational certificates.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-none">
              <Plus className="w-4 h-4 mr-2" /> {t('issue_cert', 'Issue Certificate')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-none bg-card">
            <DialogHeader>
              <DialogTitle>{t('issue_new_cert', 'Issue New Certificate')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student">{t('student_name', 'Student Name')}</Label>
                <Input id="student" placeholder="e.g. John Doe" value={newCert.student_name} onChange={e => setNewCert({...newCert, student_name: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qual">{t('qualification', 'Qualification / Program')}</Label>
                <Input id="qual" placeholder="e.g. Diploma in Automotive Repair" value={newCert.qualification_name} onChange={e => setNewCert({...newCert, qualification_name: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">{t('issue_date', 'Issue Date')}</Label>
                <Input id="date" type="date" value={newCert.issue_date} onChange={e => setNewCert({...newCert, issue_date: e.target.value})} className="rounded-xl border-primary/40 shadow-none" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateCert} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-none">{t('issue', 'Issue')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border border-primary/40 bg-card shadow-none">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by student or ID..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading certificates...</div>
            ) : filteredCerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No certificates found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredCerts.map(cert => (
                  <button
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedCert?.id === cert.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      selectedCert?.id === cert.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{cert.data?.student_name || cert.title}</p>
                      <p className={`text-xs truncate ${selectedCert?.id === cert.id ? 'text-primary' : 'text-muted-foreground'}`}>
                        {cert.data?.qualification_name || 'Certificate'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-2xl border border-primary/40 bg-card shadow-none overflow-hidden relative">
          {selectedCert ? (
            <>
              <div className="h-40 bg-primary/10 relative shrink-0 flex items-center justify-center border-b border-primary/10">
                <div className="absolute inset-4 border-2 border-primary/20 rounded-xl pointer-events-none"></div>
                <Award className="w-20 h-20 text-primary/10 absolute right-8" />
              </div>
              
              <ScrollArea className="flex-1 -mt-16">
                <div className="px-8 pb-8">
                  <div className="bg-card rounded-2xl p-10 border border-primary/20 shadow-none relative z-10 text-center max-w-2xl mx-auto mt-4">
                    <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
                    <h2 className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-2">Certificate of Completion</h2>
                    <h1 className="text-4xl font-serif text-slate-900 dark:text-white mb-6 font-bold">{selectedCert.data?.student_name || selectedCert.title}</h1>
                    <p className="text-muted-foreground mb-6">has successfully completed the requirements for the</p>
                    <h3 className="text-2xl font-bold text-primary mb-8">{selectedCert.data?.qualification_name || 'Vocational Training Program'}</h3>
                    
                    <div className="flex justify-between items-end border-t border-primary/10 pt-8 mt-8">
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">{selectedCert.data?.issue_date || new Date(selectedCert.created_date || Date.now()).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">Date of Issue</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{selectedCert.data?.certificate_id || `CERT-${selectedCert.id.substring(0,6).toUpperCase()}`}</p>
                        <p className="text-xs text-muted-foreground">Certificate ID</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center gap-4">
                    <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/5 rounded-xl shadow-none">
                      <CheckCircle className="w-4 h-4 mr-2" /> Verify Status
                    </Button>
                    <Button className="rounded-xl shadow-none bg-primary text-white hover:bg-primary/90">
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Award className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Certificate Selected</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Select a certificate from the list to view its details, verify authenticity, or download a copy.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
