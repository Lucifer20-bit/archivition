/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, PenTool, ShoppingBag, Megaphone, User, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 w-full text-sm font-medium transition-colors rounded-lg",
      active 
        ? "bg-black text-white" 
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

export const Layout = ({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rotate-45" />
            </div>
            ARCHIVISION
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem 
            icon={<PenTool size={20} />} 
            label="Editor" 
            active={activeTab === 'editor'} 
            onClick={() => setActiveTab('editor')}
          />
          <SidebarItem 
            icon={<ShoppingBag size={20} />} 
            label="Marketplace" 
            active={activeTab === 'marketplace'} 
            onClick={() => setActiveTab('marketplace')}
          />
          <SidebarItem 
            icon={<Megaphone size={20} />} 
            label="Marketing Studio" 
            active={activeTab === 'marketing'} 
            onClick={() => setActiveTab('marketing')}
          />
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-zinc-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.displayName || 'Architect'}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email || 'architect@example.com'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="mt-2 flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  );
};
