import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InstitutionSettings() {
  const { t } = useTranslation();

  return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 dark:text-white tracking-[-0.02em]">
            {t('institution_settings', 'Institution Settings')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground dark:text-muted-foreground mt-1">
            {t('manage_campuses_sessions', 'Manage campuses, academic sessions, and core structures.')}
          </p>
        </div>

        <Tabs defaultValue="campuses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campuses">{t('campuses', 'Campuses')}</TabsTrigger>
            <TabsTrigger value="sessions">{t('academic_sessions', 'Academic Sessions')}</TabsTrigger>
            <TabsTrigger value="departments">{t('departments', 'Departments & Faculties')}</TabsTrigger>
            <TabsTrigger value="grading">{t('grading_systems', 'Grading Systems')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="campuses">
            <Card>
              <CardHeader>
                <CardTitle>{t('campus_management', 'Campus Management')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-muted-foreground">
                  Manage physical locations, branches, and campuses for your institution.
                </p>
                {/* Future implementation: List of campuses with Add/Edit/Delete */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>{t('academic_sessions', 'Academic Sessions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-muted-foreground">
                  Configure academic years, terms, and semesters.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>{t('departments', 'Departments & Faculties')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-muted-foreground">
                  Organize your institution into faculties, schools, and departments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="grading">
            <Card>
              <CardHeader>
                <CardTitle>{t('grading_systems', 'Grading Systems')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-muted-foreground">
                  Define grading scales and assessment rubrics for your education level.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
