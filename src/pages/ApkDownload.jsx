import React, { useEffect, useState } from "react";
import { Download, Smartphone, CheckCircle, Shield, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApkDownload() {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const apkUrl = "/apk/app.apk";

  useEffect(() => {
    // Automatically trigger download on mount
    const timer = setTimeout(() => {
      triggerDownload();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const triggerDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement("a");
    link.href = apkUrl;
    link.download = "JCLOffice.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B1418] text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 selection:bg-[#005A9C]/20">
      <div className="max-w-md w-full bg-white dark:bg-[#101D22] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* App Icon Header */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#005A9C] to-[#00477D] text-white flex items-center justify-center shadow-lg shadow-[#005A9C]/30 relative">
          <Smartphone className="w-10 h-10" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center text-white shadow-md">
            <Download className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            JCL Office
          </h1>
          <p className="text-sm font-semibold text-[#005A9C] dark:text-[#FF6B00] mt-1">
            Official Android Mobile App (Live-Sync)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Connected to <span className="font-mono font-semibold text-foreground">jcloffice.optavel.com</span>
          </p>
        </div>

        {/* Status card */}
        <div className="bg-[#005A9C]/5 dark:bg-white/5 border border-[#005A9C]/20 dark:border-white/10 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#005A9C] dark:text-white">
            <CheckCircle className="w-4 h-4 text-[#FF6B00]" />
            <span>Automatic Download {downloadStarted ? "Started" : "Starting..."}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            If the download does not start automatically within a few seconds, click the button below.
          </p>
        </div>

        {/* Manual Download Button */}
        <Button
          onClick={triggerDownload}
          className="w-full h-12 rounded-2xl bg-[#005A9C] hover:bg-[#00477D] text-white font-bold text-sm shadow-lg shadow-[#005A9C]/25 transition-all active:scale-95 gap-2"
        >
          <Download className="w-4 h-4" />
          Download JCLOffice.apk
        </Button>

        {/* Instructions */}
        <div className="text-left border-t border-black/5 dark:border-white/10 pt-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#005A9C] dark:text-[#FF6B00]" />
            Installation Guide:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed pl-1">
            <li>Open the downloaded <strong className="text-foreground">JCLOffice.apk</strong> file.</li>
            <li>If prompted, tap <strong className="text-foreground">Settings</strong> and toggle <strong className="text-foreground">Allow from this source</strong>.</li>
            <li>Tap <strong className="text-foreground">Install</strong>, then open the app.</li>
          </ol>
        </div>

        <div className="pt-2">
          <a
            href="/"
            className="text-xs font-semibold text-muted-foreground hover:text-[#005A9C] dark:hover:text-[#FF6B00] transition-colors inline-flex items-center gap-1"
          >
            Go to Web Portal <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
