import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Tags, ShieldAlert, BrainCircuit, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function ClipadAdminLayout() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const basePath = window.location.pathname.startsWith('/clipad') ? '/clipad/admin' : '/admin';
  
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: basePath },
    { name: 'Companies', icon: Building2, path: `${basePath}/companies` },
    { name: 'Pricing Tags', icon: Tags, path: `${basePath}/pricing` },
    { name: 'Audit Monitor', icon: ShieldAlert, path: `${basePath}/audit` },
    { name: 'Admin AI', icon: BrainCircuit, path: `${basePath}/ai` },
  ];

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CliPad Super Admin</h2>
          <p className="text-xs text-muted-foreground mt-1">Management Console</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === basePath}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Admin
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-30 page-enter">
        <div className="md:hidden p-4 border-b border-border bg-card flex items-center justify-between">
            <h2 className="text-lg font-bold">CliPad Admin</h2>
            <button onClick={() => navigate('/dashboard')}><ArrowLeft className="w-5 h-5"/></button>
        </div>
        <div className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
