import React, { useState, useRef } from 'react';
import { User, Mail, Camera } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from "@/api/supabaseClient";

export default function AccountPersonalInfo() {
  const { user, profile } = useAuth();
  
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleSaveName = async () => {
    if (!firstName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: firstName.trim(),
        last_name: lastName.trim()
      }).eq('id', user.id);
      
      if (error) throw error;
      
      // Update local storage cache to reflect immediately across apps
      const cached = localStorage.getItem('slate_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.first_name = firstName.trim();
        parsed.last_name = lastName.trim();
        localStorage.setItem('slate_cached_user', JSON.stringify(parsed));
      }
      
      setIsEditingName(false);
      // In a real app we might trigger a context refresh here, but this is fine for the UI update
    } catch (err) {
      alert("Error saving name: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
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
            <div 
              className={`p-6 md:px-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={handleAvatarClick}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileChange}
               />
               <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile picture</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {isUploading ? 'Uploading...' : 'A picture helps personalize your account'}
                  </div>
               </div>
               <div className="relative">
                 {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-sm" />
                 ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium">
                      {getInitials()}
                    </div>
                 )}
                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                    {isUploading ? (
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    )}
                 </div>
               </div>
            </div>
            
            {/* Name */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               {isEditingName ? (
                 <div className="space-y-4 max-w-md">
                   <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Name</div>
                   <input 
                     type="text" 
                     value={firstName} 
                     onChange={e => setFirstName(e.target.value)}
                     placeholder="First Name"
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <input 
                     type="text" 
                     value={lastName} 
                     onChange={e => setLastName(e.target.value)}
                     placeholder="Last Name"
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <div className="flex gap-2 pt-2">
                     <button onClick={handleSaveName} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Save</button>
                     <button onClick={() => setIsEditingName(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between w-full" onClick={() => setIsEditingName(true)}>
                   <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {firstName} {lastName}
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
