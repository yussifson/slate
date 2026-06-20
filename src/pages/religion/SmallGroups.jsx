import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Users, MapPin, Clock, Plus, Trash2, Search, Sparkles} from 'lucide-react';
import { generateText } from '@/lib/cloudflareAI';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Link} from 'react-router-dom';

import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

export default function SmallGroups() {
 const { t} = useTranslation();
 const companyId = useCompanyId();
 const powerSync = usePowerSync();

 const [groups, setGroups] = useState([]);
 const [isDbLoading, setIsDbLoading] = useState(true);

 useEffect(() => {
   let active = true;
   const fetchGroups = async () => {
     setIsDbLoading(true);
     try {
       const res = await powerSync.execute('SELECT * FROM univ_religion_small_groups WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
       if(active) setGroups(res.rows._array || Array.from(res.rows));
     } catch(e){}
     setIsDbLoading(false);
   };
   if (companyId) fetchGroups();
   return () => { active = false; };
 }, [companyId]);

 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [viewRecord, setViewRecord] = useState(null);
 const [editRecord, setEditRecord] = useState(null);

 // Form State
 const [formData, setFormData] = useState({
 name: '',
 leader: '',
 location: '',
 time: 'Wednesdays, 7:00 PM',
 members: 5
});


 const openEdit = (record) => {
 setEditRecord(record);
 setFormData(record);
 setShowModal(true);
};

 const handleCreateGroup = async () => {
 if (!formData.name.trim() || !formData.leader.trim() || !formData.location.trim()) {
   return toast.error("Please enter a group name, leader, and location address");
 }

 try {
   if (editRecord) {
     await powerSync.execute(`UPDATE univ_religion_small_groups SET name=?, leader=?, location=?, time=?, members=? WHERE id=?`, 
       [formData.name, formData.leader, formData.location, formData.time, parseInt(formData.members) || 0, editRecord.id]
     );
     toast.success('Cell group updated successfully!');
   } else {
     await powerSync.execute(`INSERT INTO univ_religion_small_groups (id, created_at, company_id, name, leader, location, time, members, status) VALUES (gen_random_uuid(), NOW(), ?, ?, ?, ?, ?, ?, 'Active')`, 
       [companyId, formData.name, formData.leader, formData.location, formData.time, parseInt(formData.members) || 0]
     );
     toast.success('Cell group configured successfully!');
   }
   setShowModal(false);
   setEditRecord(null);
   setFormData({ name: '', leader: '', location: '', time: 'Wednesdays, 7:00 PM', members: 5});
   
   const res = await powerSync.execute('SELECT * FROM univ_religion_small_groups WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
   setGroups(res.rows._array || Array.from(res.rows));
 } catch (err) {
   toast.error('Failed to configure small group: ' + err.message);
 }
};

 const handleDeleteGroup = async () => {
 if (!deleteTargetId) return;
 try {
   await powerSync.execute(`DELETE FROM univ_religion_small_groups WHERE id=?`, [deleteTargetId]);
   toast.success('Cell group removed successfully!');
   setDeleteTargetId(null);
   setGroups(groups.filter(g => g.id !== deleteTargetId));
 } catch (err) {
   toast.error('Failed to remove cell group: ' + err.message);
 }
};

 const filtered = groups.filter(g =>
  g.name?.toLowerCase().includes(search.toLowerCase()) ||
  g.leader?.toLowerCase().includes(search.toLowerCase()) ||
  g.location?.toLowerCase().includes(search.toLowerCase())
 );

 const [isMatching, setIsMatching] = useState(false);
 const [matchQuery, setMatchQuery] = useState('');
 const [highlightedGroup, setHighlightedGroup] = useState(null);

 const handleSmartMatch = async () => {
   if (!matchQuery) {
     return toast.error("Please enter a location or interest to match.");
   }
   if (groups.length === 0) return toast.error("No groups available to match.");

   setIsMatching(true);
   const tId = toast.loading('Finding the best small group match...');
   try {
     const prompt = `You are a church small group coordinator. 
A member is looking for a group matching: "${matchQuery}".
Available groups:
${groups.map(g => `- ID: ${g.id}, Name: ${g.name}, Location: ${g.location}, Time: ${g.time}`).join('\n')}

Based on location proximity and general fit, which group is the best match? Respond with ONLY the exact ID of the best matching group.`;
     
     const resultId = await generateText(prompt);
     const cleanId = resultId.trim();
     
     if (groups.some(g => g.id === cleanId)) {
       setHighlightedGroup(cleanId);
       toast.success('Found the perfect small group match!', { id: tId });
       setSearch(''); // clear search so it shows
       
       setTimeout(() => {
         setHighlightedGroup(null);
       }, 5000); // highlight for 5s
     } else {
       toast.error('Could not find a definite match.', { id: tId });
     }
   } catch (err) {
     toast.error('Matching failed.', { id: tId });
   } finally {
     setIsMatching(false);
   }
 };

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-semibold text-card-foreground tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("small_groups", "Small Groups")}</h1>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{t(
 "cell_groups_and_home_fellowshi",
 "Cell groups and home fellowship directory"
 )}</p>
 </div>
  </div>
  <div className="flex gap-2">
  <div className="flex items-center">
    <Input 
      placeholder="Match by location..." 
      value={matchQuery} 
      onChange={e => setMatchQuery(e.target.value)} 
      className="w-48 rounded-r-none border-r-0 h-9"
    />
    <Button onClick={handleSmartMatch} disabled={isMatching} variant="outline" className="h-9 rounded-l-none border-l-0 gap-2 border-primary/30 text-primary hover:bg-primary/10">
      <Sparkles className="w-4 h-4" /> Match
    </Button>
  </div>
  <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white h-9">
  <Plus className="w-4 h-4" /> {t("add_group", "Add Group")}
  </Button>
  </div>
  <div className="flex items-center gap-3">
  <div className="relative max-w-md flex-1">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] dark:text-gray-400" />
  <Input placeholder="Search cells and host locations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
  </div>
  </div>
 {isDbLoading ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400">{t("loading_groups", "Loading groups...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-[#71717a] dark:text-gray-400 bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Users className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-primary" />
 <p className="font-semibold text-lg text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("no_cell_groups_configured", "No cell groups configured")}</p>
 <p className="text-sm mt-1 max-w-md mx-auto">{t(
 "register_localized_neighborhoo",
 "Register localized neighborhood study cells and host schedules using the top right button."
 )}</p>
 </div>
 ) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filtered.map(group => {
  const isMatch = highlightedGroup === group.id;
  return (
  <div key={group.id} className={`bg-card rounded-xl border-[0.5px] p-6 hover:border-primary/20 transition-colors relative group hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200 ${isMatch ? 'ring-2 ring-primary border-primary shadow-lg scale-[1.02] transition-all' : 'border-black/9 dark:border-white/8 border-primary/40'}`}>
  {isMatch && <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full p-2 shadow-lg"><Sparkles className="w-4 h-4"/></div>}
 <div className="flex justify-between items-start mb-4">
 <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-500 flex items-center justify-center text-primary dark:text-primary/70">
 <Users className="w-6 h-6" />
 </div>
 <div className="flex items-center gap-2">
 <span className="bg-muted text-[#71717a] dark:text-gray-400 px-3 py-1 rounded-full text-xs font-semibold tracking-[0.04em]">{group.members} {t("members", "Members")}</span>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => setViewRecord(group)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openEdit(group)}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(group.id)} className="text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 <h3 className="text-xl font-semibold text-card-foreground mb-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{group.name}</h3>
 <p className="text-sm text-[#71717a] dark:text-gray-400 mb-4">{t("leader", "Leader:")} <Link to="/religion/members" className="font-semibold text-primary hover:underline">{group.leader}</Link></p>
 <div className="space-y-3 text-sm text-[#71717a] dark:text-gray-400 bg-muted dark:bg-muted/30 p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40">
 <div className="flex items-center gap-3">
 <MapPin className="w-4 h-4 text-primary" />
 <span>{group.location}</span>
 </div>
 <div className="flex items-center gap-3">
 <Clock className="w-4 h-4 text-primary" />
 <span>{group.time}</span>
 </div>
 </div>
 </div>
 );
})}
 </div>
 )}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Users className="w-5 h-5 text-primary" /> {t("configure_cell_group", "Configure Cell Group")}
 </h2>
 <div className="space-y-3">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("group_name", "Group Name")}</label>
 <Input
 value={formData.name}
 onChange={e => setFormData({ ...formData, name: e.target.value})}
 className="mt-1"
 placeholder="e.g. Grace Fellowship"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("group_leader", "Group Leader")}</label>
 <Input
 value={formData.leader}
 onChange={e => setFormData({ ...formData, leader: e.target.value})}
 className="mt-1"
 placeholder="e.g. Brother Kofi"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("host_location_address", "Host Location Address")}</label>
 <Input
 value={formData.location}
 onChange={e => setFormData({ ...formData, location: e.target.value})}
 className="mt-1"
 placeholder="e.g. Block 4, East Legon"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("weekly_meeting_time", "Weekly Meeting Time")}</label>
 <Input
 value={formData.time}
 onChange={e => setFormData({ ...formData, time: e.target.value})}
 className="mt-1"
 placeholder="e.g. Wednesdays, 7:00 PM"
 />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("initial_members_count", "Initial Members Count")}</label>
 <Input
 type="number"
 value={formData.members}
 onChange={e => setFormData({ ...formData, members: e.target.value})}
 className="mt-1"
 placeholder="5"
 />
 </div>
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleCreateGroup}>{editRecord ? 'Update' : 'Save Cell'}</Button>
 </div>
 </div>
 </div>
 )}
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDeleteGroup}
 title="Disband Cell Group"
 message="Are you sure you want to completely disband this localized cell group from the directory? This action is permanent."
 />
 <Sheet open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
 <SheetContent className="sm:max-w-md overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
 <SheetDescription>{t("read_only_view_of_the_selected", "Read-only view of the selected record.")}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {viewRecord && Object.entries(viewRecord).filter(([k]) => k !== 'id' && k !== 'status').map(([key, value]) => {
 return (
 <div key={key} className="border-b border-primary/40 pb-2">
 <p className="text-sm font-medium text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
 <p className="mt-1 text-base text-foreground font-semibold">
 {key === 'leader' ? (
 <Link to="/religion/members" className="text-primary hover:underline">{String(value)}</Link>
 ) : typeof value === 'object' ? JSON.stringify(value) : String(value)}
 </p>
 </div>
 );
})}
 </div>
 </SheetContent>
 </Sheet>
 </div>
 );
}
