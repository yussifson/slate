import React, { useState, useEffect} from 'react';
import { useTranslation} from 'react-i18next';
import { useAuth} from '@/lib/AuthContext';
import { base44} from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { Search, Plus, BookOpen, Hash, Tag, Layers} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import { Badge} from '@/components/ui/badge';

export default function SHSBooks() {
 const { t} = useTranslation();
 const { user} = useAuth();
 
 const [books, setBooks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newBook, setNewBook] = useState({
 title: '',
 author: '',
 isbn: '',
 category: 'Textbook', // Textbook, Fiction, Reference, Journal
 quantity: 1,
 rackLocation: ''
});

 const fetchBooks = async () => {
 setLoading(true);
 try {
 const records = await base44.getEntities('shs_library_book', user?.company_id);
 setBooks(records);
} catch (error) {
 console.error('Failed to fetch books:', error);
} finally {
 setLoading(false);
}
};

 useEffect(() => {
 if (user?.company_id) {
 fetchBooks();
}
}, [user]);

 const handleAddBook = async () => {
 try {
 const payload = {
 company_id: user?.company_id,
 case_type: 'shs_library_book',
 title: newBook.title,
 case_number: `LIB-${Math.floor(Math.random() * 100000)}`,
 status: 'Available',
 data: {
 ...newBook,
 quantity: parseInt(newBook.quantity) || 1,
 availableQuantity: parseInt(newBook.quantity) || 1
}
};
 
 await base44.createEntity(payload);
 setIsAddModalOpen(false);
 setNewBook({ title: '', author: '', isbn: '', category: 'Textbook', quantity: 1, rackLocation: ''});
 fetchBooks();
} catch (error) {
 console.error('Failed to add book:', error);
}
};

 const filteredBooks = books.filter(b => 
 b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 b.data?.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 b.data?.isbn?.includes(searchQuery)
 );

 return (
 <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
 
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent tracking-[-0.02em]">
 Library Catalog
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-1 text-sm font-medium">
 Manage school library inventory, categories, and stock locations.
 </p>
 </div>
 
 <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white -emerald-500/20">
 <Plus className="w-4 h-4" /> Add Book
 </Button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="rounded-2xl border-none bg-white dark:bg-card/40 dark:bg-card/60 dark:bg-card/60 backdrop-blur-xl ring-1 ring-primary/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardContent className="p-5 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
 <BookOpen className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#71717a] dark:text-gray-400">Unique Titles</p>
 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-[-0.02em]">{books.length}</h3>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="rounded-3xl border-none bg-white dark:bg-card/40 dark:bg-card/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <CardHeader className="border-b border-primary/40 dark:border-primary/40 dark:border-primary/40 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Inventory Management</CardTitle>
 </div>
 
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <Input 
 placeholder="Search title, author, or ISBN..." 
 className="pl-9 h-9 bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading catalog...</div>
 ) : filteredBooks.length === 0 ? (
 <div className="p-16 text-center">
 <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
 <Layers className="w-8 h-8 text-primary dark:text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">No books found</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Add physical books to your library inventory.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider tracking-[0.04em]">
 <tr>
 <th className="px-6 py-4 rounded-tl-xl">Book Details</th>
 <th className="px-6 py-4">Category</th>
 <th className="px-6 py-4">Location</th>
 <th className="px-6 py-4 text-center">Availability</th>
 <th className="px-6 py-4 text-right rounded-tr-xl">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredBooks.map((book) => {
 const total = book.data?.quantity || 1;
 const available = book.data?.availableQuantity ?? total;
 const availabilityColor = available > 0 ? 'text-primary' : 'text-rose-600';
 return (
 <tr key={book.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-semibold text-slate-800 dark:text-slate-100">{book.title}</p>
 <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-[0.04em]">
 <span className="font-medium text-slate-600 dark:text-slate-300">By {book.data?.author || 'Unknown'}</span>
 <span className="text-slate-300">•</span>
 <span className="flex items-center gap-2 font-mono"><Hash className="w-3 h-3"/> {book.data?.isbn || 'N/A'}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2.5">
 <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
 <span className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{book.data?.category}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-primary/40 dark:border-primary/40">
 {book.data?.rackLocation || 'Unassigned'}
 </Badge>
 </td>
 <td className="px-6 py-4 text-center">
 <p className={`font-black text-lg ${availabilityColor}`}>{available} <span className="text-sm font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400">/ {total}</span></p>
 </td>
 <td className="px-6 py-4 text-right">
 <Badge variant="outline" className={
 available > 0 ? 'bg-slate-50 dark:bg-slate-800/50 text-primary/90 border-primary/20' : 'bg-rose-50 text-rose-700 border-rose-200'
}>
 {available > 0 ? 'Available' : 'Out of Stock'}
 </Badge>
 </td>
 </tr>
 );
})}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>

 <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
 <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none ">
 <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
 <DialogHeader>
 <DialogTitle className="text-2xl font-black tracking-[-0.02em]">Add to Catalog</DialogTitle>
 <DialogDescription className="text-primary/10 dark:text-primary/70">
 Register a new book title into the school library.
 </DialogDescription>
 </DialogHeader>
 </div>
 
 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Book Title</label>
 <Input 
 placeholder="e.g. Essential Mathematics for SHS"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newBook.title}
 onChange={e => setNewBook({...newBook, title: e.target.value})}
 />
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Author(s)</label>
 <Input 
 placeholder="e.g. J.K. Rowling"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newBook.author}
 onChange={e => setNewBook({...newBook, author: e.target.value})}
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">ISBN</label>
 <Input 
 placeholder="e.g. 978-3-16-148410-0"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newBook.isbn}
 onChange={e => setNewBook({...newBook, isbn: e.target.value})}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Category</label>
 <select 
 className="w-full h-11 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 bg-white dark:bg-card/40 dark:bg-card px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newBook.category}
 onChange={e => setNewBook({...newBook, category: e.target.value})}
 >
 <option value="Textbook">Textbook</option>
 <option value="Fiction">Fiction / Novel</option>
 <option value="Reference">Reference</option>
 <option value="Journal">Journal</option>
 <option value="Past Questions">Past Questions</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Initial Quantity</label>
 <Input 
 type="number"
 min="1"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl h-11 font-semibold text-lg hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newBook.quantity}
 onChange={e => setNewBook({...newBook, quantity: e.target.value})}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider tracking-[0.04em]">Rack / Shelf Location</label>
 <Input 
 placeholder="e.g. Section B, Shelf 4"
 className="bg-white dark:bg-card/40 dark:bg-card border-primary/40 dark:border-primary/40 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 value={newBook.rackLocation}
 onChange={e => setNewBook({...newBook, rackLocation: e.target.value})}
 />
 </div>
 </div>
 
 <div className="p-4 bg-white dark:bg-card/40 dark:bg-card border-t border-primary/40 dark:border-primary/40 dark:border-primary/40 flex justify-end gap-3 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
 Cancel
 </Button>
 <Button 
 onClick={handleAddBook} 
 disabled={!newBook.title || !newBook.quantity}
 className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-semibold"
 >
 Add to Catalog
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
