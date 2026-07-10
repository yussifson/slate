import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Grid, Video, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const apps = [
  {
    id: "slate",
    name: "Optavel Slate",
    description: "Core Operating System",
    icon: <Logo className="w-5 h-5" />,
    url: "https://slate.optavel.com",
    active: true,
  },
  {
    id: "preloom",
    name: "Pre-loom",
    description: "Video & Meetings",
    icon: <Video className="w-6 h-6 text-indigo-500" />,
    url: "https://preloom.optavel.com",
    active: false,
  },
  {
    id: "account",
    name: "Account",
    description: "Global Profile Settings",
    icon: <Settings className="w-6 h-6 text-slate-500" />,
    url: "https://account.optavel.com",
    active: false,
  }
];

export default function AppLauncher() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Use base domain dynamically if not strictly hardcoded
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'optavel.com';
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "w-8 h-8 rounded-xl border-[0.5px] border-black/10 dark:border-white/10 transition-all duration-300 relative overflow-hidden group shrink-0",
            isOpen 
              ? "bg-primary/10 border-primary/30 text-primary" 
              : "bg-card text-foreground hover:bg-muted hover:border-primary/20"
          )}
          title="Optavel Apps"
        >
          <Grid className={cn(
            "w-4 h-4 transition-colors",
            isOpen ? "text-primary" : "text-[#71717a] dark:text-gray-400 group-hover:text-primary"
          )} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className="w-[320px] p-4 shadow-2xl border-slate-200 dark:border-slate-800 rounded-2xl z-[150] bg-card/95 backdrop-blur-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm font-bold text-foreground">Optavel Apps</p>
          <span className="text-[10px] font-semibold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            SSO ACTIVE
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {apps.map((app) => {
            const isCurrentApp = currentHost.includes(app.id);
            return (
              <a
                key={app.id}
                href={isCurrentApp ? "#" : app.url}
                target={isCurrentApp ? "_self" : "_blank"}
                rel="noopener noreferrer"
                onClick={() => isCurrentApp && setIsOpen(false)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group text-center gap-2 border border-transparent",
                  isCurrentApp 
                    ? "bg-primary/5 border-primary/20 cursor-default" 
                    : "hover:bg-muted cursor-pointer hover:border-black/5 dark:hover:border-white/5 active:scale-95"
                )}
              >
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-xl bg-background shadow-sm transition-transform duration-300",
                  !isCurrentApp && "group-hover:shadow-md group-hover:-translate-y-0.5"
                )}>
                  {app.icon}
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-[11px] font-semibold leading-tight",
                    isCurrentApp ? "text-primary" : "text-foreground"
                  )}>
                    {app.name}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
          <a 
            href="https://account.optavel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            Manage Optavel Account
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
