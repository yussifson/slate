import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Phone, GraduationCap, Clock, FileText, HeartPulse } from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { t } = useTranslation();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const rec = await base44.entities.Client.get(id);
      if (!rec || String(rec.company_id) !== String(companyId)) throw new Error("Student not found");
      let extra = {};
      try { extra = JSON.parse(rec.notes || '{}'); } catch(e) {}
      return { ...rec, ...extra };
    },
    enabled: !!id && !!companyId
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading profile...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/students')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-24 h-24 bg-emerald-100 text-[#1E3A8A] dark:text-blue-400 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4">
                {student.avatar || student.name?.substring(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{student.id_number}</p>
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-[#1E3A8A] dark:text-blue-400 rounded-full text-xs font-semibold">
                {student.status || 'Active'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium">{student.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium">{student.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="font-medium">{student.dateOfBirth || `${student.age} yrs`}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Details */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Guardian Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground flex items-center gap-2 mb-1"><User className="w-4 h-4"/> Parent/Guardian</span>
                <p className="font-medium">{student.parent || 'Not Provided'}</p>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-2 mb-1"><Phone className="w-4 h-4"/> Phone</span>
                <p className="font-medium">{student.phone || 'Not Provided'}</p>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-2 mb-1"><Mail className="w-4 h-4"/> Email</span>
                <p className="font-medium">{student.parentEmail || 'Not Provided'}</p>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-2 mb-1"><Phone className="w-4 h-4"/> Emergency Contact</span>
                <p className="font-medium">{student.emergencyContactName ? `${student.emergencyContactName} (${student.emergencyContactPhone})` : 'Not Provided'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><HeartPulse className="w-5 h-5"/> Health & Medical</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                {student.medicalNotes || "No medical conditions or allergies reported."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5"/> Academic History</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
               <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Previous School</span>
                <span className="font-medium">{student.previousSchool || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Transfer Status</span>
                <span className="font-medium">{student.transferStatus || 'No'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Alumni Status</span>
                <span className="font-medium">{student.alumniStatus || 'Active'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
