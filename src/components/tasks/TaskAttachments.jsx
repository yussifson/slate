import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Upload, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function TaskAttachments({ taskId }) {
    const companyId = useCompanyId();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const { data: attachments = [], isLoading } = useQuery({
        queryKey: ['task_attachments', taskId],
        queryFn: () => base44.entities.TaskAttachment.filter({ task_id: taskId }),
        enabled: !!taskId
    });

    const addMutation = useMutation({
        mutationFn: async (fileData) => {
            return await base44.entities.TaskAttachment.create({
                task_id: taskId,
                company_id: companyId,
                file_url: fileData.url,
                file_name: fileData.name,
                file_size: fileData.size,
                created_by: user?.email || 'Unknown',
                created_at: new Date().toISOString(),
                created_date: new Date().toISOString().split('T')[0]
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['task_attachments', taskId]);
            toast({ title: 'File uploaded successfully' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await base44.entities.TaskAttachment.delete(id);
        },
        onSuccess: () => queryClient.invalidateQueries(['task_attachments', taskId])
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !taskId) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${companyId}/${taskId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

            // Try documents bucket first, then fallback to assets
            let uploadRes = await supabase.storage
                .from('documents')
                .upload(fileName, file);

            let bucketName = 'documents';
            if (uploadRes.error) {
                console.warn('Upload to documents bucket failed, trying assets bucket:', uploadRes.error.message);
                const assetRes = await supabase.storage
                    .from('assets')
                    .upload(fileName, file);
                if (assetRes.error) throw uploadRes.error;
                bucketName = 'assets';
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            addMutation.mutate({
                url: publicUrl,
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
            });
        } catch (error) {
            console.error('Upload error:', error);
            toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    if (!taskId) return <div className="text-sm text-slate-500 py-4">Save the task first to upload files.</div>;

    return (
        <div className="space-y-4 font-dmsans">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attachments</h3>
                <div>
                    <input 
                        type="file" 
                        id="task-file-upload" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <label htmlFor="task-file-upload">
                        <Button asChild variant="outline" size="sm" className="h-8 cursor-pointer" disabled={isUploading}>
                            <span>
                                <Upload className="w-3.5 h-3.5 mr-2" />
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                {attachments.length === 0 && !isLoading ? (
                    <div className="text-center py-6 text-sm text-slate-500 border border-dashed rounded-lg border-slate-200 dark:border-border">
                        No attachments yet.
                    </div>
                ) : (
                    attachments.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-border bg-white dark:bg-card/50 group">
                            <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {file.file_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {file.file_size} • {new Date(file.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-primary" asChild>
                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-8 h-8 text-slate-500 hover:text-red-500"
                                    onClick={() => deleteMutation.mutate(file.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
