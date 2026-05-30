import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Heart, HandHeart, CheckCircle, Search, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function Prayers() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('prayer');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const prayers = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: 'Anonymous',
    request: ''
  });


  const openEdit = (record) => {
    setEditRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const handleCreatePrayer = () => {
    if (!formData.request.trim()) {
      return toast.error("Please enter your prayer request details");
    }

    const payload = {
      name: formData.name.trim() || 'Anonymous',
      request: formData.request,
      prayersCount: 0,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };

    mutateRecord.mutate({
      ...(editRecord ? { id: editRecord.id } : {}),
      recordType: 'prayer',
      payload,
      status: 'Active',
      searchText: `${payload.name} ${formData.request}`
    }, {
      onSuccess: () => {
        toast.success('Prayer request submitted successfully!');
        setShowModal(false);
        setEditRecord(null);
        setFormData({ name: 'Anonymous', request: '' });
      },
      onError: (err) => {
        toast.error('Failed to submit request: ' + err.message);
      }
    });
  };

  const handleIncrementPrayers = (prayer) => {
    const updatedPayload = {
      ...prayer,
      prayersCount: (prayer.prayersCount || 0) + 1
    };
    delete updatedPayload.id;

    mutateRecord.mutate({
      id: prayer.id,
      recordType: 'prayer',
      payload: updatedPayload,
      status: prayer.status,
      searchText: `${prayer.name} ${prayer.request}`
    }, {
      onSuccess: () => {
        toast.success('Interceded for this prayer request!');
      }
    });
  };

  const handleMarkAnswered = (prayer) => {
    const updatedPayload = { ...prayer };
    delete updatedPayload.id;

    mutateRecord.mutate({
      id: prayer.id,
      recordType: 'prayer',
      payload: updatedPayload,
      status: 'Answered',
      searchText: `${prayer.name} ${prayer.request}`
    }, {
      onSuccess: () => {
        toast.success('Praise report! Marked as Answered.');
      }
    });
  };

  const handleDeletePrayer = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'prayer' }, {
      onSuccess: () => {
        toast.success('Prayer request retracted successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to retract request: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = prayers.filter(p =>
    p.request?.toLowerCase().includes(search.toLowerCase()) ||
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("prayer_requests", "Prayer Requests")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "submit_and_manage_congregation",
            "Submit and manage congregational prayer needs"
          )}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <HandHeart className="w-4 h-4" /> {t("submit_request", "Submit Request")}
        </Button>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search prayer requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-none" />
        </div>
      </div>
      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading_prayer_board", "Loading prayer board...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <HandHeart className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-purple-600" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_prayer_requests_listed", "No prayer requests listed")}</p>
          <p className="text-xs mt-1">{t(
            "be_the_first_to_list_a_family_",
            "Be the first to list a family petition, health intercession, or praise report using the button above."
          )}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(prayer => {
            return (
              <div key={prayer.id} className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden group">
                {prayer.status === 'Answered' && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                    {t("answered", "Answered")}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {prayer.name === 'Anonymous' ? (
                      <span className="font-bold text-card-foreground">{prayer.name}</span>
                    ) : (
                      <Link to="/church/members" className="font-bold text-primary hover:underline">{prayer.name}</Link>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{prayer.date}</span>
                  </div>
                  <p className="text-foreground text-lg leading-relaxed font-medium">"{prayer.request}"</p>
                </div>
                <div className="flex sm:flex-col gap-2 justify-end sm:justify-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border sm:pl-6 min-w-[150px]">
                  {prayer.status === 'Active' ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleIncrementPrayers(prayer)}
                        className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Heart className="w-4 h-4" /> {t("praying", "Praying (")}{prayer.prayersCount || 0})
                                            </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleMarkAnswered(prayer)}
                        className="gap-2 text-muted-foreground hover:text-green-600 hover:border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4" /> {t("mark_answered", "Mark Answered")}
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-green-600 h-full py-2">
                      <Heart className="w-8 h-8 mb-1 fill-green-600 text-green-600" />
                      <span className="text-xs font-bold uppercase tracking-widest">{t("praise_report", "Praise Report")}</span>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity w-full mt-auto flex justify-center">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewRecord(prayer)}>
                        <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(prayer)}>
                        <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTargetId(prayer.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> {t("retract", "Retract")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-purple-600" /> {t("submit_prayer_petition", "Submit Prayer Petition")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("your_name_optional", "Your Name (Optional)")}</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="Anonymous"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("petition_request_details", "Petition / Request Details")}</label>
                <textarea
                  value={formData.request}
                  onChange={e => setFormData({ ...formData, request: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="e.g. Please pray for fast healing, professional wisdom, family breakthroughs..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditRecord(null); }}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreatePrayer}>{editRecord ? 'Update' : 'Submit Petition'}</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeletePrayer}
        title="Retract Prayer Request"
        message="Are you sure you want to completely remove this prayer request from the list? This will remove all counts permanently."
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
                <div key={key} className="border-b border-border pb-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="mt-1 text-base text-foreground font-semibold">
                    {key === 'name' && value !== 'Anonymous' ? (
                      <Link to="/church/members" className="text-primary hover:underline">{String(value)}</Link>
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
