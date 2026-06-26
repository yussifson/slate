import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { LogOut, Globe, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  Company Portal
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Client Workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-slate-500 rounded-full">
                <Bell className="w-5 h-5" />
              </Button>
              
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div className="hidden sm:block text-sm">
                  <p className="font-medium text-slate-700">{user?.email}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600 gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-2xl min-h-[60vh]">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          Secure Portal infrastructure powered by Slate.
        </div>
      </footer>
    </div>
  );
}
