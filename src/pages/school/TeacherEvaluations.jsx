import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, CheckCircle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function TeacherEvaluations() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [rating, setRating] = useState(0);

  const { data: evaluations = [] } = useQuery({
    queryKey: ['school_teacher_evaluation', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_teacher_evaluation', companyId);
      return all.filter(e => e.client_id === session?.user?.id);
    },
    enabled: !!companyId && !!session?.user?.id
  });

  const submitEval = useMutation({
    mutationFn: () => {
      if (!selectedTeacher || rating === 0) throw new Error("Select a teacher and give a rating");
      return base44.createEntity({
        company_id: companyId,
        case_type: 'school_teacher_evaluation',
        client_id: session?.user?.id,
        title: `Evaluation for ${selectedTeacher}`,
        status: 'completed',
        data: { teacher: selectedTeacher, rating }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_teacher_evaluation', companyId] });
      setSelectedTeacher(null);
      setRating(0);
      toast.success("Evaluation submitted anonymously!");
    },
    onError: (err) => toast.error(err.message)
  });

  const teachers = ['Prof. Smith (Calculus)', 'Dr. Adams (Physics)', 'Mr. Johnson (History)'];
  const hasEvaluated = (name) => evaluations.some(e => e.data?.teacher === name);

  return (
    <SchoolPageShell
      title="Teacher Evaluations"
      subtitle="Anonymous feedback to improve academic quality"
      breadcrumb={['School', 'Evaluations']}
    >
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 max-w-3xl">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-6 border-b border-border/50 pb-3">
          <Award className="w-4 h-4 text-amber-500" /> Pending Evaluations
        </h3>
        <div className="space-y-4">
          {teachers.map((teacher, i) => {
            const done = hasEvaluated(teacher);
            return (
              <div key={i} className={`p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${done ? 'bg-muted/10 border-border/30' : 'bg-card border-border/50 shadow-sm'}`}>
                <div className="font-semibold text-sm text-foreground">{teacher}</div>
                
                {done ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {selectedTeacher === teacher ? (
                      <>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              onClick={() => setRating(star)}
                              className={`w-6 h-6 cursor-pointer transition-colors ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`} 
                            />
                          ))}
                        </div>
                        <Button onClick={() => submitEval.mutate()} disabled={submitEval.isPending || rating === 0} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 font-semibold">
                          Submit
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => { setSelectedTeacher(teacher); setRating(0); }} variant="outline" className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/30 dark:hover:bg-indigo-500/10 rounded-lg px-4">
                        Start Evaluation
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SchoolPageShell>
  );
}
