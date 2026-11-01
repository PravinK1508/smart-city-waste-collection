import React, { useState, useEffect } from 'react';
import {
  Truck as TruckIcon,
  RefreshCw,
  Gauge,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Truck } from '../types';
import { api } from '../api/client';

export const TruckCapacityManagement: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const data = await api.getAllTrucks();
      setTrucks(data);
    } catch (err) {
      console.error('Failed to load trucks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const handleStatusChange = async (truckId: number, newStatus: string) => {
    try {
      await api.updateTruckStatus(truckId, newStatus, 'Municipal Fleet Manager');
      fetchTrucks();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const filteredTrucks = trucks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.operationalStatus === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center space-x-2">
            <TruckIcon className="w-5 h-5 text-emerald-600" />
            <span>Municipal Fleet &amp; Payload Capacity Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative truck records from MySQL. Formula: <strong>Remaining Capacity = Total Capacity − Current Load</strong>.
          </p>
        </div>

        <button
          onClick={fetchTrucks}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Fleet Filter:</span>
        </span>
        {[
          { id: 'ALL', label: 'All Fleet' },
          { id: 'AVAILABLE', label: 'Available for Dispatch' },
          { id: 'ASSIGNED', label: 'Assigned to Trip' },
          { id: 'EN_ROUTE', label: 'En Route' },
          { id: 'MAINTENANCE', label: 'Maintenance' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === f.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Truck Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTrucks.map((truck) => {
          const isAvail = truck.operationalStatus === 'AVAILABLE';
          const utilizationPct =
            truck.totalCapacityKg > 0
              ? Math.min(100, Math.round((truck.currentLoadKg / truck.totalCapacityKg) * 100))
              : 0;

          return (
            <div
              key={truck.truckId}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:border-emerald-200 transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                      isAvail ? 'bg-emerald-600 shadow-md shadow-emerald-200' : 'bg-slate-600'
                    }`}
                  >
                    <TruckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-base">{truck.truckCode}</h3>
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {truck.registrationNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{truck.truckType}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isAvail
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {truck.operationalStatus}
                </span>
              </div>

              {/* Payload Progress Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Payload Capacity Meter:</span>
                  <span className={utilizationPct > 80 ? 'text-red-600' : 'text-emerald-700'}>
                    {truck.currentLoadKg} kg / {truck.totalCapacityKg} kg ({utilizationPct}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      utilizationPct > 80
                        ? 'bg-red-500'
                        : utilizationPct > 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${utilizationPct}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs">
                  <span className="text-slate-500">
                    Remaining Available Payload:
                  </span>
                  <span className="text-sm font-bold text-emerald-800 bg-emerald-100/60 px-2.5 py-0.5 rounded-lg">
                    {truck.remainingCapacityKg} kg
                  </span>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Assigned Territory</span>
                  <span className="font-semibold text-slate-800">{truck.assignedArea || 'Erode Municipal District'}</span>
                </div>

                <div className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Current Stored GPS</span>
                  <span className="font-semibold text-slate-800">
                    {truck.currentLatitude ? `${truck.currentLatitude.toFixed(4)}, ${truck.currentLongitude?.toFixed(4)}` : 'Depot'}
                  </span>
                </div>
              </div>

              {/* Quick Status Toggles */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Change Status:</span>
                <div className="flex space-x-1.5">
                  {truck.operationalStatus !== 'AVAILABLE' && (
                    <button
                      onClick={() => handleStatusChange(truck.truckId, 'AVAILABLE')}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      Set Available
                    </button>
                  )}
                  {truck.operationalStatus !== 'MAINTENANCE' && (
                    <button
                      onClick={() => handleStatusChange(truck.truckId, 'MAINTENANCE')}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      Set Maintenance
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
