import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Book, Globe, Shield, RefreshCw, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UniLibrary() {
  const { t } = useTranslation();
  const [digitalItems] = useState([
    { title: "Introduction to Algorithmic Analysis", author: "Dr. Cormen", type: "Digital PDF", date: "2024" },
    { title: "Journal of Distributed consensus & Blockchains", author: "Academic Press", type: "Journal Article", date: "2025" },
    { title: "Vector Calculus & Mechanics", author: "Feynman", type: "Digital Book", date: "2023" }
  ]);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_library", "University Library System")} 
        subtitle="Search physical catalogs, browse digital repository directories, and review academic journals." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Volumes</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">45,000</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Book className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Digital Assets</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">12,800</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Globe className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Borrows</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">324</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscribed Journals</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">24</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Digital Library & Repository</CardTitle>
            <CardDescription>Browse online publications, lecture notes, and research materials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {digitalItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" /> {item.title}
                  </h4>
                  <p className="text-slate-500 mt-1">Author: {item.author} · Published: {item.date}</p>
                </div>
                <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-bold h-8">
                  Download PDF
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Catalog Search</CardTitle>
            <CardDescription>Search the physical catalog database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search books, authors..."
                className="w-full pl-9 pr-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 outline-none text-xs focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button size="sm" className="w-full bg-primary hover:bg-primary/95 text-white mt-2">
              Query Catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
