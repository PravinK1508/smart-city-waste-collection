import React from 'react';
import {
  Recycle,
  LayoutDashboard,
  MapPin,
  FileText,
  Trash2,
  Truck,
  Layers,
  CheckCircle2,
  Building2,
  FlaskConical,
  BarChart3,
  History,
  UserCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  highlight?: boolean;
}

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  onSwitchUser: (role: 'ADMIN' | 'DRIVER' | 'CITIZEN') => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchUser,
  onLogout,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  const adminNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Interactive Map', icon: MapPin },
    { id: 'reports', label: 'Waste Reports', icon: FileText },
    { id: 'bins', label: 'Municipal Bins', icon: Trash2 },
    { id: 'trucks', label: 'Trucks & Capacity', icon: Truck },
    {
      id: 'planning',
      label: 'Combined Planning',
      icon: Layers,
      highlight: true,
    },
    { id: 'trips', label: 'Active Trips', icon: CheckCircle2 },
    { id: 'recycling', label: 'Recycling Dispatch', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const driverNavItems: NavItem[] = [
    { id: 'driver-dashboard', label: 'Driver Operations & Trips', icon: Truck, highlight: true },
    { id: 'map', label: 'Live City Map', icon: MapPin },
  ];

  const citizenNavItems: NavItem[] = [
    { id: 'citizen-report', label: 'Report Waste Issue', icon: FileText },
    { id: 'citizen-my-reports', label: 'My Submissions', icon: CheckCircle2 },
    { id: 'map', label: 'Public Map View', icon: MapPin },
  ];

  const navItems = currentUser.role === 'ADMIN'
    ? adminNavItems
    : currentUser.role === 'DRIVER'
    ? driverNavItems
    : citizenNavItems;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-emerald-100 shadow-xs">
      {/* Top Banner & Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() =>
              setCurrentTab(
                currentUser.role === 'ADMIN'
                  ? 'overview'
                  : currentUser.role === 'DRIVER'
                  ? 'driver-dashboard'
                  : 'citizen-report'
              )
            }
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Recycle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Smart<span className="text-emerald-600">Waste</span>
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Optimizer
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Municipal Waste Collection &amp; Recycling Management
              </p>
            </div>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">
                {currentUser.fullName}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {currentUser.email}
              </span>
            </div>

            <div className="flex items-center bg-emerald-50 border border-emerald-200 p-1 rounded-xl">
              <button
                onClick={() => onSwitchUser('ADMIN')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => onSwitchUser('DRIVER')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentUser.role === 'DRIVER'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Driver
              </button>
              <button
                onClick={() => onSwitchUser('CITIZEN')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentUser.role === 'CITIZEN'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Citizen
              </button>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out of Session"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Tab Bar */}
      <div className="bg-emerald-700 text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-emerald-800 font-bold shadow-sm'
                      : 'text-emerald-50 hover:bg-emerald-600 hover:text-white'
                  } ${item.highlight ? 'ring-1 ring-emerald-300' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-emerald-200'}`} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="bg-amber-400 text-amber-950 text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                      CORE
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
