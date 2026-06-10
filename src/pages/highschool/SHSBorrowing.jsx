import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, BookUp, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSBorrowing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [borrowings, setBorrowings] = useState([]);
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [newCheckout, setNewCheckout] = useState({
    studentId: '',
    bookId: '',
    dueDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 14); // Default 2 weeks
      return d.toISOString().split('T')[0];
    })()
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [borrowData, bookData, studentData] = await Promise.all([
        base44.getEntities('shs_library_borrow', user?.company_id),
        base44.getEntities('shs_library_book', user?.company_id),
        base44.getEntities('shs_student', user?.company_id)
      ]);
      setBorrowings(borrowData.filter(b => b.status === 'Borrowed'));
      setBooks(bookData);
      setStudents(studentData.filter(s => s.status === 'Active'));
    } catch (error) {
      console.error('Failed to fetch borrowing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const selectedStudent = students.find(s => s.id === newCheckout.studentId);
      const selectedBook = books.find(b => b.id === newCheckout.bookId);

      if (!selectedStudent || !selectedBook) return;

      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_library_borrow',
        title: `Checkout: ${selectedBook.title} - ${selectedStudent.title}`,
        case_number: `BRW-${Math.floor(Math.random() * 100000)}`,
        status: 'Borrowed',
        data: {
          ...newCheckout,
          studentName: selectedStudent.title,
          studentIndex: selectedStudent.data?.indexNumber || selectedStudent.case_number,
          bookTitle: selectedBook.title,
          bookIsbn: selectedBook.data?.isbn,
          borrowDate: new Date().toISOString().split('T')[0]
        }
      };
      
      await base44.createEntity(payload);

      // Decrement available quantity
      const newQty = Math.max(0, (selectedBook.data?.availableQuantity ?? selectedBook.data?.quantity) - 1);
      await base44.updateEntity(selectedBook.id, {
        data: {
          ...selectedBook.data,
          availableQuantity: newQty
        }
      });

      setIsCheckoutModalOpen(false);
      setNewCheckout({ studentId: '', bookId: '', dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; })() });
      fetchData();
    } catch (error) {
      console.error('Failed to checkout book:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isOverdue = (dateString) => {
    return new Date(dateString) < new Date(new Date().toISOString().split('T')[0]);
  };

  const filteredBorrowings = borrowings.filter(b => 
    b.data?.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.data?.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            Book Checkouts
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Issue library books to students and set return dates.
          </p>
        </div>
        
        <Button onClick={() => setIsCheckoutModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white shadow-md shadow-emerald-500/20">
          <Plus className="w-4 h-4" /> Issue Book
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Active Borrowings</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
              <Input 
                placeholder="Search student or book..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading active records...</div>
          ) : filteredBorrowings.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <BookUp className="w-8 h-8 text-primary dark:text-primary" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No active checkouts</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">All books are currently returned or none have been issued.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Trans ID</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Book Title</th>
                    <th className="px-6 py-4">Borrowed On</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBorrowings.map((record) => {
                    const overdue = isOverdue(record.data?.dueDate);
                    return (
                      <tr key={record.id} className={`hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors ${overdue ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{record.case_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{record.data?.studentName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">{record.data?.studentIndex}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200">{record.data?.bookTitle}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">ISBN: {record.data?.bookIsbn || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {record.data?.borrowDate}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium flex items-center gap-1.5 ${overdue ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300 dark:text-slate-200'}`}>
                            {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                            {record.data?.dueDate}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant="outline" className={
                            overdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }>
                            {overdue ? 'Overdue' : 'Borrowed'}
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

      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Issue Book</DialogTitle>
              <DialogDescription className="text-primary/10 dark:text-primary/70">
                Checkout a book from the library to a student.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Select Student</label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200"
                value={newCheckout.studentId}
                onChange={e => setNewCheckout({...newCheckout, studentId: e.target.value})}
              >
                <option value="">Search and select student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.data?.indexNumber || s.case_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Select Book (Available Only)</label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
                value={newCheckout.bookId}
                onChange={e => setNewCheckout({...newCheckout, bookId: e.target.value})}
              >
                <option value="">Search and select book...</option>
                {books.filter(b => (b.data?.availableQuantity ?? b.data?.quantity) > 0).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} (Available: {b.data?.availableQuantity ?? b.data?.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Due Date
              </label>
              <Input 
                type="date"
                className="bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                value={newCheckout.dueDate}
                onChange={e => setNewCheckout({...newCheckout, dueDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCheckoutModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout} 
              disabled={!newCheckout.studentId || !newCheckout.bookId || isProcessing}
              className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold"
            >
              {isProcessing ? 'Processing...' : 'Complete Checkout'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
