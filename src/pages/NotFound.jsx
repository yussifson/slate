import { useTranslation} from "react-i18next";
import React from 'react';
import { Link} from 'react-router-dom';
import { FileQuestion, ArrowLeft} from 'lucide-react';
import { Button} from '@/components/ui/button';

export default function NotFound() {
 const { t} = useTranslation();
 return (
 <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-6 font-sans">
 <div className="max-w-md w-full bg-white dark:bg-slate-900/40 border border-slate-200 rounded-3xl p-10 text-center -slate-200/50">
 <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-8 ">
 <FileQuestion className="w-12 h-12" strokeWidth={1.5} />
 </div>
 <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-4">
 {t("404", "404")}
 </h1>
 <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">
 {t("page_not_found", "Page Not Found")}
 </h2>
 <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
 {t(
 "the_page_or_workspace_you_are_",
 "The page or workspace you are looking for doesn't exist, has been moved, or you don't have access to it."
 )}
 </p>
 
 <div className="flex flex-col gap-3">
 <Button 
 asChild
 className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold text-lg -emerald-600/20"
 >
 <Link to="/">
 <ArrowLeft className="w-5 h-5 mr-2" />
 {t("return_home", "Return Home")}
 </Link>
 </Button>
 </div>
 </div>
 </div>
 );
}
