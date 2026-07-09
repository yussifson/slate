import React, { useState, useRef } from 'react';
import { User, Mail, Camera } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from "@/api/supabaseClient";

export default function AccountPersonalInfo() {
  const { user, refreshUser } = useAuth();
  
  // Clean malformed avatar URLs
  let safeAvatarUrl = user?.avatar_url || '';
  if (safeAvatarUrl && safeAvatarUrl.includes('https://') && safeAvatarUrl.indexOf('https://') > 0) {
    safeAvatarUrl = safeAvatarUrl.substring(safeAvatarUrl.lastIndexOf('https://'));
  }
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const defaultAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Nolan"
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({
        avatar_url: publicUrl
      }).eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local storage
      const cached = localStorage.getItem('slate_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.avatar_url = publicUrl;
        localStorage.setItem('slate_cached_user', JSON.stringify(parsed));
      }
      
      // Force refresh for context
      window.location.reload();
    } catch (err) {
      alert("Error uploading avatar: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDefaultAvatar = async (url) => {
    setIsUploading(true);
    try {
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      if (error) throw error;
      
      const cached = localStorage.getItem('slate_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.avatar_url = url;
        localStorage.setItem('slate_cached_user', JSON.stringify(parsed));
      }
      if (refreshUser) await refreshUser();
      setIsEditingAvatar(false);
    } catch (err) {
      alert("Error saving avatar: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim()
      }).eq('id', user.id);
      
      if (error) throw error;
      
      // Update local storage cache to reflect immediately across apps
      const cached = localStorage.getItem('slate_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.full_name = fullName.trim();
        localStorage.setItem('slate_cached_user', JSON.stringify(parsed));
      }
      
      if (refreshUser) await refreshUser();
      setIsEditingName(false);
    } catch (err) {
      alert("Error saving name: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (fullName) {
       const parts = fullName.split(' ');
       if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
       return fullName.substring(0, 2).toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 dark:text-white mb-3">Personal info</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Info about you and your preferences across Optavel services.
        </p>
      </div>

      <div className="space-y-6">
        
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Basic info</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">
               Some info may be visible to other people using Optavel services.
             </p>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Profile Picture */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
               {isEditingAvatar ? (
                  <div className="space-y-4">
                     <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Choose Avatar</div>
                     <div className="flex flex-wrap gap-4 mb-4">
                       {defaultAvatars.map((url, i) => (
                         <img 
                           key={i} 
                           src={url} 
                           alt={`Avatar ${i+1}`} 
                           className="w-14 h-14 rounded-full cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-sm bg-gray-100"
                           onClick={() => handleSelectDefaultAvatar(url)}
                         />
                       ))}
                       <div 
                         onClick={handleAvatarClick}
                         className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all border border-dashed border-gray-400"
                       >
                         <Camera className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                       </div>
                     </div>
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept="image/*"
                       onChange={handleFileChange}
                     />
                     <button onClick={() => setIsEditingAvatar(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                  </div>
               ) : (
                  <div 
                    className={`flex items-center justify-between cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => setIsEditingAvatar(true)}
                  >
                     <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile picture</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {isUploading ? 'Uploading...' : 'A picture helps personalize your account'}
                        </div>
                     </div>
                     <div className="relative">
                       {safeAvatarUrl ? (
                          <img src={safeAvatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-100" />
                       ) : (
                          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-medium">
                            {getInitials()}
                          </div>
                       )}
                     </div>
                  </div>
               )}
            </div>
            
            {/* Name */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               {isEditingName ? (
                 <div className="space-y-4 max-w-md">
                   <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Name</div>
                   <input 
                     type="text" 
                     value={fullName} 
                     onChange={e => setFullName(e.target.value)}
                     placeholder="Full Name"
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <div className="flex gap-2 pt-2">
                     <button onClick={handleSaveName} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save</button>
                     <button onClick={() => setIsEditingName(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between w-full" onClick={() => setIsEditingName(true)}>
                   <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {fullName || "Add your name"}
                      </div>
                   </div>
                   <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </div>
               )}
            </div>
            
            {/* Birthday */}
            <div className="p-6 md:px-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Birthday</div>
                  <div className="text-sm text-gray-900 dark:text-white font-medium">Add birthday</div>
               </div>
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Contact info</h2>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Email */}
            <div className="p-6 md:px-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">Email</div>
                  <div className="text-sm text-gray-900 dark:text-white font-medium">{user?.email}</div>
               </div>
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
            </div>
            
            {/* Phone */}
            <div className="p-6 md:px-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</div>
                  <div className="text-sm text-gray-900 dark:text-white font-medium">Add a recovery phone</div>
               </div>
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
