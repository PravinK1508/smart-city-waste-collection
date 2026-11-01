import React, { useState, useEffect } from 'react';
import { History, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../api/client';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>Immutable Operational Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chronological log of reports, trip dispatches, truck capacity reservations, and recycling completions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status Transition</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{log.entityType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: #{log.entityId}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {log.oldStatus || log.newStatus ? (
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400">{log.oldStatus || 'NONE'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900">{log.newStatus}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {log.performedBy || 'System'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
