import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Tags, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';

export default function PricingTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, currency: 'USD' });
  const { toast } = useToast();

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    setLoading(true);
    const { data, error } = await supabase.from('clipad_pricing_tags').select('*').order('created_at', { ascending: false });
    if (!error) setTags(data || []);
    setLoading(false);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData, price: parseFloat(formData.price) };
    
    let error;
    if (editingTag) {
      const res = await supabase.from('clipad_pricing_tags').update(payload).eq('id', editingTag.id);
      error = res.error;
    } else {
      const res = await supabase.from('clipad_pricing_tags').insert(payload);
      error = res.error;
    }

    if (!error) {
      toast({ title: "Pricing Tag Saved" });
      setIsDialogOpen(false);
      setEditingTag(null);
      fetchTags();
    } else {
      toast({ title: "Error saving tag", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This tag might be assigned to companies.")) return;
    const { error } = await supabase.from('clipad_pricing_tags').delete().eq('id', id);
    if (!error) {
      toast({ title: "Tag Deleted" });
      fetchTags();
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><OrbitLoader /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Tags</h1>
          <p className="text-muted-foreground mt-2">Create custom pricing limits and features to assign to specific companies.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if(!open) { setEditingTag(null); setFormData({ name: '', description: '', price: 0, currency: 'USD' }); }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> New Tag</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Pricing Tag'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tag Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g., Enterprise Discount" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional details" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price / mo</Label>
                  <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Tag</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.map(tag => (
          <div key={tag.id} className="border border-border rounded-xl bg-card p-6 relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><Tags className="w-4 h-4 text-indigo-500" /> {tag.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tag.description || "No description provided."}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-xl">{tag.price} {tag.currency}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                setEditingTag(tag);
                setFormData(tag);
                setIsDialogOpen(true);
              }}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(tag.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            No pricing tags created yet.
          </div>
        )}
      </div>
    </div>
  );
}
