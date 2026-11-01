import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Edit2,
  CheckCircle2,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { DustBin } from '../types';
import { api } from '../api/client';

export const DustBinManagement: React.FC = () => {
  const [bins, setBins] = useState<DustBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal for editing bin fill level
  const [editingBin, setEditingBin] = useState<DustBin | null>(null);
  const [newFillKg, setNewFillKg] = useState<number>(0);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const fetchBins = async () => {
    try {
      setLoading(true);
      const data = await api.getAllBins();
      setBins(data);
    } catch (err: any) {
      console.error('Failed to load bins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  const handleUpdateFill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBin) return;

    try {
      setUpdating(true);
      setUpdateMsg(null);
      await api.updateBinFill(editingBin.binId, newFillKg);
      setUpdateMsg(`Bin ${editingBin.binCode} fill level updated to ${newFillKg} kg.`);
      fetchBins();
      setTimeout(() => {
        setEditingBin(null);
        setUpdateMsg(null);
      }, 1000);
    } catch (err: any) {
      setUpdateMsg(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const filteredBins = bins.filter((bin) => {
    const matchesSearch =
      bin.binCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.wasteCategory.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'URGENT') return bin.fillPercentage >= 75;
    if (filterStatus === 'MODERATE') return bin.fillPercentage >= 50 && bin.fillPercentage < 75;
    if (filterStatus === 'LOW') return bin.fillPercentage < 50;
    if (filterStatus === 'SCHEDULED') return bin.collectionStatus === 'SCHEDULED';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-emerald-600" />
            <span>Municipal Dustbin Telemetry &amp; Inventory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative municipal collection points. Prevents conflicting assignments across simultaneous trips.
          </p>
        </div>

        <button
          onClick={fetchBins}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by code, locality, material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {[
            { id: 'ALL', label: 'All Bins' },
            { id: 'URGENT', label: 'Urgent (>75%)' },
            { id: 'MODERATE', label: 'Moderate (50-75%)' },
            { id: 'LOW', label: 'Low (<50%)' },
            { id: 'SCHEDULED', label: 'Scheduled in Trip' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === f.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bins Table View */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="py-3 px-4">Bin Code</th>
                <th className="py-3 px-4">Locality / Zone</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Capacity &amp; Fill Level</th>
                <th className="py-3 px-4">Fill Percentage</th>
                <th className="py-3 px-4">Collection Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No dustbins matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredBins.map((bin) => {
                  const isUrgent = bin.fillPercentage >= 75;
                  const isModerate = bin.fillPercentage >= 50 && bin.fillPercentage < 75;
                  const isScheduled = bin.collectionStatus === 'SCHEDULED';

                  return (
                    <tr key={bin.binId} className="hover:bg-slate-50/70 transition-all">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <Trash2 className="w-4 h-4 text-emerald-600" />
                        <span>{bin.binCode}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-semibold">{bin.areaName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{bin.areaId}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {bin.latitude.toFixed(4)}, {bin.longitude.toFixed(4)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-800">
                          {bin.wasteCategory}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold">
                        <span className="text-slate-900">{bin.currentFillKg} kg</span>
                        <span className="text-slate-400 font-normal"> / {bin.binCapacityKg} kg</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2 w-28">
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isUrgent ? 'bg-red-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${bin.fillPercentage}%` }}
                            ></div>
                          </div>
                          <span className={`font-bold text-[11px] ${isUrgent ? 'text-red-600' : 'text-slate-700'}`}>
                            {bin.fillPercentage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isScheduled
                              ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {bin.collectionStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingBin(bin);
                            setNewFillKg(bin.currentFillKg);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center space-x-1 ml-auto transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Simulate Fill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Fill Level Modal */}
      {editingBin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0">Update Fill Level</h3>
                <p className="text-xs text-slate-500">Bin: {editingBin.binCode} ({editingBin.areaName})</p>
              </div>
              <button
                onClick={() => setEditingBin(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {updateMsg && (
              <p className="text-xs p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                {updateMsg}
              </p>
            )}

            <form onSubmit={handleUpdateFill} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Current Waste Quantity:</span>
                  <span className="text-emerald-700 font-bold">{newFillKg} kg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={editingBin.binCapacityKg}
                  step="5"
                  value={newFillKg}
                  onChange={(e) => setNewFillKg(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 kg (Empty)</span>
                  <span>{editingBin.binCapacityKg / 2} kg (50%)</span>
                  <span>{editingBin.binCapacityKg} kg (Full)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>New Fill Percentage:</span>
                  <strong className="text-slate-900">
                    {Math.round((newFillKg / editingBin.binCapacityKg) * 100)}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Capacity:</span>
                  <span>{editingBin.binCapacityKg} kg</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBin(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {updating ? 'Saving...' : 'Apply Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
