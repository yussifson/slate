import { useTranslation} from "react-i18next";
import React from 'react';
import { AlertTriangle, X} from 'lucide-react';
import { Button} from '@/components/ui/button';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title = "Confirm Action", message = "Are you sure you want to proceed? This action cannot be undone."}) {
 const { t} = useTranslation();
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-300">
 <div className="bg-card border border-primary/40 rounded-2xl -[0_30px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 ease-out">
 <div className="p-5 space-y-4">
 <div className="flex justify-between items-start">
 <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
 <AlertTriangle className="w-5 h-5" />
 </div>
 <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors">
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="space-y-1">
 <h3 className="text-base font-bold text-card-foreground">{title}</h3>
 <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
 </div>
 </div>

 <div className="bg-muted/50 p-4 border-t border-primary/40 flex gap-3 justify-end">
 <Button variant="outline" size="sm" onClick={onClose} className="h-9 px-4 rounded-xl text-xs font-semibold">
 {t("cancel", "Cancel")}
 </Button>
 <Button size="sm" onClick={onConfirm} className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold">
 {t("confirm", "Confirm")}
 </Button>
 </div>
 </div>
 </div>
 );
}
