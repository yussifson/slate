import React, { useState, useRef } from 'react';
import { User, Mail, Camera, Crown } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from "@/api/supabaseClient";

export default function AccountPersonalInfo() {
  const { user, profile, refreshUser } = useAuth();
  
  const isSuperAdmin = profile?.role === 'super_admin' || user?.role === 'super_admin';
  const isPremium = profile?.plan === 'premium' || user?.plan === 'premium';
  
  // Clean malformed avatar URLs
  let safeAvatarUrl = user?.avatar_url || '';
  if (safeAvatarUrl && safeAvatarUrl.includes('https://') && safeAvatarUrl.indexOf('https://') > 0) {
    safeAvatarUrl = safeAvatarUrl.substring(safeAvatarUrl.lastIndexOf('https://'));
  }
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.full_name || '');
  const [birthday, setBirthday] = useState(user?.user_metadata?.birthday || user?.birthday || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBirthday, setIsEditingBirthday] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || '');
  
  const [category, setCategory] = useState(user?.user_metadata?.category || profile?.industry || '');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  
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
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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

  const handleSaveBirthday = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ birthday }).eq('id', user.id);
      if (error) throw error;
      
      const { error: authErr } = await supabase.auth.updateUser({
        data: { birthday }
      });
      if (authErr) throw authErr;

      const cached = localStorage.getItem('slate_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.birthday = birthday;
        localStorage.setItem('slate_cached_user', JSON.stringify(parsed));
      }
      if (refreshUser) await refreshUser();
      setIsEditingBirthday(false);
    } catch (err) {
      alert("Error saving birthday: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhone = async () => {
    setIsSaving(true);
    try {
      const { error: profileErr } = await supabase.from('profiles').update({ phone }).eq('id', user.id);
      if (profileErr) throw profileErr;
      
      // Update Auth phone
      const { error: authErr } = await supabase.auth.updateUser({ phone });
      if (authErr && !authErr.message?.includes('rate limit')) {
        console.warn("Auth phone update warning:", authErr.message);
      }
      if (refreshUser) await refreshUser();
      setIsEditingPhone(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailInput) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: emailInput });
      if (error) throw error;
      alert("A verification link has been sent to " + emailInput);
      setIsEditingEmail(false);
    } catch (err) {
      alert("Error updating email: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { category }
      });
      if (error) throw error;
      
      const { error: profileError } = await supabase.from('profiles').update({ industry: category }).eq('id', user.id);
      if (profileError) throw profileError;

      if (refreshUser) await refreshUser();
      setIsEditingCategory(false);
    } catch (err) {
      alert("Error updating category: " + err.message);
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
      <div className="mb-12 text-center relative pt-4">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent dark:from-indigo-900/20 rounded-full blur-3xl opacity-70"></div>
        <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-b from-indigo-50 to-indigo-100/50 dark:from-indigo-900/40 dark:to-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-6 ring-1 ring-indigo-200/50 dark:ring-indigo-800/50 shadow-sm">
          <User className="w-6 h-6" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight mb-4 pb-1">
          Personal Info
        </h1>
        <p className="text-slate-600 dark:text-muted-foreground text-[1.1rem] max-w-xl mx-auto leading-relaxed">
          Info about you and your preferences across Optavel services.
        </p>
      </div>

      <div className="space-y-6">
        
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden">
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
                     <div className={`relative shrink-0 rounded-full ${
                        isSuperAdmin ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-background' :
                        isPremium ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background' : ''
                     }`}>
                       {safeAvatarUrl ? (
                          <img src={safeAvatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-100" />
                       ) : (
                          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-medium">
                            {getInitials()}
                          </div>
                       )}
                       
                       {isPremium && (
                         <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-30 flex items-center gap-0.5">
                           <Crown className="w-2.5 h-2.5" /> Pro
                         </div>
                       )}
                       {isSuperAdmin && (
                         <div className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-30">
                           Admin
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
                     <button type="button" onClick={(e) => { e.stopPropagation(); handleSaveName(); }} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save</button>
                     <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditingName(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between w-full" onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}>
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
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               {isEditingBirthday ? (
                 <div className="space-y-4 max-w-md">
                   <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Birthday</div>
                   <input 
                     type="date" 
                     value={birthday} 
                     onChange={e => setBirthday(e.target.value)}
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <div className="flex gap-2 pt-2">
                     <button type="button" onClick={(e) => { e.stopPropagation(); handleSaveBirthday(); }} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save</button>
                     <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditingBirthday(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between w-full" onClick={(e) => { e.stopPropagation(); setIsEditingBirthday(true); }}>
                   <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Birthday</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {birthday ? new Date(birthday).toLocaleDateString() : "Add birthday"}
                      </div>
                   </div>
                   <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </div>
               )}
            </div>
            
            {/* Category */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               {isEditingCategory ? (
                 <div className="space-y-4 max-w-md">
                   <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Category / Industry</div>
                   <input 
                     type="text" 
                     value={category} 
                     onChange={e => setCategory(e.target.value)}
                     placeholder="e.g. Legal, Healthcare, Real Estate"
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <div className="flex gap-2 pt-2">
                     <button type="button" onClick={(e) => { e.stopPropagation(); handleSaveCategory(); }} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save</button>
                     <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditingCategory(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between w-full" onClick={(e) => { e.stopPropagation(); setIsEditingCategory(true); }}>
                   <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {category || "Add your category"}
                      </div>
                   </div>
                   <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Contact info</h2>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Email */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               {isEditingEmail ? (
                 <div className="space-y-4 max-w-md">
                   <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email</div>
                   <input 
                     type="email" 
                     value={emailInput} 
                     onChange={e => setEmailInput(e.target.value)}
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <div className="flex gap-2 pt-2">
                     <button type="button" onClick={(e) => { e.stopPropagation(); handleSaveEmail(); }} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save</button>
                     <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditingEmail(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between w-full" onClick={(e) => { e.stopPropagation(); setIsEditingEmail(true); }}>
                   <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">Email</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">{user?.email}</div>
                   </div>
                   <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </div>
               )}
            </div>
            
            {/* Phone */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
               {isEditingPhone ? (
                 <div className="space-y-4 max-w-md">
                   <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Phone</div>
                   <input 
                     type="tel" 
                     value={phone} 
                     onChange={e => setPhone(e.target.value)}
                     placeholder="+1 (555) 000-0000"
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <div className="flex gap-2 pt-2">
                     <button type="button" onClick={(e) => { e.stopPropagation(); handleSavePhone(); }} disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save</button>
                     <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditingPhone(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between w-full" onClick={(e) => { e.stopPropagation(); setIsEditingPhone(true); }}>
                   <div className="flex-1 grid grid-cols-[120px_1fr] md:grid-cols-[160px_1fr] items-center">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {phone || "Add a recovery phone"}
                      </div>
                   </div>
                   <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </div>
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
