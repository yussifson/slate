import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, BookDown, CheckCircle2, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSReturns() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [borrowings, setBorrowings] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [returnCondition, setReturnCondition] = useState('Good'); // Good, Damaged, Lost
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [borrowData, bookData] = await Promise.all([
        base44.getEntities('shs_library_borrow', user?.company_id),
        base44.getEntities('shs_library_book', user?.company_id)
      ]);
      setBorrowings(borrowData);
      setBooks(bookData);
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

  const handleProcessReturn = async () => {
    setIsProcessing(true);
    try {
      const record = borrowings.find(b => b.id === selectedRecordId);
      if (!record) return;

      // Find the associated book to increment quantity back if not lost
      const associatedBook = books.find(b => b.title === record.data?.bookTitle && b.data?.isbn === record.data?.bookIsbn);
      
      // Update borrowing record
      await base44.updateEntity(record.id, {
        status: 'Returned',
        data: {
          ...record.data,
          returnDate: new Date().toISOString().split('T')[0],
          returnCondition
        }
      });

      // Increment available quantity
      if (associatedBook && returnCondition !== 'Lost') {
        const newQty = (associatedBook.data?.availableQuantity ?? associatedBook.data?.quantity) + 1;
        await base44.updateEntity(associatedBook.id, {
          data: {
            ...associatedBook.data,
            availableQuantity: newQty
          }
        });
      }

      setIsReturnModalOpen(false);
      setSelectedRecordId(null);
      setReturnCondition('Good');
      fetchData();
    } catch (error) {
      console.error('Failed to process return:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openReturnModal = (id) => {
    setSelectedRecordId(id);
    setIsReturnModalOpen(true);
  };

  const activeBorrowings = borrowings.filter(b => b.status === 'Borrowed');
  const returnedBorrowings = borrowings.filter(b => b.status === 'Returned');

  const filteredActive = activeBorrowings.filter(b => 
    b.data?.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.data?.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Book Returns
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Process library returns and update book conditions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Checkouts to Return */}
        <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-amber-100 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookDown className="w-5 h-5 text-amber-500" /> Awaiting Return
              </CardTitle>
              <div className="relative w-full sm:w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input 
                  placeholder="Search to return..." 
                  className="pl-9 h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading records...</div>
            ) : filteredActive.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No active checkouts found</h3>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredActive.map((record) => (
                  <div key={record.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{record.data?.bookTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Borrowed by: <span className="font-semibold text-slate-700 dark:text-slate-200">{record.data?.studentName}</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Due: {record.data?.dueDate}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => openReturnModal(record.id)}
                      className="rounded-lg bg-white dark:bg-slate-900 border border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm"
                    >
                      Process Return
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Returned History */}
        <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-emerald-100 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" /> Recently Returned
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading history...</div>
            ) : returnedBorrowings.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No return history</h3>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {returnedBorrowings.slice(0, 10).map((record) => (
                  <div key={record.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{record.data?.bookTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Returned by: <span className="font-semibold text-slate-700 dark:text-slate-200">{record.data?.studentName}</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">On: {record.data?.returnDate}</p>
                    </div>
                    <Badge variant="outline" className={`
                      ${record.data?.returnCondition === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                      ${record.data?.returnCondition === 'Damaged' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                      ${record.data?.returnCondition === 'Lost' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                    `}>
                      Condition: {record.data?.returnCondition}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-amber-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Process Return</DialogTitle>
              <DialogDescription className="text-amber-100">
                Update the condition of the returned book.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Book Condition on Return</label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                value={returnCondition}
                onChange={e => setReturnCondition(e.target.value)}
              >
                <option value="Good">Good / Undamaged</option>
                <option value="Damaged">Damaged (Needs repair)</option>
                <option value="Lost">Lost (Never returned)</option>
              </select>
            </div>
            
            {returnCondition !== 'Good' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <p className="font-bold mb-1">Note:</p>
                <p>If damaged or lost, the student may need to be billed for a replacement. The inventory count will not be incremented for lost books.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsReturnModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleProcessReturn} 
              disabled={isProcessing}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {isProcessing ? 'Processing...' : 'Confirm Return'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
