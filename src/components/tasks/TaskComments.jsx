import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function TaskComments({ taskId }) {
    const companyId = useCompanyId();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [comment, setComment] = useState('');

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['task_comments', taskId],
        queryFn: () => base44.entities.TaskComment.filter({ task_id: taskId }),
        enabled: !!taskId
    });

    const addMutation = useMutation({
        mutationFn: async (text) => {
            return await base44.entities.TaskComment.create({
                task_id: taskId,
                company_id: companyId,
                comment_text: text,
                created_by: user?.email || user?.full_name || 'Team Member',
                created_at: new Date().toISOString(),
                created_date: new Date().toISOString().split('T')[0]
            });
        },
        onSuccess: () => queryClient.invalidateQueries(['task_comments', taskId])
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        addMutation.mutate(comment);
        setComment('');
    };

    if (!taskId) return <div className="text-sm text-slate-500 py-4">Save the task first to add comments.</div>;

    const sortedComments = [...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return (
        <div className="flex flex-col h-full font-dmsans">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Comments</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 min-h-[180px] max-h-[340px] pr-1 sm:pr-2">
                {sortedComments.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-8">No comments yet.</div>
                ) : (
                    sortedComments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-secondary flex items-center justify-center shrink-0">
                                <UserCircle className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                        {c.created_by?.includes('@') ? c.created_by.split('@')[0] : (c.created_by || 'Team Member')}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}
                                    </span>
                                </div>
                                <div className="mt-1 text-sm text-slate-700 dark:text-foreground bg-slate-50 dark:bg-secondary/50 p-3 rounded-lg rounded-tl-none">
                                    {c.comment_text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-auto pt-2 border-t border-border/60">
                <Input 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="h-9 text-xs sm:text-sm bg-muted/40 border-border/80 focus:bg-background"
                />
                <Button type="submit" disabled={addMutation.isPending || !comment.trim()} size="sm" className="h-9 px-3.5 shrink-0 gap-1.5 text-xs font-semibold">
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                </Button>
            </form>
        </div>
    );
}
