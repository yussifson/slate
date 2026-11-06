import React, { useState, useEffect } from 'react';
import {
  User, Lock, Mail, Phone, Shield, KeyRound, Save, RefreshCw,
  Building, CheckCircle2, Eye, EyeOff, Award, Camera
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { usePowerSync } from '@powersync/react';
import { useCompanyId, useCompany } from '@/hooks/useCompanyId';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const powerSync = usePowerSync();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setSavingProfile(true);
    try {
      // 1. Update in profiles table via PowerSync
      await powerSync.execute(
        `UPDATE profiles SET full_name = ?, phone = ?, avatar_url = ? WHERE id = ?`,
        [fullName.trim(), phone.trim() || null, avatarUrl.trim() || null, user.id]
      );

      // 2. Update Supabase auth user metadata
      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl.trim() || null
        }
      });
      if (metaErr) throw metaErr;

      await refreshUser();
      toast.success('Profile details updated successfully');
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${fullName || user?.email || 'User'}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── Top Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005A9C] via-[#00477D] to-[#0A2540] p-6 text-white shadow-lg shadow-[#005A9C]/15 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative group">
            <img
              src={avatarUrl || defaultAvatar}
              alt={fullName}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-white/30 bg-white/10 shadow-md"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">{fullName || 'User Profile'}</h1>
              <Badge className="bg-[#FF6B00] text-white text-[10px] capitalize">
                {user?.role?.replace(/_/g, ' ') || 'Staff Member'}
              </Badge>
            </div>
            <p className="text-xs text-white/80 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
              {phone && <span className="flex items-center gap-1 ml-2"><Phone className="h-3.5 w-3.5" /> {phone}</span>}
            </p>
            <p className="text-[11px] text-white/60">
              Organization: <strong className="text-white">{company?.name || 'JCL Royal Group'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs for Profile & Password ── */}
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="account" className="text-xs font-semibold flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            General Information
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-semibold flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Password & Security
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Account Info */}
        <TabsContent value="account">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground">User Profile Details</CardTitle>
              <CardDescription className="text-xs">
                Manage your name, primary contact phone, and avatar identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Full Legal Name *</Label>
                    <Input
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Samuel Mensah"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Email Address (Locked)</Label>
                    <Input
                      disabled
                      value={user?.email || ''}
                      className="text-xs bg-muted/40 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Phone Number</Label>
                    <Input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Assigned System Role</Label>
                    <Input
                      disabled
                      value={user?.role?.replace(/_/g, ' ') || 'Staff Member'}
                      className="text-xs bg-muted/40 cursor-not-allowed capitalize text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Avatar Image URL</Label>
                  <Input
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://... image link"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank to automatically use your initials.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    {savingProfile ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security & Password */}
        <TabsContent value="security">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground">Password & Credentials</CardTitle>
              <CardDescription className="text-xs">
                Update your account password to ensure secure access to JCL Royal Group systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="text-xs pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Confirm New Password</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="bg-[#005A9C] hover:bg-[#00477D] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    {savingPassword ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
