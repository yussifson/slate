import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Book, Search, Plus, BookOpen, Trash2, Clock, AlertCircle, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import AddOptionInline from "@/components/shared/AddOptionInline";
import { ViewModeToggle, BookGridCard } from '@/components/school/SchoolViewKit';

export default function Library() {
  const { t } = useTranslation();
  // Supabase Real-time Sync Hooks
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('book');
  const { data: categoryRecords = [] } = useIndustryRecords('library_category');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const DEFAULT_CATEGORIES = ['Science', 'Literature', 'Mathematics', 'History', 'Technology', 'Geography'];
  const categories = useMemo(() => {
    const custom = categoryRecords.map((r) => r.data?.name || r.search_text).filter(Boolean);
    return [...new Set([...DEFAULT_CATEGORIES, ...custom])];
  }, [categoryRecords]);

  const books = dbRecords.map(r => ({
    id: r.id,
    status: r.status || 'Active',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);

  // New Issue Book State
  const [issueBookTarget, setIssueBookTarget] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Form State
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '', ebook_url: ''
  });

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
        onSuccess: () => {
          toast.success('Book updated successfully!');
          setShowModal(false);
          setEditingId(null);
          setFormData({ title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '', ebook_url: '' });
        },
        onError: (err) => {
          toast.error('Failed to update book: ' + err.message);
        }
      });
    } else {
      mutateRecord.mutate({
        recordType: 'book',
        payload,
        status: 'active',
        searchText: `${formData.title} ${formData.author} ${formData.isbn}`
      }, {
        onSuccess: () => {
          toast.success('Book cataloged successfully!');
          setShowModal(false);
          setFormData({ title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '', ebook_url: '' });
        },
        onError: (err) => {
          toast.error('Failed to catalog book: ' + err.message);
        }
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
      issued_at: new Date().toISOString(),
    };
    delete updatedPayload.id;
    delete updatedPayload.status;

    mutateRecord.mutate({
      id: issueBookTarget.id,
      recordType: 'book',
      payload: updatedPayload,
      status: issueBookTarget.status,
      searchText: `${issueBookTarget.title} ${issueBookTarget.author}`
    }, {
      onSuccess: () => {
        toast.success(`Issued "${issueBookTarget.title}" to ${borrowerName}!`);
        setIssueBookTarget(null);
        setBorrowerName('');
      }
    });
  };

  const handleDeleteBook = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'book' }, {
      onSuccess: () => {
        toast.success('Book catalog index removed!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove catalog item: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCopies = books.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalAvailable = books.reduce((acc, b) => acc + (b.available || 0), 0);
  const totalBorrowed = books.reduce((acc, b) => acc + (b.borrowed || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("library_catalog", "Library Catalog")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "manage_school_library_books_an",
            "Manage school library books and inventory"
          )}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4" /> {t("add_book", "Add Book")}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Book className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{totalCopies}</p>
            <p className="text-xs text-muted-foreground">{t("total_books", "Total Books")}</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{totalAvailable}</p>
            <p className="text-xs text-muted-foreground">{t("available", "Available")}</p>
          </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{totalBorrowed}</p>
            <p className="text-xs text-muted-foreground">{t("borrowed", "Borrowed")}</p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search catalog title, author or ISBN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_catalog", "Loading catalog...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground bg-card">
              <Book className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-blue-600" />
              <p className="font-semibold text-lg text-card-foreground">{t("library_catalog_is_empty", "Library catalog is empty")}</p>
              <p className="text-xs mt-1 font-medium">{t(
                "record_textbooks_reference_dic",
                "Record textbooks, reference dictionaries, or science manuals using the button above."
              )}</p>
            </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
          {filtered.map(b => (
            <BookGridCard
              key={b.id}
              book={b}
              onView={() => setViewDetails(b)}
              onIssue={() => setIssueBookTarget(b)}
              onEdit={() => {
                setEditingId(b.id);
                setFormData({
                  title: b.title,
                  author: b.author,
                  isbn: b.isbn,
                  category: b.category,
                  total: b.total,
                  cover_url: b.cover_url || '',
                  ebook_url: b.ebook_url || ''
                });
                setShowModal(true);
              }}
              onDelete={() => setDeleteTargetId(b.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("book_title", "Book Title")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("author", "Author")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("category", "Category")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("total_copies", "Total Copies")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("available", "Available")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                        <p className="font-semibold text-card-foreground">{b.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t("isbn", "ISBN:")} {b.isbn}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{b.author}</td>
                    <td className="px-6 py-4">
                      <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs font-medium">
                        {b.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-foreground font-medium">{b.total}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${b.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.available}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setViewDetails(b)}>{t("view_details", "View Details")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIssueBookTarget(b)} disabled={b.available === 0}>{t("issue_book", "Issue Book")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingId(b.id);
                            setFormData({
                              title: b.title,
                              author: b.author,
                              isbn: b.isbn,
                              category: b.category,
                              total: b.total,
                              cover_url: b.cover_url || '',
                              ebook_url: b.ebook_url || ''
                            });
                            setShowModal(true);
                          }}>{t("edit", "Edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 font-medium" onClick={() => setDeleteTargetId(b.id)}>{t("delete", "Delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> {editingId ? 'Edit Book' : 'Catalog Textbook'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("book_title", "Book Title")}</label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Introduction to Algorithms"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("author", "Author")}</label>
                <Input
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. Thomas H. Cormen"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("isbn_number", "ISBN Number")}</label>
                <Input
                  value={formData.isbn}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  className="mt-1"
                  placeholder="e.g. 978-0262033848"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("category", "Category")}</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <AddOptionInline
                        onAdd={(v) => {
                          mutateRecord.mutate({
                            recordType: 'library_category',
                            payload: { name: v },
                            searchText: v,
                            status: 'active',
                          });
                          setFormData({ ...formData, category: v });
                        }}
                        placeholder="New category..."
                      />
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("total_copies_stocked", "Total Copies Stocked")}</label>
                  <Input
                    type="number"
                    value={formData.total}
                    onChange={e => setFormData({ ...formData, total: e.target.value })}
                    className="mt-1"
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("cover_image_url", "Cover Image URL")}</label>
                  <Input
                    value={formData.cover_url}
                    onChange={e => setFormData({ ...formData, cover_url: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. https://example.com/cover.jpg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("e_book_url", "E-Book / PDF Link")}</label>
                  <Input
                    value={formData.ebook_url}
                    onChange={e => setFormData({ ...formData, ebook_url: e.target.value })}
                    className="mt-1"
                    placeholder="e.g. https://drive.google.com/..."
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingId(null); setFormData({ title: '', author: '', isbn: '', category: 'Science', total: 10, cover_url: '', ebook_url: '' }); }}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateBook}>{editingId ? 'Save Changes' : 'Catalog Book'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      <Dialog open={!!issueBookTarget} onOpenChange={(open) => !open && setIssueBookTarget(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>Assign a book to a student or staff member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-semibold">{issueBookTarget?.title}</p>
              <p className="text-xs text-muted-foreground">Available copies: {issueBookTarget?.available}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Borrower Name (Student/Staff)</label>
              <Input
                value={borrowerName}
                onChange={e => setBorrowerName(e.target.value)}
                className="mt-1"
                placeholder="e.g. Jane Doe"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIssueBookTarget(null)}>Cancel</Button>
            <Button onClick={submitIssueBook} disabled={!borrowerName.trim()}>Issue Book</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteBook}
        title="Retract Library Book"
        message="Are you sure you want to completely remove this book from the catalog listing? All dynamic counts will adjust immediately."
      />
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("book_details", "Book Details")}</SheetTitle>
            <SheetDescription>{t(
              "detailed_catalog_information_f",
              "Detailed catalog information for this book."
            )}</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 shrink-0 rounded-md bg-blue-50 overflow-hidden flex items-center justify-center text-blue-600 font-bold text-xl border border-border">
                  {viewDetails.cover_url ? (
                    <img src={viewDetails.cover_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <Book className="w-8 h-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-card-foreground">{viewDetails.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{viewDetails.author}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("isbn", "ISBN")}</p>
                  <p className="font-mono text-sm text-foreground mt-1">{viewDetails.isbn}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("category", "Category")}</p>
                  <p className="font-medium text-foreground mt-1">{viewDetails.category}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("total_copies", "Total Copies")}</p>
                  <p className="font-medium text-foreground mt-1">{viewDetails.total}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("status", "Status")}</p>
                  <span className={`inline-block mt-1 font-bold px-2.5 py-0.5 rounded-full text-xs ${viewDetails.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {viewDetails.available > 0 ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("available_copies", "Available Copies")}</p>
                  <p className="font-bold text-2xl text-green-600 mt-1">{viewDetails.available}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("borrowed", "Borrowed")}</p>
                  <p className="font-bold text-2xl text-orange-600 mt-1">{viewDetails.borrowed}</p>
                </div>
              </div>
              {viewDetails.ebook_url && (
                <div className="pt-2 border-t border-border mt-4">
                  <a href={viewDetails.ebook_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold py-3 rounded-xl transition-colors">
                    <Book className="w-5 h-5" />
                    {t("read_e_book_now", "Read E-Book Now")}
                  </a>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
