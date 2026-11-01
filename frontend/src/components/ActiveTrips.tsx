import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Truck,
  Layers,
  Clock,
  ArrowRight,
  RefreshCw,
  Scale,
  Building2,
  MapPin,
  AlertTriangle,
  FileCheck,
  XCircle,
  Eye,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { CollectionTrip, DustBin, WasteReport, Truck as TruckType, RecyclingDispatch, RecyclingFacility } from '../types';
import { api } from '../api/client';

interface ActiveTripsProps {
  onNavigateToRecycling?: (tripId: number) => void;
}

export const ActiveTrips: React.FC<ActiveTripsProps> = ({ onNavigateToRecycling }) => {
  const [trips, setTrips] = useState<CollectionTrip[]>([]);
  const [trucks, setTrucks] = useState<Record<number, TruckType>>({});
  const [reports, setReports] = useState<Record<number, WasteReport>>({});
  const [bins, setBins] = useState<Record<number, DustBin>>({});
  const [dispatchesByTrip, setDispatchesByTrip] = useState<Record<number, RecyclingDispatch>>({});
  const [facilities, setFacilities] = useState<RecyclingFacility[]>([]);
  const [loading, setLoading] = useState(true);

  // Send to Recycling Facility Modal State
  const [assigningTrip, setAssigningTrip] = useState<CollectionTrip | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [submittingDispatch, setSubmittingDispatch] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Completion modal state
  const [completingTrip, setCompletingTrip] = useState<CollectionTrip | null>(null);
  const [actualRoadsideKg, setActualRoadsideKg] = useState<number>(40);
  const [actualBinWeights, setActualBinWeights] = useState<Record<number, number>>({});
  const [completionNotes, setCompletionNotes] = useState('');
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delivery Verification Modal State
  const [verifyingDispatch, setVerifyingDispatch] = useState<RecyclingDispatch | null>(null);
  const [verificationAction, setVerificationAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [verifiedWeightKg, setVerifiedWeightKg] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [adminVerificationNotes, setAdminVerificationNotes] = useState<string>('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  const fetchTripsAndMeta = async () => {
    try {
      setLoading(true);
      const [tripsData, trucksData, reportsData, binsData, dispatchesData, facilitiesData] = await Promise.all([
        api.getAllTrips(),
        api.getAllTrucks(),
        api.getAllReports(),
        api.getAllBins(),
        api.getDispatches(),
        api.getFacilities(),
      ]);

      const trkMap: Record<number, TruckType> = {};
      trucksData.forEach((t) => (trkMap[t.truckId] = t));

      const repMap: Record<number, WasteReport> = {};
      reportsData.forEach((r) => (repMap[r.reportId] = r));

      const binMap: Record<number, DustBin> = {};
      binsData.forEach((b) => (binMap[b.binId] = b));

      const dispMap: Record<number, RecyclingDispatch> = {};
      dispatchesData.forEach((d) => (dispMap[d.tripId] = d));

      setTrips(tripsData);
      setTrucks(trkMap);
      setReports(repMap);
      setBins(binMap);
      setDispatchesByTrip(dispMap);
      setFacilities(facilitiesData);
    } catch (err: any) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignFacility = (trip: CollectionTrip) => {
    setAssigningTrip(trip);
    const cat = trip.wasteCategory?.toUpperCase() || '';
    const compatible = facilities.find((f) =>
      f.operationalStatus === 'ACTIVE' &&
      (!cat || f.acceptedCategories.toUpperCase().includes(cat) || f.acceptedCategories.includes('ALL'))
    );
    setSelectedFacilityId(compatible ? compatible.facilityId : (facilities[0]?.facilityId || null));
    setDispatchNotes(`Dispatched collection payload for ${trip.wasteCategory || 'waste'}`);
    setErrorMsg(null);
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTrip || !selectedFacilityId) return;

    try {
      setSubmittingDispatch(true);
      setErrorMsg(null);
      const qty = assigningTrip.actualCollectedKg || assigningTrip.plannedTotalLoadKg || 40;
      await api.createDispatch(
        assigningTrip.tripId,
        selectedFacilityId,
        qty,
        dispatchNotes,
        'Municipal Admin'
      );
      setDispatchSuccessMsg('Recycling destination assigned successfully.');
      setAssigningTrip(null);
      await fetchTripsAndMeta();
      setTimeout(() => setDispatchSuccessMsg(null), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign recycling facility.');
    } finally {
      setSubmittingDispatch(false);
    }
  };

  useEffect(() => {
    fetchTripsAndMeta();
  }, []);

  const handleDispatch = async (tripId: number) => {
    try {
      await api.dispatchTrip(tripId, 'Municipal Dispatcher');
      fetchTripsAndMeta();
    } catch (err: any) {
      alert(`Dispatch failed: ${err.message}`);
    }
  };

  const handleStart = async (tripId: number) => {
    try {
      await api.startTrip(tripId, 'Truck Driver');
      fetchTripsAndMeta();
    } catch (err: any) {
      alert(`Start trip failed: ${err.message}`);
    }
  };

  const openCompletionModal = (trip: CollectionTrip) => {
    setCompletingTrip(trip);
    setActualRoadsideKg(trip.plannedRoadsideKg || 40);
    const initialBinWeights: Record<number, number> = {};
    if (trip.tripBins) {
      trip.tripBins.forEach((tb) => {
        initialBinWeights[tb.binId] = tb.plannedKg;
      });
    }
    setActualBinWeights(initialBinWeights);
    setCompletionNotes('Collection completed successfully along planned proximity sequence.');
    setErrorMsg(null);
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTrip) return;

    try {
      setSavingCompletion(true);
      setErrorMsg(null);
      await api.completeTrip(
        completingTrip.tripId,
        actualRoadsideKg,
        actualBinWeights,
        completionNotes,
        'Field Sanitation Officer'
      );
      setCompletingTrip(null);
      fetchTripsAndMeta();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete trip in database.');
    } finally {
      setSavingCompletion(false);
    }
  };

  const openApproveModal = (disp: RecyclingDispatch) => {
    setVerifyingDispatch(disp);
    setVerificationAction('APPROVE');
    setVerifiedWeightKg(disp.receivedWeightKg || disp.dispatchedQuantityKg || 40);
    setAdminVerificationNotes('Intake verified & accepted at facility weighbridge.');
    setRejectionReason('');
    setVerificationError(null);
  };

  const openRejectModal = (disp: RecyclingDispatch) => {
    setVerifyingDispatch(disp);
    setVerificationAction('REJECT');
    setRejectionReason('');
    setAdminVerificationNotes('');
    setVerificationError(null);
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDispatch || !verificationAction) return;

    if (verificationAction === 'REJECT' && (!rejectionReason || !rejectionReason.trim())) {
      setVerificationError('Please enter a rejection reason explaining what the driver needs to correct.');
      return;
    }

    try {
      setSubmittingVerification(true);
      setVerificationError(null);

      await api.verifyDelivery(
        verifyingDispatch.dispatchId,
        verificationAction,
        verificationAction === 'REJECT' ? rejectionReason : undefined,
        verificationAction === 'APPROVE' ? verifiedWeightKg : undefined,
        adminVerificationNotes || undefined,
        'Municipal Admin'
      );

      setVerifyingDispatch(null);
      setVerificationAction(null);
      fetchTripsAndMeta();
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to verify delivery.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const getTripStatusStyle = (st: string) => {
    switch (st) {
      case 'ASSIGNED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'DISPATCHED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'COLLECTION_COMPLETED':
      case 'READY_FOR_RECYCLING':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'DELIVERED_TO_FACILITY':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'PENDING_ADMIN_VERIFICATION':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse';
      case 'REUPLOAD_REQUESTED':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Active Collection Trips &amp; Delivery Verification</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Persisted operational lifecycle: Assigned → Dispatched → In Progress → Collection Completed → Ready for Recycling → Delivery Evidence Submitted → Admin Verified &amp; Closed.
          </p>
        </div>

        <button
          onClick={fetchTripsAndMeta}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trips</span>
        </button>
      </div>

      {dispatchSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* Operational Notification Alerts: Collection Completed -> Send to Recycling Facility */}
      {trips.some((t) => (t.status === 'READY_FOR_RECYCLING' || t.status === 'COLLECTION_COMPLETED') && !dispatchesByTrip[t.tripId]) && (
        <div className="space-y-3">
          {trips
            .filter((t) => (t.status === 'READY_FOR_RECYCLING' || t.status === 'COLLECTION_COMPLETED') && !dispatchesByTrip[t.tripId])
            .map((t) => {
              const rep = reports[t.primaryReportId];
              return (
                <div
                  key={`pending-rec-${t.tripId}`}
                  className="p-5 bg-purple-50/90 border-2 border-purple-300 rounded-3xl shadow-xs space-y-3 text-xs text-purple-950"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-200">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
                      <h4 className="font-bold text-sm text-purple-900 m-0">
                        Collection Completed — Driver {t.driverName || 'Murugan'} — {t.truckCode || `TRK-0${t.truckId}`} — Report #{t.primaryReportId}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAssignFacility(t)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Send to Recycling Facility</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-purple-600 block text-[11px] font-semibold uppercase">Driver &amp; Truck</span>
                      <strong className="text-slate-900 block">{t.driverName || 'Driver Murugan'}</strong>
                      <span className="text-slate-600 font-mono text-[11px]">{t.truckCode || `TRK-0${t.truckId}`}</span>
                    </div>

                    <div>
                      <span className="text-purple-600 block text-[11px] font-semibold uppercase">Citizen Waste Report</span>
                      <strong className="text-slate-900 block">Report #{t.primaryReportId} &bull; {t.wasteCategory || rep?.wasteCategory}</strong>
                      <span className="text-slate-600 text-[11px] truncate block">{rep?.address || t.reportAddress || 'Designated Collection Site'}</span>
                    </div>

                    <div>
                      <span className="text-purple-600 block text-[11px] font-semibold uppercase">Collected Quantity</span>
                      <strong className="text-purple-900 text-sm font-bold block">{t.actualCollectedKg || t.plannedTotalLoadKg} kg</strong>
                      {t.collectionNotes && (
                        <span className="text-slate-600 text-[11px] italic block">"{t.collectionNotes}"</span>
                      )}
                    </div>

                    <div>
                      <span className="text-purple-600 block text-[11px] font-semibold uppercase">Collection Photo</span>
                      {t.collectionPhotoUrl ? (
                        <div
                          onClick={() => setPreviewModalUrl(t.collectionPhotoUrl!)}
                          className="cursor-pointer group relative rounded-xl overflow-hidden border border-purple-300 w-16 h-16 mt-1"
                        >
                          <img
                            src={t.collectionPhotoUrl}
                            alt="Collection Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-all"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] mt-1 block">No photo attached</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Operational Notification Alerts: Recycling Delivery Confirmation Received — Verification Pending */}
      {trips.some((t) => t.status === 'PENDING_ADMIN_VERIFICATION' || dispatchesByTrip[t.tripId]?.status === 'PENDING_VERIFICATION') && (
        <div className="space-y-3">
          {trips
            .filter((t) => t.status === 'PENDING_ADMIN_VERIFICATION' || dispatchesByTrip[t.tripId]?.status === 'PENDING_VERIFICATION')
            .map((t) => {
              const disp = dispatchesByTrip[t.tripId];
              if (!disp) return null;
              return (
                <div
                  key={`pending-ver-${t.tripId}`}
                  className="p-5 bg-amber-50/90 border-2 border-amber-300 rounded-3xl shadow-xs space-y-3 text-xs text-amber-950"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping"></span>
                      <h4 className="font-bold text-sm text-amber-900 m-0">
                        Recycling Delivery Confirmation Received — Verification Pending
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openRejectModal(disp)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Reject / Request Correction
                      </button>
                      <button
                        type="button"
                        onClick={() => openApproveModal(disp)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                      >
                        Verify &amp; Complete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-amber-700 block text-[11px] font-semibold uppercase">Driver &amp; Truck Details</span>
                      <strong className="text-slate-900 block">{t.driverName || 'Driver Murugan'}</strong>
                      <span className="text-slate-600 font-mono text-[11px]">{t.truckCode || `TRK-0${t.truckId}`} &bull; {t.tripCode}</span>
                    </div>

                    <div>
                      <span className="text-amber-700 block text-[11px] font-semibold uppercase">Assigned Recycling Facility</span>
                      <strong className="text-slate-900 block">{disp.facilityName || `Facility #${disp.facilityId}`}</strong>
                      <span className="text-slate-600 text-[11px] block">{disp.facilityAddress || disp.wasteCategory}</span>
                    </div>

                    <div>
                      <span className="text-amber-700 block text-[11px] font-semibold uppercase">Delivered Quantity &amp; Remarks</span>
                      <strong className="text-emerald-800 text-sm font-bold block">{disp.receivedWeightKg || disp.deliveredWeightKg || disp.dispatchedQuantityKg} kg</strong>
                      {disp.deliveryNotes && (
                        <span className="text-slate-600 text-[11px] italic block">"{disp.deliveryNotes}"</span>
                      )}
                    </div>

                    <div>
                      <span className="text-amber-700 block text-[11px] font-semibold uppercase">Delivery Proof Photo</span>
                      {disp.evidencePhotoUrl ? (
                        <div
                          onClick={() => setPreviewModalUrl(disp.evidencePhotoUrl!)}
                          className="cursor-pointer group relative rounded-xl overflow-hidden border border-amber-300 w-16 h-16 mt-1"
                        >
                          <img
                            src={disp.evidencePhotoUrl}
                            alt="Delivery Evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition-all"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] mt-1 block">No proof uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-xs font-semibold">Loading collection trips from database...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100 space-y-3">
          <Layers className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No Collection Trips Recorded Yet</p>
          <p className="text-xs max-w-sm mx-auto">
            Use the <strong>Combined Planning</strong> module to create your first combined trip from citizen roadside reports and nearby bins.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const truck = trucks[trip.truckId];
            const report = reports[trip.primaryReportId];
            const dispatch = dispatchesByTrip[trip.tripId];

            return (
              <div
                key={trip.tripId}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:border-emerald-200 transition-all space-y-4"
              >
                {/* Trip Header */}
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-base">{trip.tripCode}</span>
                      <span className="text-xs font-medium text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        Trip ID #{trip.tripId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Planned on {new Date(trip.createdAt).toLocaleString()} | Truck:{' '}
                      <strong className="text-slate-800">{truck?.truckCode || `Truck #${trip.truckId}`}</strong>
                    </p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTripStatusStyle(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>

                {/* Primary Associations Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Roadside Report */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Roadside Dump</span>
                    <div className="font-semibold text-slate-900 mt-1">
                      {report ? `Report #${report.reportId} (${report.wasteCategory})` : `Report #${trip.primaryReportId}`}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {report?.address || report?.areaName || 'Location stored'}
                    </p>
                    <span className="text-emerald-700 font-bold block mt-1">
                      {trip.plannedRoadsideKg} kg planned
                    </span>
                  </div>

                  {/* Dustbins */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Combined Nearby Bins</span>
                    <div className="font-semibold text-slate-900 mt-1">
                      {trip.tripBins ? `${trip.tripBins.length} Municipal Bins Selected` : 'Nearby Bins'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Additional Bins Load: <strong>{trip.plannedBinsKg} kg</strong>
                    </p>
                    <span className="text-slate-600 block mt-1">
                      Total Combined Planned: <strong>{trip.plannedTotalLoadKg} kg</strong>
                    </span>
                  </div>

                  {/* Actual Measured */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Collection Audit Status</span>
                    {trip.actualCollectedKg ? (
                      <div className="mt-1">
                        <span className="text-base font-bold text-emerald-800">
                          {trip.actualCollectedKg} kg
                        </span>
                        <span className="block text-[11px] text-slate-500">Actual measured collected</span>
                      </div>
                    ) : (
                      <div className="mt-1 text-slate-400 italic text-[11px]">
                        Actual collection pending field measurement.
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Stops List */}
                {trip.tripStops && trip.tripStops.length > 0 && (
                  <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                      Collection Sequence Stops ({trip.tripStops.length} stops)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {trip.tripStops.map((s) => (
                        <div
                          key={s.stopOrder}
                          className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-[11px] flex items-center space-x-1.5"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">
                            {s.stopOrder}
                          </span>
                          <span className="font-medium text-slate-800 truncate max-w-[180px]">
                            {s.locationName}
                          </span>
                          <span className="text-slate-400 font-bold">({s.plannedKg} kg)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Evidence & Verification Section (Shows when dispatch has evidence or is pending/verified/rejected) */}
                {dispatch && (dispatch.evidencePhotoUrl || trip.status === 'PENDING_ADMIN_VERIFICATION' || trip.status === 'REUPLOAD_REQUESTED' || dispatch.status === 'PENDING_VERIFICATION') && (
                  <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                          Recycling Delivery Evidence &amp; Verification
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          dispatch.verificationStatus === 'APPROVED' || trip.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : dispatch.verificationStatus === 'REJECTED' || trip.status === 'REUPLOAD_REQUESTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        }`}
                      >
                        {dispatch.verificationStatus === 'APPROVED' || trip.status === 'CLOSED'
                          ? 'VERIFIED & APPROVED'
                          : dispatch.verificationStatus === 'REJECTED' || trip.status === 'REUPLOAD_REQUESTED'
                          ? 'RE-UPLOAD REQUESTED'
                          : 'PENDING ADMIN VERIFICATION'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      {/* Photo Thumbnail */}
                      <div className="flex items-center space-x-2">
                        {dispatch.evidencePhotoUrl ? (
                          <div
                            onClick={() => setPreviewModalUrl(dispatch.evidencePhotoUrl!)}
                            className="cursor-pointer group relative rounded-xl overflow-hidden border border-indigo-200"
                          >
                            <img
                              src={dispatch.evidencePhotoUrl}
                              alt="Evidence Proof"
                              className="w-16 h-16 object-cover group-hover:scale-105 transition-all"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Evidence Photo</span>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {dispatch.evidencePhotoUrl ? 'Photo Uploaded (Click to view)' : 'No Photo'}
                          </span>
                        </div>
                      </div>

                      {/* Weight Comparison */}
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Weights (Collected vs Delivered)</span>
                        <span className="font-bold text-slate-900 block mt-0.5">
                          Collected: {trip.actualCollectedKg || trip.plannedTotalLoadKg} kg
                        </span>
                        <span className="text-emerald-700 font-bold block text-[11px]">
                          Delivered: {dispatch.receivedWeightKg || dispatch.dispatchedQuantityKg} kg
                        </span>
                      </div>

                      {/* Facility Info */}
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Destination Facility</span>
                        <span className="font-bold text-purple-900 block mt-0.5 truncate">
                          {dispatch.facilityName || `Facility #${dispatch.facilityId}`}
                        </span>
                        <span className="text-slate-500 text-[10px] block">
                          Category: {dispatch.wasteCategory}
                        </span>
                      </div>

                      {/* Verification Status Details / Rejection Reason */}
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Verification Log</span>
                        {dispatch.verificationStatus === 'REJECTED' ? (
                          <span className="text-rose-700 font-semibold block text-[11px]">
                            Rejection: "{dispatch.rejectionReason}"
                          </span>
                        ) : dispatch.verificationStatus === 'APPROVED' ? (
                          <span className="text-emerald-700 font-semibold block text-[11px]">
                            Verified by {dispatch.verifiedBy} ({dispatch.receivedWeightKg} kg)
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold block text-[11px]">
                            Driver remarks: "{dispatch.deliveryNotes || 'Delivery completed at facility gate'}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Verification Action Buttons for PENDING */}
                    {(trip.status === 'PENDING_ADMIN_VERIFICATION' || dispatch.status === 'PENDING_VERIFICATION') && (
                      <div className="pt-2 border-t border-indigo-200/80 flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => openRejectModal(dispatch)}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject / Request Correction</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openApproveModal(dispatch)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify and Complete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons for Lifecycle Transitions */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                  <div className="text-[11px] text-slate-500">
                    {trip.collectionNotes && <span>Notes: "{trip.collectionNotes}"</span>}
                  </div>

                  <div className="flex items-center space-x-2">
                    {trip.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleDispatch(trip.tripId)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Fleet (Start Route)</span>
                      </button>
                    )}

                    {trip.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleStart(trip.tripId)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Mark In Progress (Collecting)</span>
                      </button>
                    )}

                    {trip.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => openCompletionModal(trip)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Record Collection Weights &amp; Complete</span>
                      </button>
                    )}

                    {(trip.status === 'COLLECTION_COMPLETED' || trip.status === 'READY_FOR_RECYCLING') && !dispatch && (
                      <button
                        onClick={() => handleOpenAssignFacility(trip)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Send to Recycling Facility</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Collection Modal */}
      {completingTrip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                  Field Completion &amp; Telemetry Reset
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 m-0">
                  Record Actual Collection Quantities
                </h3>
                <p className="text-xs text-slate-500">Trip: {completingTrip.tripCode}</p>
              </div>
              <button
                onClick={() => setCompletingTrip(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompletion} className="space-y-4 text-xs">
              {/* Actual Roadside Weight */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Actual Measured Roadside Waste:</span>
                  <span className="text-emerald-800">{actualRoadsideKg} kg</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={actualRoadsideKg}
                  onChange={(e) => setActualRoadsideKg(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                />
                <span className="text-[10px] text-slate-400">
                  Planned estimate was: {completingTrip.plannedRoadsideKg} kg
                </span>
              </div>

              {/* Dustbins Emptied & Weights */}
              {completingTrip.tripBins && completingTrip.tripBins.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                    Municipal Dustbins Emptied (Will reset bin fill levels to 0.00 kg):
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {completingTrip.tripBins.map((tb) => {
                      const bin = bins[tb.binId];
                      return (
                        <div
                          key={tb.binId}
                          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {bin?.binCode || `Bin #${tb.binId}`}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {bin?.areaName} (Planned: {tb.plannedKg} kg)
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={actualBinWeights[tb.binId] ?? tb.plannedKg}
                              onChange={(e) =>
                                setActualBinWeights({
                                  ...actualBinWeights,
                                  [tb.binId]: Number(e.target.value),
                                })
                              }
                              className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-center bg-white"
                            />
                            <span className="font-bold text-slate-700">kg</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Collection Completion Notes
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 border border-emerald-100">
                <strong>Database Lifecycle Impact:</strong> Saving completion marks the report as collected, sets selected dustbins back to 0.00 kg fill, records total load on truck, and transitions the trip to Ready for Recycling.
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTrip(null)}
                  className="flex-1 py-2.5 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCompletion}
                  className="flex-1 py-2.5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  {savingCompletion ? 'Saving to Database...' : 'Save Collection Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delivery Verification Modal (Approve or Reject) */}
      {verifyingDispatch && verificationAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    verificationAction === 'APPROVE'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {verificationAction === 'APPROVE' ? 'Official Intake Approval' : 'Rejection & Correction Notice'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 m-0">
                  {verificationAction === 'APPROVE' ? 'Approve Delivery Evidence' : 'Reject Delivery Evidence'}
                </h3>
                <p className="text-xs text-slate-500">
                  Dispatch Manifest: <strong>{verifyingDispatch.dispatchCode}</strong>
                </p>
              </div>
              <button
                onClick={() => setVerifyingDispatch(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {verificationError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center space-x-2 border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {/* Evidence Photo Preview */}
            {verifyingDispatch.evidencePhotoUrl && (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={verifyingDispatch.evidencePhotoUrl}
                  alt="Evidence"
                  onClick={() => setPreviewModalUrl(verifyingDispatch.evidencePhotoUrl!)}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-300 cursor-pointer shadow-xs"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Driver Submitted Photo</span>
                  <span className="text-[11px] text-slate-500 block">
                    Delivered: {verifyingDispatch.receivedWeightKg || verifyingDispatch.dispatchedQuantityKg} kg
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(verifyingDispatch.evidencePhotoUrl!)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer mt-0.5"
                  >
                    Click to view full photo
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmVerification} className="space-y-4 text-xs">
              {verificationAction === 'APPROVE' ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Verified Received Weight (kg) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={verifiedWeightKg}
                      onChange={(e) => setVerifiedWeightKg(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Reported by driver: {verifyingDispatch.receivedWeightKg || verifyingDispatch.dispatchedQuantityKg} kg
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Intake Verification Notes
                    </label>
                    <input
                      type="text"
                      value={adminVerificationNotes}
                      onChange={(e) => setAdminVerificationNotes(e.target.value)}
                      placeholder="e.g. Weighbridge gross verified, materials acceptable."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-[11px] border border-emerald-200">
                    <strong>Lifecycle Completion Impact:</strong> Approving delivery confirms receipt at facility, marks trip and citizen report as CLOSED, and resets truck load to 0.00 kg (AVAILABLE).
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-rose-800 mb-1">
                      Rejection Reason (Sent directly to driver) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Photo blurry; weighbridge slip number illegible. Please re-upload clear proof."
                      className="w-full p-2.5 rounded-xl border border-rose-300 bg-rose-50/40 text-slate-900 font-medium text-xs"
                    />
                    <span className="text-[10px] text-rose-600 block mt-1">
                      This feedback will be prominently shown on the Driver Dashboard with a re-upload action.
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-[11px] border border-amber-200">
                    <strong>Rejection Policy:</strong> The trip status transitions to REUPLOAD_REQUESTED. The citizen report remains open (COLLECTION_COMPLETED), and no duplicate trip is created.
                  </div>
                </>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingDispatch(null)}
                  className="flex-1 py-2.5 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerification}
                  className={`flex-1 py-2.5 font-bold rounded-xl text-white shadow-xs cursor-pointer ${
                    verificationAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingVerification
                    ? 'Processing...'
                    : verificationAction === 'APPROVE'
                    ? 'Verify and Complete'
                    : 'Reject / Request Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send to Recycling Facility Modal */}
      {assigningTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span>Send to Recycling Facility</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign an authorized industrial recycling plant for Trip {assigningTrip.tripCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningTrip(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Collected Payload Summary */}
            <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1.5">
              <div className="flex justify-between items-center font-bold">
                <span>Driver: {assigningTrip.driverName || 'Murugan S (Driver)'} ({assigningTrip.truckCode || `TRK-0${assigningTrip.truckId}`})</span>
                <span className="text-purple-700 font-mono text-[11px] bg-purple-100 px-2 py-0.5 rounded-full">
                  Report #{assigningTrip.primaryReportId}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-purple-800">
                <span>Material: <strong>{assigningTrip.wasteCategory || 'PLASTIC'}</strong></span>
                <span>Collected Weight: <strong>{assigningTrip.actualCollectedKg || assigningTrip.plannedTotalLoadKg} kg</strong></span>
              </div>
              {assigningTrip.collectionPhotoUrl && (
                <div className="pt-1.5 flex items-center space-x-2">
                  <img
                    src={assigningTrip.collectionPhotoUrl}
                    alt="Collection Proof"
                    onClick={() => setPreviewModalUrl(assigningTrip.collectionPhotoUrl!)}
                    className="w-12 h-12 object-cover rounded-lg border border-purple-300 cursor-pointer"
                  />
                  <span className="text-[10px] text-purple-700">Collection photo verified from driver (click to view)</span>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Select Authorized Recycling Facility *
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {facilities
                    .filter((f) => f.operationalStatus === 'ACTIVE')
                    .map((fac) => {
                      const cat = assigningTrip.wasteCategory?.toUpperCase() || '';
                      const isCompatible = !cat || fac.acceptedCategories.toUpperCase().includes(cat) || fac.acceptedCategories.includes('ALL');
                      const isSelected = selectedFacilityId === fac.facilityId;

                      return (
                        <div
                          key={fac.facilityId}
                          onClick={() => setSelectedFacilityId(fac.facilityId)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-400/30'
                              : isCompatible
                              ? 'bg-white border-slate-200 hover:border-purple-300'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">{fac.facilityName}</span>
                                {isCompatible && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                    Category Match
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-purple-700 font-medium block mt-0.5">
                                {fac.facilityType} &bull; Accepts: {fac.acceptedCategories}
                              </span>
                              {fac.address && (
                                <span className="text-[10px] text-slate-500 block mt-0.5">{fac.address}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Cap: {fac.dailyCapacityKg} kg/day
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Dispatch Coordination Notes
                </label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Cleared payload dispatched to Gate 1 intake."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningTrip(null)}
                  className="flex-1 py-2.5 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispatch || !selectedFacilityId}
                  className="flex-1 py-2.5 font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingDispatch ? 'Dispatching...' : 'Confirm Assignment & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-4 max-w-xl w-full shadow-2xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Delivery Evidence Photo</span>
              </span>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewModalUrl}
                alt="Full Evidence"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
