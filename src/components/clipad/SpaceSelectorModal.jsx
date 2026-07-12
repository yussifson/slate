import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';
import { Layers } from 'lucide-react';

export default function SpaceSelectorModal({ open, onOpenChange, onConfirm, title = "Select a Space" }) {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadSpaces();
    }
  }, [open]);

  const loadSpaces = async () => {
    setLoading(true);
    const { data } = await supabase.from('clipad_spaces').select('id, name, type').order('name');
    if (data) setSpaces(data);
    setLoading(false);
  };

  const handleConfirm = () => {
    onConfirm(selectedSpaceId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose a space to associate this meeting with. If you skip, it will be public.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {loading ? (
            <p className="text-sm text-slate-500 text-center">Loading spaces...</p>
          ) : spaces.length === 0 ? (
            <p className="text-sm text-slate-500 text-center">No spaces found. You can continue without a space.</p>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => setSelectedSpaceId(null)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-colors ${selectedSpaceId === null ? 'bg-primary/5 border-primary/30 text-primary font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/30'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <span>No Space (Public)</span>
              </button>
              {spaces.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpaceId(s.id)}
                  className={`w-full flex flex-col items-start px-3 py-2.5 rounded-xl border transition-colors ${selectedSpaceId === s.id ? 'bg-primary/5 border-primary/30 text-primary font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/30'}`}
                >
                  <span className="text-sm">{s.name}</span>
                  <span className="text-[10px] uppercase text-slate-400 font-mono tracking-widest">{s.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
