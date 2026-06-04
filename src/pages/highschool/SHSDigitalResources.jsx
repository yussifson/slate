import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Cloud, FileText, Download, UploadCloud, Trash2, Folder, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSDigitalResources() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    category: 'Past Questions', // Past Questions, Syllabus, Lecture Notes, Study Guide
    targetClass: 'All Forms', // Form 1, Form 2, Form 3, All
    subject: 'General',
    linkUrl: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_digital_resource', user?.company_id);
      setResources(records);
    } catch (error) {
      console.error('Failed to fetch digital resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchResources();
    }
  }, [user]);

  const handleUpload = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_digital_resource',
        title: newResource.title,
        case_number: `RES-${Math.floor(Math.random() * 100000)}`,
        status: 'Published',
        data: {
          ...newResource,
          uploadDate: new Date().toISOString().split('T')[0]
        }
      };
      
      await base44.createEntity(payload);
      setIsUploadModalOpen(false);
      setNewResource({ title: '', category: 'Past Questions', targetClass: 'All Forms', subject: 'General', linkUrl: '' });
      fetchResources();
    } catch (error) {
      console.error('Failed to upload resource:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.updateEntity(id, { status: 'Archived' });
      fetchResources();
    } catch (error) {
      console.error('Failed to delete resource:', error);
    }
  };

  const filteredResources = resources.filter(r => 
    r.status !== 'Archived' &&
    (r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.data?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.data?.subject?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            E-Library & Resources
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage digital learning materials, past questions, and study guides.
          </p>
        </div>
        
        <Button onClick={() => setIsUploadModalOpen(true)} className="h-9 gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <UploadCloud className="w-4 h-4" /> Upload Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Total Files</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{resources.filter(r => r.status === 'Published').length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Resource Directory
              </CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input 
                placeholder="Search resources..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading resources...</div>
          ) : filteredResources.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-500 dark:text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No resources found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Upload study materials to populate the E-Library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-800/30">
              {filteredResources.map(resource => (
                <div key={resource.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-600 dark:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(resource.id)}
                      className="text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[40px] mb-1">{resource.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-4">{resource.data?.subject} • {resource.data?.targetClass}</p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none font-medium text-[10px]">
                      {resource.data?.category}
                    </Badge>
                    <a href={resource.data?.linkUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      View File <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Upload Resource</DialogTitle>
              <DialogDescription className="text-blue-100 dark:text-blue-900">
                Add a new study material to the E-Library.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Resource Title</label>
              <Input 
                placeholder="e.g. 2022 WASSCE Core Maths Past Questions"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                value={newResource.title}
                onChange={e => setNewResource({...newResource, title: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                  value={newResource.category}
                  onChange={e => setNewResource({...newResource, category: e.target.value})}
                >
                  <option value="Past Questions">Past Questions</option>
                  <option value="Syllabus">Syllabus</option>
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Study Guide">Study Guide</option>
                  <option value="Audio/Video">Audio/Video Link</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Target Class</label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                  value={newResource.targetClass}
                  onChange={e => setNewResource({...newResource, targetClass: e.target.value})}
                >
                  <option value="All Forms">All Forms</option>
                  <option value="Form 1">Form 1</option>
                  <option value="Form 2">Form 2</option>
                  <option value="Form 3">Form 3</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Subject</label>
              <Input 
                placeholder="e.g. Core Mathematics, General Knowledge"
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                value={newResource.subject}
                onChange={e => setNewResource({...newResource, subject: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Cloud Link (URL)</label>
              <Input 
                placeholder="https://drive.google.com/..."
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                value={newResource.linkUrl}
                onChange={e => setNewResource({...newResource, linkUrl: e.target.value})}
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Link to the external hosted file (Google Drive, Dropbox, AWS).</p>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!newResource.title || !newResource.linkUrl || isProcessing}
              className="rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold"
            >
              {isProcessing ? 'Publishing...' : 'Publish Resource'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
