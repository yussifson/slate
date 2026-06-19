import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Building2, MapPin, Phone, Mail, Link as LinkIcon, Star, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function VEmployers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEmployer, setNewEmployer] = useState({ title: '', industry: '', address: '', website: '', phone: '', mail: '' });

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('voc_employer', user?.company_id);
      setEmployers(records);
      if (records.length > 0 && !selectedEmployer) {
        setSelectedEmployer(records[0]);
      } else if (selectedEmployer) {
        const updated = records.find(r => r.id === selectedEmployer.id);
        if (updated) setSelectedEmployer(updated);
      }
    } catch (error) {
      console.error('Failed to fetch employers:', error);
      toast.error('Failed to load employers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchEmployers();
    }
  }, [user]);

  const handleCreateEmployer = async () => {
    if (!newEmployer.title || !newEmployer.industry) {
      toast.error('Name and Industry are required');
      return;
    }
    try {
      const created = await base44.createEntity('voc_employer', {
        title: newEmployer.title,
        data: {
          industry: newEmployer.industry,
          address: newEmployer.address,
          website: newEmployer.website,
          phone: newEmployer.phone,
          mail: newEmployer.mail,
          partnershipLevel: 'New Partner',
          totalPlacements: 0,
          activeInterns: 0,
          contacts: []
        }
      }, user?.company_id);
      toast.success('Employer added successfully');
      setIsDialogOpen(false);
      setNewEmployer({ title: '', industry: '', address: '', website: '', phone: '', mail: '' });
      fetchEmployers();
      setSelectedEmployer(created);
    } catch (error) {
      console.error('Failed to add employer:', error);
      toast.error('Failed to add employer');
    }
  };

  const filteredEmployers = employers.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tracking-[-0.02em]">
            {t('employer_partners', 'Employer Partners')}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
            {t('employers_desc', 'Manage industry partners, contacts, and placement histories.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
              <Plus className="w-4 h-4 mr-2" /> {t('add_employer', 'Add Employer')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <DialogHeader>
              <DialogTitle>{t('add_new_employer', 'Add New Employer')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="title">{t('company_name', 'Company Name')}</Label>
                <Input id="title" placeholder="e.g. BuildRight Construction" value={newEmployer.title} onChange={e => setNewEmployer({...newEmployer, title: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">{t('industry', 'Industry Sector')}</Label>
                <Input id="industry" placeholder="e.g. Construction" value={newEmployer.industry} onChange={e => setNewEmployer({...newEmployer, industry: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('address', 'Address')}</Label>
                <Input id="address" placeholder="e.g. 123 Tech Park" value={newEmployer.address} onChange={e => setNewEmployer({...newEmployer, address: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('website', 'Website')}</Label>
                <Input id="website" placeholder="e.g. www.buildright.com" value={newEmployer.website} onChange={e => setNewEmployer({...newEmployer, website: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone', 'Phone')}</Label>
                  <Input id="phone" placeholder="e.g. +1234567890" value={newEmployer.phone} onChange={e => setNewEmployer({...newEmployer, phone: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mail">{t('email', 'Email')}</Label>
                  <Input id="mail" type="email" placeholder="contact@..." value={newEmployer.mail} onChange={e => setNewEmployer({...newEmployer, mail: e.target.value})} className="rounded-xl border-primary/40 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateEmployer} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">{t('save', 'Save Partner')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
              <Input 
                placeholder="Search employers..." 
                className="pl-9 h-10 border-primary/40 rounded-xl focus-visible:ring-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">Loading partners...</div>
            ) : filteredEmployers.length === 0 ? (
              <div className="p-8 text-center text-[#71717a] dark:text-gray-400 text-sm">No employers found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredEmployers.map(employer => (
                  <button
                    key={employer.id}
                    onClick={() => setSelectedEmployer(employer)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedEmployer?.id === employer.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-primary/5 text-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold ${
                      selectedEmployer?.id === employer.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate text-sm">{employer.title}</p>
                      <p className={`text-xs truncate ${selectedEmployer?.id === employer.id ? 'text-primary' : 'text-[#71717a] dark:text-gray-400'}`}>
                        {employer.data?.industry || 'General'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none overflow-hidden relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          {selectedEmployer ? (
            <>
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-primary/10">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-white hover:bg-primary/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none flex items-center gap-2 px-3 py-1 text-xs tracking-[0.04em]">
                    <Star className="w-3 h-3 fill-current" /> {selectedEmployer.data?.partnershipLevel || 'Active Partner'}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-2xl bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-2 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                      <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <Building2 className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em]">{selectedEmployer.title}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[#71717a] dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-primary" /> {selectedEmployer.data?.address || 'Address not provided'}</span>
                        <span className="flex items-center gap-2.5"><LinkIcon className="w-4 h-4 text-primary" /> {selectedEmployer.data?.website || 'No website'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-primary/5 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Overview</TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Key Contacts</TabsTrigger>
                        <TabsTrigger value="placements" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">Placements</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl">
                              <CardHeader className="pb-3 border-b border-primary/5">
                                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Company Info</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4 space-y-4">
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Industry Sector</p>
                                  <p className="font-medium text-slate-900 dark:text-white">{selectedEmployer.data?.industry || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Description</p>
                                  <p className="font-medium text-slate-900 dark:text-white text-sm mt-1">{selectedEmployer.data?.description || 'No description available for this employer.'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 tracking-[0.04em]"><Phone className="w-3 h-3" /> Phone</p>
                                    <p className="font-medium text-slate-900 dark:text-white text-sm mt-1">{selectedEmployer.data?.phone || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 tracking-[0.04em]"><Mail className="w-3 h-3" /> Email</p>
                                    <p className="font-medium text-slate-900 dark:text-white text-sm mt-1">{selectedEmployer.data?.mail || 'N/A'}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-primary/5 border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl">
                              <CardHeader className="pb-3 border-b border-primary/5">
                                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider tracking-[0.04em]">Partnership Details</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Partner Since</p>
                                    <p className="font-medium text-slate-900 dark:text-white text-lg">{new Date(selectedEmployer.created_date || Date.now()).getFullYear()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Total Placements</p>
                                    <p className="font-medium text-slate-900 dark:text-white text-lg">{selectedEmployer.data?.totalPlacements || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Active Interns</p>
                                    <p className="font-medium text-slate-900 dark:text-white text-lg">{selectedEmployer.data?.activeInterns || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Evaluation Score</p>
                                    <div className="flex items-center gap-2 text-amber-500 font-semibold text-lg">
                                      <Star className="w-4 h-4 fill-current" /> 4.8
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="contacts" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl text-center py-12">
                            <Phone className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                            <p className="text-[#71717a] dark:text-gray-400 text-sm">No contacts have been added for this employer yet.</p>
                            <Button variant="outline" className="mt-4 border-primary/40 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-xl">Add Contact</Button>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="placements" className="outline-none">
                          <Card className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 bg-primary/5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none rounded-2xl text-center py-12">
                            <Building2 className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                            <p className="text-[#71717a] dark:text-gray-400 text-sm">No active or past placements recorded.</p>
                          </Card>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Building2 className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Employer Selected</h3>
              <p className="text-[#71717a] dark:text-gray-400 max-w-sm mt-2">
                Select an employer partner from the list to view their details, key contacts, and placement history.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
