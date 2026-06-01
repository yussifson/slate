import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Loader2 } from "lucide-react";

const ROBOT_SEEDS = ["Felix", "Aneka", "Jack", "Midnight", "Oliver", "Bella"];

export default function ProfileAvatarDialog({ open, onOpenChange }) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const currentAvatar = user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || 'Admin'}`;

  const handleSaveAvatar = async (url) => {
    setIsSaving(true);
    try {
      // Update the profiles table directly
      const { error: profileError } = await base44.supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      if (profileError) throw profileError;
      
      // Also update auth user metadata just in case
      await base44.supabase.auth.updateUser({ data: { avatar_url: url } });

      await refreshUser();
      toast({ title: t("avatar_updated", "Avatar Updated"), description: t("your_avatar_has_been_saved", "Your new avatar has been saved successfully.") });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save avatar", error);
      toast({ title: t("error", "Error"), description: t("failed_to_save_avatar", "Failed to save avatar"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("error", "Error"), description: t("file_too_large", "File size must be under 2MB"), variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      await handleSaveAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-center">{t("profile_personalization", "Profile Personalization")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("customize_your_dashboard_avatar", "Customize your dashboard avatar. Upload a real photo or choose a robot.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-6 py-6">
          {/* Current Avatar Display */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-50 flex items-center justify-center">
              {isSaving ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : (
                <img src={currentAvatar} alt="Current Avatar" className="w-full h-full object-cover" />
              )}
            </div>
          </div>

          {/* Upload Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          <Button 
            className="w-full h-12 text-md font-semibold bg-blue-600 hover:bg-blue-700"
            disabled={isSaving}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-5 h-5 mr-2" />
            {t("upload_real_photo", "Upload Real Photo")}
          </Button>

          {/* Robots Grid */}
          <div className="w-full pt-4 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-4">{t("or_choose_a_robot_avatar", "Or choose a Robot Avatar:")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {ROBOT_SEEDS.map(seed => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=e2e8f0`;
                return (
                  <button
                    key={seed}
                    disabled={isSaving}
                    onClick={() => handleSaveAvatar(url)}
                    className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:scale-105 hover:shadow-lg focus:outline-none"
                  >
                    <img src={url} alt={`Robot ${seed}`} className="w-full h-full object-cover bg-slate-100" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
