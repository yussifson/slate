import { useTranslation} from "react-i18next";
import React, { useState, useEffect} from "react";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { format} from "date-fns";
import { Clock, Plus, Activity, FileText, CheckCircle, MessageSquare} from "lucide-react";
import { Button} from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Input} from "@/components/ui/input";
import { Textarea} from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { toast} from "react-hot-toast";
import { powerSync} from "@/api/PowerSyncConnector";

const ACTIVITY_ICONS = {
 note: <FileText className="w-4 h-4 text-primary" />,
 call: <Activity className="w-4 h-4 text-primary" />,
 meeting: <Clock className="w-4 h-4 text-primary" />,
 status_change: <CheckCircle className="w-4 h-4 text-amber-500" />,
 other: <MessageSquare className="w-4 h-4 text-gray-500" />
};

export default function CaseTimeline({ caseData, user}) {
 const { t} = useTranslation();
 const queryClient = useQueryClient();
 const [showAdd, setShowAdd] = useState(false);
 const [newEntry, setNewEntry] = useState({ title: "", description: "", activity_type: "note"});

 const { data: timeline = [], isLoading} = useQuery({
 queryKey: ["case-timeline", caseData?.id],
 queryFn: async () => {
 const __res = await powerSync.execute(`SELECT * FROM case_timeline WHERE case_id = ? ORDER BY created_date DESC`, [caseData.id]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 
 if (error) throw error;
 return data;
},
 enabled: !!caseData?.id
});

 const addMutation = useMutation({
 mutationFn: async (entry) => {
 const { data, error} = await (async () => {
 const _p = {
 ...entry,
 case_id: caseData.id,
 case_title: caseData.title,
 company_id: user.company_id,
 created_by: user.id,
 logged_by_name: user.name || user.email.split("@")[0]
};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO case_timeline (${_k.join(', ')}) VALUES (${_pl})`, _v);
})();
 if (error) throw error;
 return data;
},
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["case-timeline", caseData.id]});
 setShowAdd(false);
 setNewEntry({ title: "", description: "", activity_type: "note"});
 toast.success("Timeline entry added");
},
 onError: (err) => {
 toast.error("Failed to add entry: " + err.message);
}
});

 const handleAdd = (e) => {
 e.preventDefault();
 if (!newEntry.title) return;
 addMutation.mutate(newEntry);
};

 if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">{t("loading_timeline", "Loading timeline...")}</div>;

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
 <Clock className="w-5 h-5 text-primary" /> {t("case_diary_timeline", "Case Diary & Timeline")}
 </h3>
 <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
 <Plus className="w-4 h-4" /> {t("add_entry", "Add Entry")}
 </Button>
 </div>
 <div className="relative border-l border-primary/40 ml-3 pl-6 space-y-8">
 {timeline.length === 0 ? (
 <div className="text-sm text-muted-foreground italic py-4">{t("no_timeline_events_recorded_ye", "No timeline events recorded yet.")}</div>
 ) : (
 timeline.map(entry => {
 return (
 <div key={entry.id} className="relative">
 <span className="absolute -left-10 w-8 h-8 rounded-full bg-background border border-primary/40 flex items-center justify-center shrink-0 z-10 ">
 {ACTIVITY_ICONS[entry.activity_type] || ACTIVITY_ICONS.other}
 </span>
 <div className="bg-card border border-primary/40 rounded-xl p-4 ">
 <div className="flex items-start justify-between gap-4 mb-2">
 <div>
 <h4 className="font-semibold text-foreground text-base">{entry.title}</h4>
 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
 <span className="font-medium text-foreground/80">{entry.logged_by_name}</span>
 <span>•</span>
 <span>{format(new Date(entry.created_date), "MMM d, yyyy h:mm a")}</span>
 <span className="capitalize px-2 py-0.5 bg-muted rounded-full text-[10px]">{entry.activity_type.replace('_', ' ')}</span>
 </div>
 </div>
 </div>
 {entry.description && (
 <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-3 bg-muted/30 p-3 rounded-lg border border-primary/40">
 {entry.description}
 </p>
 )}
 </div>
 </div>
 );
})
 )}
 </div>
 <Dialog open={showAdd} onOpenChange={setShowAdd}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{t("add_timeline_entry", "Add Timeline Entry")}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleAdd} className="space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold uppercase text-muted-foreground">{t("type", "Type")}</label>
 <Select value={newEntry.activity_type} onValueChange={(val) => setNewEntry(prev => ({...prev, activity_type: val}))}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="note">{t("note_update", "Note / Update")}</SelectItem>
 <SelectItem value="call">{t("phone_call", "Phone Call")}</SelectItem>
 <SelectItem value="meeting">{t("meeting", "Meeting")}</SelectItem>
 <SelectItem value="status_change">{t("status_change", "Status Change")}</SelectItem>
 <SelectItem value="other">{t("other", "Other")}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold uppercase text-muted-foreground">{t("title", "Title")}</label>
 <Input 
 value={newEntry.title} 
 onChange={(e) => setNewEntry(prev => ({...prev, title: e.target.value}))} 
 placeholder="E.g., Client initial consultation"
 required
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold uppercase text-muted-foreground">{t("description_notes", "Description / Notes")}</label>
 <Textarea 
 value={newEntry.description} 
 onChange={(e) => setNewEntry(prev => ({...prev, description: e.target.value}))} 
 placeholder="Detailed notes about the event..."
 className="min-h-[100px]"
 />
 </div>
 <DialogFooter>
 <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t("cancel", "Cancel")}</Button>
 <Button type="submit" disabled={addMutation.isPending || !newEntry.title}>
 {addMutation.isPending ? "Saving..." : "Save Entry"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 </div>
 );
}
