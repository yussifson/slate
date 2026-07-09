import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Key, Grid, LogOut, ExternalLink, Activity, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Logo } from '@/components/ui/Logo';

export default function AccountPortal() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleGlobalLogout = () => {
    // Calling logout() on the account domain will trigger a full global logout
    logout(true);
  };

  const apps = [
    {
      id: "slate",
      name: "Optavel Slate",
      description: "Core Operating System",
      icon: <Activity className="w-8 h-8 text-primary" />,
      url: "https://slate.optavel.com",
    },
    {
      id: "preloom",
      name: "Pre-loom",
      description: "Video & Meetings",
      icon: <Video className="w-8 h-8 text-indigo-500" />,
      url: "https://preloom.optavel.com",
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020817] flex flex-col">
      <Helmet>
        <title>Optavel Account</title>
      </Helmet>

      {/* Header */}
      <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Logo hideText={true} />
          <span className="font-semibold text-lg hidden sm:block">Account Settings</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Welcome Section */}
        <div className="text-center sm:text-left space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome, {user?.user_metadata?.first_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your info, privacy, and security to make Optavel work better for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Profile Card */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Global Identity</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This account serves as your master key to all Optavel products.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <p className="font-medium text-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account ID</label>
                    <p className="text-xs font-mono text-muted-foreground break-all bg-muted p-2 rounded mt-1">
                      {user?.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Security & Password</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Keep your account secure by updating your password regularly.
                </p>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <a href="/reset-password">Change Password</a>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Connected Apps */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Grid className="w-5 h-5 text-muted-foreground" />
            Your Ecosystem
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.url}
                className="group flex flex-col p-6 bg-card border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="mb-4 p-3 bg-muted rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  {app.icon}
                </div>
                <h3 className="font-semibold text-lg">{app.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-12 pb-8">
          <Card className="p-6 border-destructive/20 bg-destructive/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-destructive">Global Sign Out</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Signing out here will revoke your access across all Optavel applications simultaneously.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleGlobalLogout}
                className="shrink-0 gap-2 w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Everywhere
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
