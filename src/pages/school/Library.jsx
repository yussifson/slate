import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Book, Search, Plus, BookOpen, Trash2, Clock, AlertCircle, MoreVertical, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Library() {
  const { t } = useTranslation();
  
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('book');
  const { data: categoryRecords = [] } = useIndustryRecords('library_category');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const DEFAULT_CATEGORIES = ['Science', 'Literature', 'Mathematics', 'History', 'Technology', 'Geography'];
  const categories = useMemo(() => {
    const custom = categoryRecords.map((r) => r.data?.name || r.search_text).filter(Boolean);
    return [...new Set([...DEFAULT_CATEGORIES, ...custom])];
  }, [categoryRecords]);

  const books = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [issueBookTarget, setIssueBookTarget] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');

  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '', ebook_url: '' });

  const handleCreateBook = () => {
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      return toast.error("Please enter book title, author, and ISBN number");
    }

    const payload = {
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      category: formData.category,
      total: parseInt(formData.total) || 1,
      available: parseInt(formData.total) || 1,
      borrowed: 0,
      cover_url: formData.cover_url,
      ebook_url: formData.ebook_url
    };

    if (editingId) {
      mutateRecord.mutate({
        id: editingId,
        recordType: 'book',
        payload: {
          ...payload,
          available: payload.total - (books.find(b => b.id === editingId)?.borrowed || 0),
          borrowed: books.find(b => b.id === editingId)?.borrowed || 0
        },
        status: 'active',
        searchText: `${formData.title} ${formData.author} ${formData.isbn}`
      }, {
        onSuccess: () => { toast.success('Book updated successfully!'); setShowModal(false); setEditingId(null); }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'book', payload, status: 'active', searchText: `${formData.title} ${formData.author} ${formData.isbn}`
      }, {
        onSuccess: () => { toast.success('Book cataloged successfully!'); setShowModal(false); }
      });
    }
  };

  const submitIssueBook = () => {
    if (!borrowerName.trim()) return toast.error("Please enter the borrower's name.");
    if (issueBookTarget.available <= 0) return toast.error("No copies available for checkout.");

    const updatedPayload = {
      ...issueBookTarget,
      available: issueBookTarget.available - 1,
      borrowed: issueBookTarget.borrowed + 1,
      current_borrower: borrowerName.trim(),
      issued_at: new Date().toISOString()};
    delete updatedPayload.id;
    delete updatedPayload.status;

    mutateRecord.mutate({
      id: issueBookTarget.id, recordType: 'book', payload: updatedPayload, status: issueBookTarget.status, searchText: `${issueBookTarget.title} ${issueBookTarget.author}`
    }, {
      onSuccess: () => { toast.success(`Issued "${issueBookTarget.title}" to ${borrowerName}!`); setIssueBookTarget(null); setBorrowerName(''); }
    });
  };

  const filtered = books.filter(b => b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()));

  const totalCopies = books.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalAvailable = books.reduce((acc, b) => acc + (b.available || 0), 0);
  const totalBorrowed = books.reduce((acc, b) => acc + (b.borrowed || 0), 0);

  return (
    <div className="space-y-8 font-dmsans max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-emerald-900 tracking-[-0.02em]">{t("library_catalog", "Library Catalog")}</h1>
          <p className="text-lg text-[#1E3A8A] dark:text-blue-400 font-medium mt-1">{t("manage_school_library_books_an", "Manage school library books and inventory")}</p>
        </div>
        <Button onClick={() => { setFormData({ title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '', ebook_url: '' }); setEditingId(null); setShowModal(true); }} className="gap-3 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold rounded-2xl h-14 px-8 text-lg font-semibold">
          <Plus className="w-6 h-6" /> {t("add_book", "Add Book")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#F0F4FF] dark:bg-blue-900/20 border-2 border-emerald-100 rounded-3xl p-8 flex items-center gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
          <div className="w-16 h-16 rounded-2xl bg-emerald-200 flex items-center justify-center text-[#1E3A8A] dark:text-blue-400">
            <Book className="w-8 h-8" />
          </div>
          <div>
            <p className="text-4xl font-extrabold text-emerald-900 tracking-[-0.02em]">{totalCopies}</p>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400 tracking-[0.04em]">{t("total_books", "Total Books")}</p>
          </div>
        </div>
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 flex items-center gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-[#1E3A8A] dark:text-blue-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-4xl font-extrabold text-emerald-900 tracking-[-0.02em]">{totalAvailable}</p>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#1E3A8A] dark:text-blue-400 tracking-[0.04em]">{t("available", "Available")}</p>
          </div>
        </div>
        <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl p-8 flex items-center gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none">
          <div className="w-16 h-16 rounded-2xl bg-orange-200 flex items-center justify-center text-orange-700">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-4xl font-extrabold text-orange-900 tracking-[-0.02em]">{totalBorrowed}</p>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600 tracking-[0.04em]">{t("borrowed", "Borrowed")}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="relative w-full max-w-lg mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
          <Input 
            placeholder="Search catalog title, author or ISBN..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-16 h-16 bg-[#F0F4FF] dark:bg-blue-900/20/50 border-emerald-200 text-lg rounded-2xl focus-visible:ring-emerald-400" 
          />
        </div>

        {isDbLoading ? (
          <div className="py-20 text-center text-[#1E3A8A] dark:text-blue-400 font-semibold text-xl">{t("loading_catalog", "Loading catalog...")}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-emerald-500 bg-[#F0F4FF] dark:bg-blue-900/20 rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-100 border-dashed">
            <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-extrabold text-2xl text-emerald-800 tracking-[-0.02em]">{t("library_catalog_is_empty", "Library catalog is empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(b => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={b.id} 
                className="bg-white border-2 border-emerald-100 rounded-3xl p-6 flex flex-col h-full hover:border-emerald-300 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
              >
                <div className="w-full aspect-[3/4] bg-[#F0F4FF] dark:bg-blue-900/20 rounded-2xl mb-6 flex items-center justify-center overflow-hidden relative">
                  {b.cover_url ? (
                    <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <Book className="w-16 h-16 text-emerald-200" />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button variant="secondary" size="icon" className="h-10 w-10 bg-white/90 hover:bg-white text-[#1E3A8A] dark:text-blue-400 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" onClick={() => {
                      setEditingId(b.id);
                      setFormData({ title: b.title, author: b.author, isbn: b.isbn, category: b.category, total: b.total, cover_url: b.cover_url || '', ebook_url: b.ebook_url || '' });
                      setShowModal(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-10 w-10 bg-white/90 hover:bg-white text-red-600 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" onClick={() => {
                      if(window.confirm('Delete this book?')) deleteRecord.mutate({ id: b.id, recordType: 'book' });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-extrabold text-xl text-emerald-900 leading-tight mb-2 line-clamp-2">{b.title}</h3>
                  <p className="text-[#1E3A8A] dark:text-blue-400 font-medium mb-4">{b.author}</p>
                </div>

                <div className="pt-4 border-t border-emerald-100 mt-auto">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 tracking-[0.04em]">{b.category}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${b.available > 0 ? 'bg-emerald-100 text-[#1E3A8A] dark:text-blue-400' : 'bg-red-100 text-red-700'}`}>
                      {b.available} Avail
                    </span>
                  </div>
                  <Button 
                    className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold font-semibold h-12" 
                    disabled={b.available === 0} 
                    onClick={() => setIssueBookTarget(b)}
                  >
                    Issue Book
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-xl p-10 space-y-6 border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 max-h-[90vh] overflow-y-auto shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-3xl font-extrabold text-emerald-900 flex items-center gap-3 tracking-[-0.02em]">
              <Plus className="w-8 h-8 text-[#1E3A8A] dark:text-blue-400" /> {editingId ? 'Edit Book' : 'Catalog Textbook'}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Book Title</label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-2 h-14 text-lg border-emerald-200 focus-visible:ring-emerald-500 rounded-xl bg-[#F0F4FF] dark:bg-blue-900/20/50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Author</label>
                <Input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="mt-2 h-14 text-lg border-emerald-200 focus-visible:ring-emerald-500 rounded-xl bg-[#F0F4FF] dark:bg-blue-900/20/50" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Category</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="mt-2 h-14 text-lg border-emerald-200 rounded-xl bg-[#F0F4FF] dark:bg-blue-900/20/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Total Copies</label>
                  <Input type="number" value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value })} className="mt-2 h-14 text-lg border-emerald-200 focus-visible:ring-emerald-500 rounded-xl bg-[#F0F4FF] dark:bg-blue-900/20/50" />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-6 mt-6 border-t border-emerald-100">
              <Button variant="outline" className="flex-1 h-14 text-lg font-semibold border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 h-14 text-lg font-semibold bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold rounded-xl" onClick={handleCreateBook}>{editingId ? 'Save Changes' : 'Catalog Book'}</Button>
            </div>
          </motion.div>
        </div>
      )}

      <Dialog open={!!issueBookTarget} onOpenChange={(open) => !open && setIssueBookTarget(null)}>
        <DialogContent className="rounded-3xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-none bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-emerald-900 tracking-[-0.02em]">Issue Book</DialogTitle>
            <DialogDescription className="text-[#1E3A8A] dark:text-blue-400 text-lg font-medium">Assign "{issueBookTarget?.title}" to a student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wide tracking-[0.04em]">Borrower Name (Student/Staff)</label>
              <Input value={borrowerName} onChange={e => setBorrowerName(e.target.value)} className="mt-2 h-14 text-lg border-emerald-200 focus-visible:ring-emerald-500 rounded-xl bg-[#F0F4FF] dark:bg-blue-900/20/50" placeholder="e.g. Jane Doe" autoFocus />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setIssueBookTarget(null)} className="h-12 px-6 rounded-xl border-emerald-200 text-[#1E3A8A] dark:text-blue-400 hover:bg-[#F0F4FF] dark:bg-blue-900/20 font-semibold">Cancel</Button>
            <Button onClick={submitIssueBook} disabled={!borrowerName.trim()} className="h-12 px-8 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold font-semibold">Confirm Issue</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
