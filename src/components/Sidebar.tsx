import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Zap, History, Key, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Collections', icon: Database, path: '/collections' },
    { name: 'Integrations', icon: Zap, path: '/integrations' },
    { name: 'API Keys', icon: Key, path: '/api-keys' },
    { name: 'API Logs', icon: History, path: '/logs' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 h-screen flex-col sticky top-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Database className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">DynamicAdmin</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-3 z-50 flex justify-around items-center backdrop-blur-lg bg-opacity-90">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
              location.pathname === item.path
                ? "text-indigo-500"
                : "text-slate-500"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
        <button 
          onClick={() => auth.signOut()}
          className="flex flex-col items-center gap-1 px-3 py-2 text-slate-500"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </div>
    </>
  );
};

export default Sidebar;
