import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Award, Download, CheckCircle, Clock, Plus, ShieldCheck} from 'lucide-react';
import { Badge} from '@/components/ui/badge';
import { ScrollArea} from '@/components/ui/scroll-area';

export default function VCertificates() {
 const { t} = useTranslation();
 const { user} = useAuth();
 const [certificates, setCertificates] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCert, setSelectedCert] = useState(null);

 const fetchCertificates = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('voc_certificate', user?.company_id);
 setCertificates(records);
 if (records.length > 0 && !selectedCert) {
 setSelectedCert(records[0]);
}
} catch (error) {
 console.error('Failed to fetch certificates:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchCertificates();
}
}, [user]);

 const filteredCerts = certificates.filter(c => 
 c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 c.data?.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-rose-600 via-rose-700 to-slate-900 bg-clip-text text-transparent">
 Certificates Directory
 </h1>
 <p className="text-muted-foreground mt-1 text-sm font-medium">
 Generate, verify, and manage vocational certificates.
 </p>
 </div>
 <Button className="rounded-xl -rose-200 bg-rose-600 hover:bg-rose-700 text-white">
 <Plus className="w-4 h-4 mr-2" /> Issue Certificate
 </Button>
 </div>

 <div className="flex-1 flex gap-6 overflow-hidden">
 <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-rose-100/50">
 <div className="p-4 border-b border-rose-50">
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
 <Input 
 placeholder="Search by student or ID..." 
 className="pl-9 h-10 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-rose-100 dark:border-slate-700 rounded-xl focus-visible:ring-rose-600"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 <ScrollArea className="flex-1">
 {loading ? (
 <div className="p-8 text-center text-rose-300 text-sm">Loading certificates...</div>
 ) : filteredCerts.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No certificates found.</div>
 ) : (
 <div className="p-2 space-y-1">
 {filteredCerts.map(cert => (
 <button
 key={cert.id}
 onClick={() => setSelectedCert(cert)}
 className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
 selectedCert?.id === cert.id 
 ? 'bg-rose-600 text-white -rose-500/20' 
 : 'hover:bg-rose-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:text-slate-200'
}`}
 >
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
 selectedCert?.id === cert.id ? 'bg-white dark:bg-slate-900/40/20' : 'bg-rose-100 text-rose-600'
}`}>
 <Award className="w-5 h-5" />
 </div>
 <div className="overflow-hidden">
 <p className="font-bold truncate">{cert.data?.student_name || cert.title}</p>
 <p className={`text-xs truncate ${selectedCert?.id === cert.id ? 'text-rose-200' : 'text-slate-500 dark:text-slate-400'}`}>
 {cert.data?.qualification_name || 'Certificate'}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </ScrollArea>
 </Card>

 <Card className="flex-1 flex flex-col rounded-3xl border-none bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-rose-100/50 overflow-hidden relative">
 {selectedCert ? (
 <>
 <div className="h-40 bg-gradient-to-r from-slate-900 via-rose-900 to-rose-700 relative shrink-0 flex items-center justify-center">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
 {/* Decorative Certificate Background Element */}
 <div className="absolute inset-4 border-2 border-rose-400/30 rounded-xl pointer-events-none"></div>
 <Award className="w-20 h-20 text-rose-300/50 absolute right-8" />
 </div>
 
 <ScrollArea className="flex-1 -mt-16">
 <div className="px-8 pb-8">
 <div className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 dark:border-slate-800 relative z-10 text-center max-w-2xl mx-auto mt-4">
 <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-6" />
 <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-2">Certificate of Completion</h2>
 <h1 className="text-4xl font-serif text-slate-800 dark:text-slate-100 mb-6">{selectedCert.data?.student_name || selectedCert.title}</h1>
 <p className="text-slate-600 mb-6">has successfully completed the requirements for the</p>
 <h3 className="text-2xl font-bold text-rose-600 mb-8">{selectedCert.data?.qualification_name || 'Vocational Training Program'}</h3>
 
 <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
 <div className="text-left">
 <p className="font-bold text-slate-800">{selectedCert.data?.issue_date || new Date(selectedCert.created_date).toLocaleDateString()}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400">Date of Issue</p>
 </div>
 <div className="text-right">
 <p className="font-bold text-slate-800">{selectedCert.data?.certificate_id || `CERT-${selectedCert.id.substring(0,6).toUpperCase()}`}</p>
 <p className="text-xs text-slate-500 dark:text-slate-400">Certificate ID</p>
 </div>
 </div>
 </div>

 <div className="mt-8 flex justify-center gap-4">
 <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl">
 <CheckCircle className="w-4 h-4 mr-2" /> Verify Status
 </Button>
 <Button className="rounded-xl -rose-200 bg-rose-600 hover:bg-rose-700">
 <Download className="w-4 h-4 mr-2" /> Download PDF
 </Button>
 </div>
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
 <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
 <Award className="w-10 h-10 text-rose-300" />
 </div>
 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Certificate Selected</h3>
 <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
 Select a certificate from the list to view its details, verify authenticity, or download a copy.
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
