import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, CheckCircle, Award, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

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
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl school-heading font-extrabold tracking-tight">Teacher Evaluations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Anonymous feedback to improve academic quality</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-xl font-extrabold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="text-amber-500" /> Pending Evaluations
        </h3>
        <div className="space-y-4">
          {teachers.map((teacher, i) => {
            const done = hasEvaluated(teacher);
            return (
              <div key={i} className={`p-6 rounded-3xl border ${done ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-background border-slate-200 dark:border-slate-700 shadow-md'} flex flex-col md:flex-row items-center justify-between gap-4 transition-all`}>
                <div className="font-bold text-lg text-slate-900 dark:text-white">{teacher}</div>
                
                {done ? (
                  <div className="flex items-center gap-2 text-[#1E3A8A] dark:text-blue-400 bg-[#F0F4FF] dark:bg-blue-900/20 dark:bg-emerald-900/20 px-4 py-2 rounded-full font-bold text-sm">
                    <CheckCircle className="w-4 h-4" /> Completed
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    {selectedTeacher === teacher ? (
                      <>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(star => (
                            <Star 
                              key={star} 
                              onClick={() => setRating(star)}
                              className={`w-8 h-8 cursor-pointer transition-colors ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} 
                            />
                          ))}
                        </div>
                        <Button onClick={() => submitEval.mutate()} disabled={submitEval.isPending || rating === 0} className="w-full md:w-auto rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold">
                          Submit
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => { setSelectedTeacher(teacher); setRating(0); }} variant="outline" className="w-full md:w-auto rounded-full border-amber-200 text-amber-700 hover:bg-amber-50">
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
    </div>
  );
}
