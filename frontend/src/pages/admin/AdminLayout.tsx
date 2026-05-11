import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { AtlasCharacter, AtlasBubble } from '../../components/atlas';
import { LayoutDashboard, Target, Brain, Map as MapIcon, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminLayout() {
  const { user, isLoading, signIn, signOut } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin text-accent-cyan rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="bg-bg-surface border border-border p-8 rounded-2xl w-full max-w-[400px] flex flex-col items-center text-center">
          <div className="flex justify-center mb-6 relative">
            <AtlasCharacter size="lg" showLabel={false} animate={true} />
            <div className="absolute top-0 -right-4 translate-x-full">
              <AtlasBubble message="Admin area. Prove you're the boss." side="right" typing={true} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">Admin Access</h1>
          <p className="text-text-secondary text-sm mb-8">Sign in with the Google account you registered first.</p>
          
          <button 
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <p className="text-xs text-text-muted mt-6 max-w-[250px]">
            Only the first registered account has admin access.
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/accuracy", icon: Target, label: "Accuracy" },
    { to: "/admin/atlasmind", icon: Brain, label: "AtlasMind" },
    { to: "/admin/places", icon: MapIcon, label: "Places" },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-[240px] border-r border-border bg-bg-surface/50 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-border-subtle">
          <AtlasCharacter size="sm" showLabel={false} />
          <span className="font-bold text-lg tracking-tight text-text-primary">Admin Panel</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors",
                isActive 
                  ? "bg-accent-cyan/10 text-accent-cyan" 
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border-subtle">
          <div className="flex flex-col gap-3">
            <div className="text-xs font-medium text-text-secondary truncate px-2">
              {user.email}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 w-full text-sm font-medium text-accent-red/80 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Tab Bar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border z-50 px-2 pt-2 pb-safe">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 p-2 min-w-[64px]",
                isActive ? "text-accent-cyan" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
