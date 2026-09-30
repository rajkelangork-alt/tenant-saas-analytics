import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Team', path: '/users', altPaths: ['/team'], icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isItemActive = (item) => {
    if (location.pathname === item.path) return true;
    if (item.altPaths?.includes(location.pathname)) return true;
    return false;
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white/80 backdrop-blur px-6 py-8 flex flex-col justify-between shrink-0">
        <div>
          <div className="mb-8">
            <h1 className="text-base font-semibold tracking-tight text-gray-900">SaaS Metrics</h1>
            <p className="text-xs text-gray-400 mt-0.5">Workspace Tenant</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    active
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${active ? 'text-gray-900' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.email || 'User'}</p>
            <p className="text-[11px] text-gray-400 capitalize">{user?.role?.toLowerCase() || 'member'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}