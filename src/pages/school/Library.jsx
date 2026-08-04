import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Book, Search, Plus, BookOpen, Trash2, Clock, MoreHorizontal, Edit2, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function Library() {
  const { t } = useTranslation();
  
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('school_book');
  const { data: categoryRecords = [] } = useIndustryRecords('school_library_category');
  const { data: issueRecords = [] } = useIndustryRecords('school_book_issue');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const DEFAULT_CATEGORIES = ['Science', 'Literature', 'Mathematics', 'History', 'Technology', 'Geography'];
  const categories = useMemo(() => {
    const custom = categoryRecords.map(r => r.data?.name || r.search_text).filter(Boolean);
    return [...new Set([...DEFAULT_CATEGORIES, ...custom])];
  }, [categoryRecords]);

  const books = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));
  const issuedBooks = issueRecords.map(r => ({ id: r.id, status: r.status, ...r.data }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [issueBookTarget, setIssueBookTarget] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerType, setBorrowerType] = useState('Student');
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '' });
  const [activeTab, setActiveTab] = useState('catalog');

  const handleCreateBook = () => {
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) return toast.error("Please enter book title, author, and ISBN");
    const payload = { title: formData.title, author: formData.author, isbn: formData.isbn, category: formData.category, total: parseInt(formData.total) || 1, available: parseInt(formData.total) || 1, cover_url: formData.cover_url };
    if (editingId) {
      const existingBook = books.find(b => b.id === editingId);
      const borrowedCount = (existingBook.total || 0) - (existingBook.available || 0);
      mutateRecord.mutate({ id: editingId, recordType: 'school_book', payload: { ...payload, available: payload.total - borrowedCount }, status: 'active', searchText: `${formData.title} ${formData.author} ${formData.isbn}` }, { onSuccess: () => { toast.success('Book updated!'); setShowModal(false); setEditingId(null); } });
    } else {
      mutateRecord.mutate({ recordType: 'school_book', payload, status: 'active', searchText: `${formData.title} ${formData.author} ${formData.isbn}` }, { onSuccess: () => { toast.success('Book cataloged!'); setShowModal(false); } });
    }
  };

  const submitIssueBook = () => {
    if (!borrowerName.trim()) return toast.error("Please enter the borrower's name.");
    if (issueBookTarget.available <= 0) return toast.error("No copies available.");
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const issuePayload = { book_id: issueBookTarget.id, book_title: issueBookTarget.title, borrower_name: borrowerName.trim(), borrower_type: borrowerType, issue_date: issueDate.toISOString().split('T')[0], due_date: dueDate.toISOString().split('T')[0], return_date: null, status: 'Issued' };
    const updatedBookPayload = { ...issueBookTarget, available: issueBookTarget.available - 1 };
    delete updatedBookPayload.id; delete updatedBookPayload.status;
    mutateRecord.mutate({ id: issueBookTarget.id, recordType: 'school_book', payload: updatedBookPayload, status: issueBookTarget.status, searchText: `${issueBookTarget.title} ${issueBookTarget.author}` });
    mutateRecord.mutate({ recordType: 'school_book_issue', payload: issuePayload, status: 'active', searchText: `${borrowerName} ${issueBookTarget.title}` }, { onSuccess: () => { toast.success(`Issued "${issueBookTarget.title}" to ${borrowerName}!`); setIssueBookTarget(null); setBorrowerName(''); } });
  };

  const submitReturnBook = (issueRecord) => {
    const book = books.find(b => b.id === issueRecord.book_id);
    if (book) {
      const updatedBookPayload = { ...book, available: (book.available || 0) + 1 };
      delete updatedBookPayload.id; delete updatedBookPayload.status;
      mutateRecord.mutate({ id: book.id, recordType: 'school_book', payload: updatedBookPayload, status: book.status, searchText: `${book.title} ${book.author}` });
    }
    const updatedIssuePayload = { ...issueRecord, return_date: new Date().toISOString().split('T')[0], status: 'Returned' };
    delete updatedIssuePayload.id;
    mutateRecord.mutate({ id: issueRecord.id, recordType: 'school_book_issue', payload: updatedIssuePayload, status: 'inactive', searchText: `${issueRecord.borrower_name} ${issueRecord.book_title}` }, { onSuccess: () => toast.success(`Book returned by ${issueRecord.borrower_name}!`) });
  };

  const filtered = books.filter(b => b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()));
  const activeIssues = issuedBooks.filter(ib => ib.status === 'Issued' && (ib.borrower_name?.toLowerCase().includes(search.toLowerCase()) || ib.book_title?.toLowerCase().includes(search.toLowerCase())));

  const totalCopies = books.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalAvailable = books.reduce((acc, b) => acc + (b.available || 0), 0);
  const totalBorrowed = totalCopies - totalAvailable;

  return (
    <SchoolPageShell
      title="Library Catalog"
      subtitle="Manage school library books and inventory"
      breadcrumb={['School', 'Library']}
      actions={
        <Button onClick={() => { setFormData({ title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '' }); setEditingId(null); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Add Book
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Books', value: totalCopies, icon: Book, color: 'bg-indigo-500/10 text-indigo-600' },
          { label: 'Available', value: totalAvailable, icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Borrowed', value: totalBorrowed, icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex rounded-lg bg-muted/50 p-1 gap-1">
            {['catalog', 'issued'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{tab === 'catalog' ? 'Book Catalog' : 'Issued Books'}</button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50 h-9 text-sm" />
          </div>
        </div>
      </div>

      {/* Content */}
      {isDbLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading catalog...</div>
      ) : activeTab === 'catalog' ? (
        filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
            <Book className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Library catalog is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(b => (
              <motion.div key={b.id} whileHover={{ y: -2 }} className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col group">
                {/* Cover */}
                <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
                  {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" /> : <Book className="w-12 h-12 text-muted-foreground/30" />}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 bg-card/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-indigo-600 border border-border/50 shadow-sm" onClick={() => { setEditingId(b.id); setFormData({ title: b.title, author: b.author, isbn: b.isbn, category: b.category, total: b.total, cover_url: b.cover_url || '' }); setShowModal(true); }}><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="w-8 h-8 bg-card/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-rose-600 border border-border/50 shadow-sm" onClick={() => { if (window.confirm('Delete this book?')) deleteRecord.mutate({ id: b.id, recordType: 'school_book' }); }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-1">{b.title}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-0.5">{b.author}</p>
                  <p className="text-xs text-muted-foreground mb-3">ISBN: {b.isbn}</p>
                  <div className="mt-auto flex items-center justify-between mb-3">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium">{b.category}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${b.available > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>{b.available} avail.</span>
                  </div>
                  <Button className="w-full h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white" disabled={b.available <= 0} onClick={() => setIssueBookTarget(b)}>Issue Book</Button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {activeIssues.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed border-border py-16 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No books currently issued</p>
            </div>
          ) : activeIssues.map(issue => (
            <div key={issue.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <h4 className="font-semibold text-foreground">{issue.book_title}</h4>
                <p className="text-sm text-muted-foreground">Borrowed by: <span className="font-medium text-foreground">{issue.borrower_name}</span> ({issue.borrower_type})</p>
                <p className="text-sm text-muted-foreground">Due: <span className={new Date(issue.due_date) < new Date() ? 'text-rose-600 font-semibold' : ''}>{issue.due_date}</span></p>
              </div>
              <Button onClick={() => submitReturnBook(issue)} className="h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <RotateCcw className="w-4 h-4 mr-2" /> Return
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Book' : 'Catalog Book'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1.5 h-10" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Author *</label><Input value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="mt-1.5 h-10" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ISBN *</label><Input value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="mt-1.5 h-10" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                    <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Copies</label><Input type="number" value={formData.total} onChange={e => setFormData({...formData, total: e.target.value})} className="mt-1.5 h-10" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleCreateBook}>{editingId ? 'Save Changes' : 'Catalog Book'}</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Issue Book Dialog */}
      <Dialog open={!!issueBookTarget} onOpenChange={open => !open && setIssueBookTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>Assign "{issueBookTarget?.title}" to a borrower.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Borrower Name</label><Input value={borrowerName} onChange={e => setBorrowerName(e.target.value)} className="mt-1.5 h-10" placeholder="e.g. Jane Doe" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Borrower Type</label>
              <Select value={borrowerType} onValueChange={v => setBorrowerType(v)}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Student">Student</SelectItem><SelectItem value="Teacher">Teacher</SelectItem><SelectItem value="Staff">Staff</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIssueBookTarget(null)}>Cancel</Button>
            <Button onClick={submitIssueBook} disabled={!borrowerName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">Confirm Issue</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
