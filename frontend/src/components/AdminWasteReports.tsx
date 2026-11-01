import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Layers,
  MapPin,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { WasteReport } from '../types';
import { api } from '../api/client';

interface AdminWasteReportsProps {
  onPlanReport: (reportId: number) => void;
  onViewOnMap: (lat?: number, lng?: number) => void;
}

export const AdminWasteReports: React.FC<AdminWasteReportsProps> = ({
  onPlanReport,
  onViewOnMap,
}) => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getAllReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.citizenEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.wasteCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.reportId).includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ASSIGNED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'DISPATCHED':
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'COLLECTION_COMPLETED':
      case 'READY_FOR_RECYCLING':
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Citizen Roadside Waste Reports Repository</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Persisted citizen complaints from MySQL. Authoritative source for collection scheduling.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search report #, citizen email, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COLLECTION_COMPLETED', 'CLOSED'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === st
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Citizen &amp; Contact</th>
                <th className="py-3 px-4">Locality / Address</th>
                <th className="py-3 px-4">Material Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Est. Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No waste reports matching filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => (
                  <tr key={rep.reportId} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      #{rep.reportId}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {rep.citizenName || rep.citizenEmail}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rep.citizenPhone || rep.citizenEmail}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{rep.areaName}</span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-[150px]">
                        {rep.address || `${rep.latitude?.toFixed(4)}, ${rep.longitude?.toFixed(4)}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-50 text-emerald-800">
                        {rep.wasteCategory}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate text-slate-600" title={rep.description}>
                        "{rep.description}"
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {rep.estimatedQuantityKg} kg
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(rep.status)}`}>
                        {rep.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {rep.photoUrl && (
                          <button
                            onClick={() => setPhotoModalUrl(rep.photoUrl!)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            title="View Photo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {rep.status === 'PENDING' && (
                          <button
                            onClick={() => onPlanReport(rep.reportId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-xs"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Plan Collection</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {photoModalUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-3 animate-scale-up">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">Citizen Attached Photograph</span>
              <button
                onClick={() => setPhotoModalUrl(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <img
              src={photoModalUrl}
              alt="Waste verification"
              className="w-full h-80 object-cover rounded-2xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
