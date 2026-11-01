import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Recycle,
  CheckCircle2,
  Truck,
  RefreshCw,
  Scale,
  MapPin,
  FileText,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../api/client';

export const AnalyticsReports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
        <p className="text-xs font-semibold">Aggregating database analytics...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Database-Backed Operational Analytics &amp; Reporting</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated directly from MySQL records. No fabricated historical curves or assumed statistics.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Verified Waste</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{stats.totalWasteCollectedKg}</span>
            <span className="text-xs text-slate-500">kg collected</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Physically gathered across completed trips.</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Recycled &amp; Diverted</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-purple-700">{stats.totalWasteRecycledKg}</span>
            <span className="text-xs text-slate-500">kg confirmed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Received and processed by registered recovery plants.</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Combined Trip Ratio</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700">
              {stats.totalTrips > 0 ? Math.round((stats.combinedTripsCount / stats.totalTrips) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500">({stats.combinedTripsCount}/{stats.totalTrips} trips)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Roadside dump collected together with municipal bins.</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Average Bin Saturation</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">{stats.averageBinFillPercentage}%</span>
            <span className="text-xs text-slate-500">across {stats.totalBins} bins</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{stats.binsAbove75Pct} bins currently above 75% capacity.</p>
        </div>
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 m-0 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Waste Materials Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">{stats.totalReports} Total Reports</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.reportsByCategory).map(([cat, count]) => {
              const pct = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{cat}</span>
                    <span>{count} reports ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Locality Density */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 m-0 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Geographic Complaint Concentration</span>
            </h3>
            <span className="text-xs text-slate-400">{Object.keys(stats.reportsByLocality).length} Localities</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.reportsByLocality).map(([area, count]) => {
              const pct = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
              return (
                <div key={area} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{area}</span>
                    <span>{count} reports ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dispatches by Facility Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 m-0 flex items-center space-x-2">
          <Recycle className="w-4 h-4 text-purple-600" />
          <span>Industrial Facility Recovery Transfers</span>
        </h3>

        {Object.keys(stats.dispatchesByFacility).length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">
            No recycling dispatches completed yet. Dispatches will populate here as completed collection trips are transferred to registered facilities.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {Object.entries(stats.dispatchesByFacility).map(([fac, count]) => (
              <div key={fac} className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                <span className="font-bold text-xs text-purple-950 block truncate">{fac}</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-lg font-bold text-purple-700">{count}</span>
                  <span className="text-[11px] text-purple-500">manifests received</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
