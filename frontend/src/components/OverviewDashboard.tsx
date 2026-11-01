import React, { useEffect, useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Trash2,
  Truck,
  CheckCircle2,
  Recycle,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../api/client';

interface OverviewDashboardProps {
  onNavigate: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm font-medium">Loading operational metrics from MySQL database...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 m-6">
        <div className="flex items-center space-x-2 font-bold mb-1">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Error Loading Dashboard Statistics</span>
        </div>
        <p className="text-sm">{error || 'Could not connect to database backend.'}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-emerald-500/30 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Operational Live Feed
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2 text-white">
            Smart Municipal Waste Command Center
          </h1>
          <p className="text-emerald-100 text-sm mt-1 leading-relaxed">
            Real-time optimization engine combining citizen-reported roadside dumping with nearby municipal dustbin collections to maximize fleet capacity and minimize redundant trips.
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => onNavigate('planning')}
              className="bg-white text-emerald-900 px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-50 flex items-center space-x-2 transition-all"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Launch Combined Collection Planner</span>
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="bg-emerald-700/60 text-white hover:bg-emerald-700 border border-emerald-400/30 px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>Open Geographic Operations Map</span>
            </button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          <Recycle className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Citizen Waste Reports */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citizen Reports</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalReports}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-amber-600 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block"></span>
              <span>{stats.pendingReports} Pending Action</span>
            </span>
            <button onClick={() => onNavigate('reports')} className="text-emerald-700 hover:underline flex items-center">
              Review <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Municipal Dustbins */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Municipal Dustbins</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalBins}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-600">
              Avg Fill: <strong className="text-emerald-700">{stats.averageBinFillPercentage}%</strong>
            </span>
            <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
              {stats.binsAbove75Pct} Urgent (&gt;75%)
            </span>
          </div>
        </div>

        {/* Card 3: Collection Fleet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Truck Fleet</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTrucks}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-emerald-600 font-semibold">
              {stats.availableTrucks} Available
            </span>
            <span className="text-slate-500">
              {stats.busyTrucks} En Route/Assigned
            </span>
          </div>
        </div>

        {/* Card 4: Recycling Transfers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recycling Dispatches</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalRecyclingDispatches}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-purple-700 font-semibold">
              {stats.deliveredRecyclingDispatches} Delivered &amp; Verified
            </span>
            <button onClick={() => onNavigate('recycling')} className="text-emerald-700 hover:underline flex items-center">
              Details <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Innovation Summary Card: Combined Optimization Efficiency */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-lg font-bold text-slate-900 m-0">
                Optimization Core: Combined Roadside &amp; Dustbin Collection
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Measuring efficiency gains from collecting roadside citizen complaints alongside nearby municipal bins.
            </p>
          </div>

          <button
            onClick={() => onNavigate('planning')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>Plan Next Combined Route</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Combined Route Trips</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-emerald-700">{stats.combinedTripsCount}</span>
              <span className="text-xs text-slate-500">trips executed</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Trips that collected both roadside dump and municipal bins simultaneously.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Total Waste Collected</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-slate-800">{stats.totalWasteCollectedKg}</span>
              <span className="text-xs text-slate-500">kg recorded</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Verified weight measured during completed trip completions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Transferred to Recycling</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold text-purple-700">{stats.totalWasteRecycledKg}</span>
              <span className="text-xs text-slate-500">kg receipt confirmed</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Diverted from landfills directly into verified registered recovery facilities.
            </p>
          </div>
        </div>
      </div>

      {/* Reports Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reports by Category */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Waste Complaints by Material Category</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(stats.reportsByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reports recorded yet.</p>
            ) : (
              Object.entries(stats.reportsByCategory).map(([cat, count]) => {
                const percentage = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{cat}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reports by Locality */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Waste Complaints by Locality / Zone</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(stats.reportsByLocality).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reports recorded yet.</p>
            ) : (
              Object.entries(stats.reportsByLocality).map(([area, count]) => {
                const percentage = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                return (
                  <div key={area} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{area}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
