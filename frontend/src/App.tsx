import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { OverviewDashboard } from './components/OverviewDashboard';
import { InteractiveMap } from './components/InteractiveMap';
import { AdminWasteReports } from './components/AdminWasteReports';
import { DustBinManagement } from './components/DustBinManagement';
import { TruckCapacityManagement } from './components/TruckCapacityManagement';
import { CombinedCollectionPlanning } from './components/CombinedCollectionPlanning';
import { ActiveTrips } from './components/ActiveTrips';
import { RecyclingManagement } from './components/RecyclingManagement';
import { DriverDashboard } from './components/DriverDashboard';
import { AnalyticsReports } from './components/AnalyticsReports';
import { AuditLogViewer } from './components/AuditLogViewer';
import { CitizenPortal } from './components/CitizenPortal';
import { User } from './types';
import { Recycle, Database, Server, ShieldCheck, Heart } from 'lucide-react';

const STORAGE_KEY = 'smart_waste_user';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'CITIZEN') return 'citizen-report';
        if (u.role === 'DRIVER') return 'driver-dashboard';
        return 'overview';
      }
    } catch {
      // ignore
    }
    return 'overview';
  });

  // Navigation cross-linking states
  const [preselectedReportId, setPreselectedReportId] = useState<number | null>(null);
  const [preselectedTripId, setPreselectedTripId] = useState<number | null>(null);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    if (user.role === 'CITIZEN') {
      setCurrentTab('citizen-report');
    } else if (user.role === 'DRIVER') {
      setCurrentTab('driver-dashboard');
    } else {
      setCurrentTab('overview');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setPreselectedReportId(null);
    setPreselectedTripId(null);
  };

  const handleSwitchUser = (role: 'ADMIN' | 'DRIVER' | 'CITIZEN') => {
    if (!currentUser) return;
    let switchedUser: User;
    if (role === 'ADMIN') {
      switchedUser = {
        id: 1,
        fullName: 'Municipal Administrator',
        email: 'admin@smartcity.gov',
        role: 'ADMIN',
        phone: '0424-2223344',
        areaName: 'Perundurai HQ',
      };
    } else if (role === 'DRIVER') {
      switchedUser = {
        id: 4,
        fullName: 'Murugan S (Driver)',
        email: 'driver@smartcity.gov',
        role: 'DRIVER',
        phone: '9842100001',
        areaName: 'Perundurai Central',
      };
    } else {
      switchedUser = {
        id: 2,
        fullName: 'Pravin Kumar',
        email: 'pravin@gmail.com',
        role: 'CITIZEN',
        phone: '9876543210',
        areaName: 'Perundurai',
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(switchedUser));
    setCurrentUser(switchedUser);
    setCurrentTab(
      role === 'ADMIN' ? 'overview' : role === 'DRIVER' ? 'driver-dashboard' : 'citizen-report'
    );
  };

  const handlePlanReportFromExternal = (reportId: number) => {
    setPreselectedReportId(reportId);
    setCurrentTab('planning');
  };

  const handleNavigateToRecycling = (tripId: number) => {
    setPreselectedTripId(tripId);
    setCurrentTab('recycling');
  };

  // If unauthenticated, display professional Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Route protection
  const adminOnlyTabs = ['overview', 'reports', 'bins', 'trucks', 'planning', 'trips', 'recycling', 'analytics', 'audit'];
  let effectiveTab = currentTab;
  if (currentUser.role === 'CITIZEN' && adminOnlyTabs.includes(currentTab)) {
    effectiveTab = 'citizen-report';
  } else if (currentUser.role === 'DRIVER' && adminOnlyTabs.includes(currentTab)) {
    effectiveTab = 'driver-dashboard';
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentTab={effectiveTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {effectiveTab === 'overview' && (
          <OverviewDashboard onNavigate={(tab) => setCurrentTab(tab)} />
        )}

        {effectiveTab === 'map' && (
          <InteractiveMap onPlanReport={handlePlanReportFromExternal} />
        )}

        {effectiveTab === 'reports' && (
          <AdminWasteReports
            onPlanReport={handlePlanReportFromExternal}
            onViewOnMap={() => setCurrentTab('map')}
          />
        )}

        {effectiveTab === 'bins' && <DustBinManagement />}

        {effectiveTab === 'trucks' && <TruckCapacityManagement />}

        {effectiveTab === 'planning' && (
          <CombinedCollectionPlanning
            preselectedReportId={preselectedReportId}
            onTripConfirmed={(tripId) => {
              setPreselectedTripId(tripId);
              setCurrentTab('trips');
            }}
          />
        )}

        {effectiveTab === 'trips' && (
          <ActiveTrips onNavigateToRecycling={handleNavigateToRecycling} />
        )}

        {effectiveTab === 'recycling' && (
          <RecyclingManagement preselectedTripId={preselectedTripId} />
        )}

        {effectiveTab === 'driver-dashboard' && (
          <DriverDashboard
            currentUser={currentUser}
            onNavigateToMap={() => setCurrentTab('map')}
          />
        )}

        {effectiveTab === 'analytics' && <AnalyticsReports />}

        {effectiveTab === 'audit' && <AuditLogViewer />}

        {effectiveTab === 'citizen-report' && (
          <CitizenPortal currentUser={currentUser} initialTab="report" />
        )}

        {effectiveTab === 'citizen-my-reports' && (
          <CitizenPortal currentUser={currentUser} initialTab="my-reports" />
        )}
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Recycle className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">
              Smart City Waste Collection Optimization &amp; Recycling Management
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>MySQL: Connected (smart_waste_db)</span>
            </span>

            <span className="flex items-center space-x-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
              <Server className="w-3 h-3 text-blue-600" />
              <span>Spring Boot: Port 8080</span>
            </span>

            <span className="text-slate-400 hidden md:inline">
              Rule-Based Deterministic Algorithms
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
