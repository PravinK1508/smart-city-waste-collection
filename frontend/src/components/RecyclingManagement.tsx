import React, { useState, useEffect } from 'react';
import {
  Building2,
  Recycle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Scale,
  MapPin,
  AlertTriangle,
  Send,
  Phone,
  Mail,
  FileCheck,
  Image as ImageIcon,
  XCircle,
  Eye,
} from 'lucide-react';
import { RecyclingFacility, RecyclingDispatch, CollectionTrip, WasteReport } from '../types';
import { api } from '../api/client';

interface RecyclingManagementProps {
  preselectedTripId?: number | null;
}

export const RecyclingManagement: React.FC<RecyclingManagementProps> = ({ preselectedTripId }) => {
  const [facilities, setFacilities] = useState<RecyclingFacility[]>([]);
  const [dispatches, setDispatches] = useState<RecyclingDispatch[]>([]);
  const [trips, setTrips] = useState<CollectionTrip[]>([]);
  const [reports, setReports] = useState<Record<number, WasteReport>>({});
  const [loading, setLoading] = useState(true);

  // New Dispatch Form State
  const [selectedTripId, setSelectedTripId] = useState<number | null>(preselectedTripId || null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [dispatchQuantityKg, setDispatchQuantityKg] = useState<number>(0);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [submittingDispatch, setSubmittingDispatch] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Change 2: Explicit Facility Details Modal State
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState<RecyclingFacility | null>(null);

  // Update Status Modal
  const [updatingDispatch, setUpdatingDispatch] = useState<RecyclingDispatch | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('DISPATCHED');
  const [receivedWeightKg, setReceivedWeightKg] = useState<number>(0);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Delivery Verification Modal State
  const [verifyingDispatch, setVerifyingDispatch] = useState<RecyclingDispatch | null>(null);
  const [verifyAction, setVerifyAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [verifiedWeightKg, setVerifiedWeightKg] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [verifyNotes, setVerifyNotes] = useState<string>('');
  const [submittingVerify, setSubmittingVerify] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [previewEvidenceUrl, setPreviewEvidenceUrl] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facs, disps, tripsData, reps] = await Promise.all([
        api.getFacilities(),
        api.getDispatches(),
        api.getAllTrips(),
        api.getAllReports(),
      ]);

      const repMap: Record<number, WasteReport> = {};
      reps.forEach((r) => (repMap[r.reportId] = r));

      setFacilities(facs);
      setDispatches(disps);
      setTrips(tripsData);
      setReports(repMap);

      // Filter trips ready for recycling
      const readyTrips = tripsData.filter(
        (t) => t.status === 'READY_FOR_RECYCLING' || t.status === 'COLLECTION_COMPLETED'
      );
      if (preselectedTripId) {
        setSelectedTripId(preselectedTripId);
      } else if (readyTrips.length > 0 && !selectedTripId) {
        setSelectedTripId(readyTrips[0].tripId);
      }
    } catch (err: any) {
      console.error('Error loading recycling data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedTripId]);

  // When selected trip changes, set default quantity & auto-match facility
  const selectedTrip = trips.find((t) => t.tripId === selectedTripId);
  const selectedReport = selectedTrip ? reports[selectedTrip.primaryReportId] : null;

  useEffect(() => {
    if (selectedTrip) {
      const defaultQty = selectedTrip.actualCollectedKg || selectedTrip.plannedTotalLoadKg || 40;
      setDispatchQuantityKg(defaultQty);

      if (selectedReport && facilities.length > 0) {
        // Recommend facility accepting this category
        const matched = facilities.find(
          (f) =>
            f.operationalStatus === 'ACTIVE' &&
            f.acceptedCategories.toLowerCase().includes(selectedReport.wasteCategory.toLowerCase())
        );
        if (matched) {
          setSelectedFacilityId(matched.facilityId);
        }
      }
    }
  }, [selectedTripId, trips, facilities]);

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId || !selectedFacilityId) return;

    try {
      setSubmittingDispatch(true);
      setDispatchError(null);
      setDispatchSuccess(null);

      const created = await api.createDispatch(
        selectedTripId,
        selectedFacilityId,
        dispatchQuantityKg,
        dispatchNotes,
        'Recycling Coordination Desk'
      );

      setDispatchSuccess('Recycling destination assigned successfully.');
      fetchData();
      setDispatchNotes('');
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to create recycling dispatch');
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const handleSelectIndustryCard = (fac: RecyclingFacility) => {
    setSelectedFacilityId(fac.facilityId);
    setSelectedFacilityForModal(fac);
  };

  const handleModalConfirmGoToIndustry = async () => {
    if (!selectedTripId || !selectedFacilityForModal) return;
    try {
      setSubmittingDispatch(true);
      setDispatchError(null);
      setDispatchSuccess(null);

      const created = await api.createDispatch(
        selectedTripId,
        selectedFacilityForModal.facilityId,
        dispatchQuantityKg,
        dispatchNotes || `Dispatched trip to ${selectedFacilityForModal.facilityName}`,
        'Recycling Coordination Desk'
      );

      setDispatchSuccess('Recycling destination assigned successfully.');
      setSelectedFacilityForModal(null);
      fetchData();
      setDispatchNotes('');
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to create recycling dispatch');
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingDispatch) return;

    try {
      setSavingStatus(true);
      await api.updateDispatchStatus(
        updatingDispatch.dispatchId,
        targetStatus,
        targetStatus === 'RECEIPT_CONFIRMED' ? receivedWeightKg : undefined,
        receiptNotes,
        'Facility Weighbridge Officer'
      );
      setUpdatingDispatch(null);
      fetchData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSavingStatus(false);
    }
  };

  const openStatusModal = (disp: RecyclingDispatch, nextStatus: string) => {
    setUpdatingDispatch(disp);
    setTargetStatus(nextStatus);
    setReceivedWeightKg(disp.dispatchedQuantityKg);
    setReceiptNotes(
      nextStatus === 'RECEIPT_CONFIRMED'
        ? 'Weighbridge gross tare confirmed. Quality acceptable for processing.'
        : 'Dispatched to facility route.'
    );
  };

  const openVerifyModal = (disp: RecyclingDispatch, action: 'APPROVE' | 'REJECT') => {
    setVerifyingDispatch(disp);
    setVerifyAction(action);
    setVerifiedWeightKg(disp.receivedWeightKg || disp.dispatchedQuantityKg || 40);
    setVerifyNotes('Intake verified & accepted at recycling receiving desk.');
    setRejectionReason('');
    setVerifyError(null);
  };

  const handleExecuteVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDispatch || !verifyAction) return;

    if (verifyAction === 'REJECT' && (!rejectionReason || !rejectionReason.trim())) {
      setVerifyError('Please specify a rejection reason for the driver.');
      return;
    }

    try {
      setSubmittingVerify(true);
      setVerifyError(null);

      await api.verifyDelivery(
        verifyingDispatch.dispatchId,
        verifyAction,
        verifyAction === 'REJECT' ? rejectionReason : undefined,
        verifyAction === 'APPROVE' ? verifiedWeightKg : undefined,
        verifyNotes || undefined,
        'Recycling Coordination Desk'
      );

      setVerifyingDispatch(null);
      setVerifyAction(null);
      fetchData();
    } catch (err: any) {
      setVerifyError(err.message || 'Verification update failed');
    } finally {
      setSubmittingVerify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>Recycling Facility Registry &amp; Industry Dispatch</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Category-matched transfer of collected waste into verified recovery and recycling units.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Grid: Dispatch Creator & Facility Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: Dispatch Completed Trip */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
              Step 1: Destination Matching
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1 m-0">
              Dispatch Trip to Recycling
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a collected trip and matching processing plant.
            </p>
          </div>

          {dispatchSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-semibold border border-emerald-200">
              ✓ {dispatchSuccess}
            </div>
          )}

          {dispatchError && (
            <div className="p-3 bg-red-50 text-red-900 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}

          <form onSubmit={handleCreateDispatch} className="space-y-4 text-xs">
            {/* Trip Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Collected Trip *
              </label>
              <select
                value={selectedTripId || ''}
                onChange={(e) => setSelectedTripId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="">-- Choose Completed Trip --</option>
                {trips.map((t) => (
                  <option key={t.tripId} value={t.tripId}>
                    {t.tripCode} ({t.status}) - {t.actualCollectedKg || t.plannedTotalLoadKg} kg
                  </option>
                ))}
              </select>
            </div>

            {selectedTrip && selectedReport && (
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Collected Category:</span>
                  <strong className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedReport.wasteCategory}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Load:</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedTrip.actualCollectedKg || selectedTrip.plannedTotalLoadKg} kg
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trip Current Status:</span>
                  <span className="font-semibold text-slate-800">{selectedTrip.status}</span>
                </div>
              </div>
            )}

            {/* Destination Facility Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Registered Recycling Facility *
              </label>
              <select
                value={selectedFacilityId || ''}
                onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="">-- Choose Compatible Facility --</option>
                {facilities.map((fac) => {
                  const isMatch =
                    selectedReport &&
                    fac.acceptedCategories.toLowerCase().includes(selectedReport.wasteCategory.toLowerCase());
                  return (
                    <option key={fac.facilityId} value={fac.facilityId}>
                      {fac.facilityName} ({fac.facilityType}) {isMatch ? '★ MATCH' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dispatched Quantity (kg) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={dispatchQuantityKg}
                onChange={(e) => setDispatchQuantityKg(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Transfer &amp; Manifest Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Weighbridge voucher ref, driver manifest..."
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={submittingDispatch || !selectedTripId || !selectedFacilityId}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-100" />
              <span>{submittingDispatch ? 'Dispatching...' : 'Go to This Industry'}</span>
            </button>
          </form>
        </div>

        {/* COLUMN 2 & 3: Facility Registry Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Registered Facilities ({facilities.length})
            </span>
            <span className="text-xs text-slate-400">All locations backed by stored GIS coordinates</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((fac) => (
              <div
                key={fac.facilityId}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3 hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{fac.facilityName}</h4>
                      <span className="text-[11px] text-emerald-700 font-semibold">{fac.facilityType}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {fac.operationalStatus}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 text-slate-600 mt-2.5">
                    <div>
                      <span className="text-slate-400">Accepted Waste:</span>{' '}
                      <strong className="text-emerald-800">{fac.acceptedCategories}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Address:</span> {fac.address}
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span>Daily Capacity: {fac.dailyCapacityKg} kg</span>
                      <span>Current Intake: {fac.currentIntakeKg} kg</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{fac.contactPhone}</span>
                    </span>
                    <span>{fac.contactPerson}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectIndustryCard(fac)}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Select &amp; Go to This Industry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DISPATCHES TABLE & TRACKING LIFECYCLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden space-y-3 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-base m-0">Recycling Dispatches &amp; Delivery Tracking</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative delivery confirmations and weight verification at receiving centers.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
            {dispatches.length} Total Dispatches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="py-3 px-4">Dispatch Code</th>
                <th className="py-3 px-4">Origin Trip</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dispatched / Received kg</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No recycling dispatches created yet.
                  </td>
                </tr>
              ) : (
                dispatches.map((disp) => {
                  const fac = facilities.find((f) => f.facilityId === disp.facilityId);
                  const trip = trips.find((t) => t.tripId === disp.tripId);

                  const getStatusBadge = (st: string) => {
                    switch (st) {
                      case 'DISPATCH_PLANNED':
                        return 'bg-blue-50 text-blue-800 border-blue-200';
                      case 'DISPATCHED':
                        return 'bg-amber-50 text-amber-800 border-amber-200';
                      case 'DELIVERED':
                        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
                      case 'PENDING_VERIFICATION':
                        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse';
                      case 'REJECTED':
                        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
                      case 'RECEIPT_CONFIRMED':
                        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      default:
                        return 'bg-slate-50 text-slate-700 border-slate-200';
                    }
                  };

                  return (
                    <tr key={disp.dispatchId} className="hover:bg-slate-50/70 transition-all">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                        <Recycle className="w-4 h-4 text-purple-600" />
                        <span>{disp.dispatchCode}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {trip?.tripCode || `Trip #${disp.tripId}`}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{fac?.facilityName || `Facility #${disp.facilityId}`}</div>
                        <span className="text-[10px] text-slate-400">{fac?.address}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-emerald-800">
                        {disp.wasteCategory}
                      </td>

                      <td className="py-3 px-4 font-semibold">
                        <span className="text-slate-900">{disp.dispatchedQuantityKg} kg</span>
                        {disp.receivedWeightKg && (
                          <span className="text-emerald-700 block text-[10px]">
                            Verified: {disp.receivedWeightKg} kg
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(disp.status)}`}>
                          {disp.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {disp.status === 'DISPATCH_PLANNED' && (
                            <button
                              onClick={() => openStatusModal(disp, 'DISPATCHED')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold"
                            >
                              Dispatch Truck
                            </button>
                          )}

                          {disp.status === 'DISPATCHED' && (
                            <button
                              onClick={() => openStatusModal(disp, 'DELIVERED')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {disp.status === 'DELIVERED' && (
                            <button
                              onClick={() => openVerifyModal(disp, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span>Verify &amp; Confirm Receipt</span>
                            </button>
                          )}

                          {disp.status === 'PENDING_VERIFICATION' && (
                            <div className="flex items-center space-x-1.5">
                              {disp.evidencePhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewEvidenceUrl(disp.evidencePhotoUrl!)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                                  title="View Evidence Photo"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>Photo</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openVerifyModal(disp, 'APPROVE')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openVerifyModal(disp, 'REJECT')}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {disp.status === 'REJECTED' && (
                            <span className="text-rose-700 font-bold text-[11px]">
                              Re-upload Requested
                            </span>
                          )}

                          {disp.status === 'RECEIPT_CONFIRMED' && (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Closed</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {updatingDispatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded">
                  Facility Weighbridge Gate
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 m-0">
                  Update Dispatch Lifecycle
                </h3>
                <p className="text-xs text-slate-500">Manifest: {updatingDispatch.dispatchCode}</p>
              </div>
              <button
                onClick={() => setUpdatingDispatch(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1 font-semibold">New Target Status:</span>
                <div className="p-2.5 bg-slate-50 rounded-xl font-bold text-slate-800">
                  {targetStatus}
                </div>
              </div>

              {targetStatus === 'RECEIPT_CONFIRMED' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Verified Received Weight (kg) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={receivedWeightKg}
                    onChange={(e) => setReceivedWeightKg(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white text-xs"
                  />
                  <span className="text-[10px] text-slate-400">
                    Dispatched payload was: {updatingDispatch.dispatchedQuantityKg} kg
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Receipt &amp; Quality Notes
                </label>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUpdatingDispatch(null)}
                  className="flex-1 py-2 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="flex-1 py-2 font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                >
                  {savingStatus ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE 2: Explicit Facility Details Modal with prominent "Go to This Industry" action */}
      {selectedFacilityForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-in">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base m-0">
                    Recycling Facility Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirm industry destination assignment for collection dispatch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacilityForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {dispatchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{selectedFacilityForModal.facilityName}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedFacilityForModal.operationalStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Facility Type</span>
                  <span className="font-semibold text-slate-800">{selectedFacilityForModal.facilityType}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Address</span>
                  <span className="font-semibold text-slate-800">{selectedFacilityForModal.address}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Contact</span>
                  <span className="font-semibold text-slate-800">{selectedFacilityForModal.contactPerson} ({selectedFacilityForModal.contactPhone})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Daily Capacity</span>
                  <span className="font-semibold text-slate-800">{selectedFacilityForModal.currentIntakeKg} / {selectedFacilityForModal.dailyCapacityKg} kg</span>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-200/60">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Accepted Waste Materials</span>
                <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                  {selectedFacilityForModal.acceptedCategories}
                </span>
              </div>
            </div>

            {selectedTrip && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Trip:</span>
                  <strong className="text-slate-800 font-mono">{selectedTrip.tripCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispatched Payload:</span>
                  <strong className="text-emerald-700 font-bold">{dispatchQuantityKg} kg</strong>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Manifest Notes
              </label>
              <input
                type="text"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="e.g. Weighbridge gate pass instructions..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFacilityForModal(null)}
                className="flex-1 py-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDispatch || !selectedTripId}
                onClick={handleModalConfirmGoToIndustry}
                className="flex-2 py-3 px-5 text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                <span>{submittingDispatch ? 'Dispatching...' : 'Go to This Industry'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Verification Modal */}
      {verifyingDispatch && verifyAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    verifyAction === 'APPROVE'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {verifyAction === 'APPROVE' ? 'Official Intake Approval' : 'Rejection & Correction Notice'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 m-0">
                  {verifyAction === 'APPROVE' ? 'Approve Delivery Evidence' : 'Reject Delivery Evidence'}
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

            {verifyError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center space-x-2 border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifyingDispatch.evidencePhotoUrl && (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={verifyingDispatch.evidencePhotoUrl}
                  alt="Evidence"
                  onClick={() => setPreviewEvidenceUrl(verifyingDispatch.evidencePhotoUrl!)}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-300 cursor-pointer shadow-xs"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Driver Submitted Photo</span>
                  <span className="text-[11px] text-slate-500 block">
                    Delivered: {verifyingDispatch.receivedWeightKg || verifyingDispatch.dispatchedQuantityKg} kg
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewEvidenceUrl(verifyingDispatch.evidencePhotoUrl!)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer mt-0.5"
                  >
                    Click to view full photo
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleExecuteVerification} className="space-y-4 text-xs">
              {verifyAction === 'APPROVE' ? (
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
                      value={verifyNotes}
                      onChange={(e) => setVerifyNotes(e.target.value)}
                      placeholder="e.g. Weighbridge gross verified, materials acceptable."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-[11px] border border-emerald-200">
                    <strong>Lifecycle Impact:</strong> Approving delivery confirms receipt at facility, closes the collection trip and citizen report, and resets truck load to 0.00 kg.
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
                  disabled={submittingVerify}
                  className={`flex-1 py-2.5 font-bold rounded-xl text-white shadow-xs cursor-pointer ${
                    verifyAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingVerify
                    ? 'Processing...'
                    : verifyAction === 'APPROVE'
                    ? 'Confirm & Approve Delivery'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewEvidenceUrl && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-4 max-w-xl w-full shadow-2xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Delivery Evidence Photo</span>
              </span>
              <button
                onClick={() => setPreviewEvidenceUrl(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewEvidenceUrl}
                alt="Full Evidence"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewEvidenceUrl(null)}
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
