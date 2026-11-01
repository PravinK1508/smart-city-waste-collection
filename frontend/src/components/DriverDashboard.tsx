import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Play,
  Scale,
  MapPin,
  Building2,
  AlertTriangle,
  RotateCw,
  FileText,
  Trash2,
  Navigation,
  ShieldCheck,
  Check,
  Calendar,
  Phone,
  Upload,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  X,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { CollectionTrip, TripStop, Truck as TruckType, User, RecyclingDispatch } from '../types';
import { api } from '../api/client';

interface DriverDashboardProps {
  currentUser: User;
  onNavigateToMap?: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  currentUser,
  onNavigateToMap,
}) => {
  const [assignedTrucks, setAssignedTrucks] = useState<TruckType[]>([]);
  const [trips, setTrips] = useState<CollectionTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<CollectionTrip | null>(null);
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [recyclingDispatch, setRecyclingDispatch] = useState<RecyclingDispatch | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stage A: Collection completion inputs
  const [actualRoadsideKg, setActualRoadsideKg] = useState<number>(0);
  const [binWeights, setBinWeights] = useState<Record<number, number>>({});
  const [collectionNotes, setCollectionNotes] = useState<string>('');
  const [collectionPhotoUrl, setCollectionPhotoUrl] = useState<string>('');
  const [uploadingCollectionPhoto, setUploadingCollectionPhoto] = useState(false);
  const collectionFileInputRef = useRef<HTMLInputElement | null>(null);

  // Stage C: Delivery evidence inputs
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deliveredWeightKg, setDeliveredWeightKg] = useState<number>(0);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [driverTrucks, driverTrips] = await Promise.all([
        api.getTrucksByDriver(currentUser.id),
        api.getTripsByDriver(currentUser.id),
      ]);
      setAssignedTrucks(driverTrucks);
      setTrips(driverTrips);

      if (driverTrips.length > 0) {
        // Find existing selected trip or default to first active trip
        const currentSelectedId = selectedTrip?.tripId;
        const matchingCurrent = driverTrips.find((t) => t.tripId === currentSelectedId);

        const active = driverTrips.find((t) =>
          [
            'ASSIGNED',
            'DISPATCHED',
            'IN_PROGRESS',
            'COLLECTION_COMPLETED',
            'READY_FOR_RECYCLING',
            'DELIVERED_TO_FACILITY',
            'PENDING_ADMIN_VERIFICATION',
            'REUPLOAD_REQUESTED',
          ].includes(t.status)
        );

        const tripToSelect = matchingCurrent || active || driverTrips[0];
        setSelectedTrip(tripToSelect);
        await loadTripDetails(tripToSelect);
      } else {
        setSelectedTrip(null);
        setTripStops([]);
        setRecyclingDispatch(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load driver assignments.');
    } finally {
      setLoading(false);
    }
  };

  const loadTripDetails = async (trip: CollectionTrip) => {
    try {
      const stops = await api.getTripStops(trip.tripId);
      setTripStops(stops);
      setActualRoadsideKg(trip.actualCollectedKg ? (trip.plannedRoadsideKg || 40) : (trip.plannedRoadsideKg || 40));
      setCollectionPhotoUrl(trip.collectionPhotoUrl || '');

      // Initialize bin weights from stops
      const initialBinKg: Record<number, number> = {};
      stops
        .filter((s) => s.stopType === 'MUNICIPAL_BIN')
        .forEach((s) => {
          initialBinKg[s.referenceId] = s.actualCollectedKg ?? s.plannedKg ?? 20;
        });
      setBinWeights(initialBinKg);

      // Check for recycling dispatch
      try {
        const dispatch = await api.getDispatchByTripId(trip.tripId);
        setRecyclingDispatch(dispatch);
        if (dispatch) {
          setEvidencePhotoUrl(dispatch.evidencePhotoUrl || '');
          setDeliveredWeightKg(
            dispatch.receivedWeightKg ||
              dispatch.dispatchedQuantityKg ||
              trip.actualCollectedKg ||
              trip.plannedTotalLoadKg ||
              40
          );
          setDeliveryNotes(dispatch.deliveryNotes || '');
        } else {
          setEvidencePhotoUrl('');
          setDeliveredWeightKg(trip.actualCollectedKg || trip.plannedTotalLoadKg || 40);
          setDeliveryNotes('');
        }
      } catch {
        setRecyclingDispatch(null);
        setEvidencePhotoUrl('');
        setDeliveredWeightKg(trip.actualCollectedKg || trip.plannedTotalLoadKg || 40);
        setDeliveryNotes('');
      }
    } catch (err: any) {
      console.error('Failed to load trip stops:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const handleSelectTrip = async (trip: CollectionTrip) => {
    setSelectedTrip(trip);
    setSuccessMessage(null);
    setErrorMessage(null);
    await loadTripDetails(trip);
  };

  const handleStartTrip = async () => {
    if (!selectedTrip) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const updated = await api.startTrip(selectedTrip.tripId, currentUser.fullName);
      setSuccessMessage(`Trip ${updated.tripCode} started! Status updated to IN_PROGRESS.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start trip.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollectionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCollectionPhoto(true);
      setErrorMessage(null);
      const url = await api.uploadPhoto(file);
      setCollectionPhotoUrl(url);
      setSuccessMessage('Collection completion photo uploaded successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload collection photo');
    } finally {
      setUploadingCollectionPhoto(false);
    }
  };

  const handleCompleteCollection = async () => {
    if (!selectedTrip) return;
    try {
      setActionLoading(true);
      setErrorMessage(null);
      await api.completeTrip(
        selectedTrip.tripId,
        actualRoadsideKg,
        binWeights,
        collectionNotes || 'Collection confirmed by driver.',
        currentUser.fullName,
        collectionPhotoUrl
      );
      setSuccessMessage(
        'Collection confirmation submitted successfully. Waiting for Admin recycling assignment.'
      );
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit collection confirmation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      setErrorMessage(null);
      const url = await api.uploadPhoto(file);
      setEvidencePhotoUrl(url);
      setSuccessMessage('Delivery evidence photo uploaded successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmitDeliveryEvidence = async () => {
    if (!recyclingDispatch) {
      setErrorMessage('No active recycling destination assigned for this trip.');
      return;
    }
    if (!evidencePhotoUrl || !evidencePhotoUrl.trim()) {
      setErrorMessage('Please upload a delivery evidence photo before submitting.');
      return;
    }
    if (!deliveredWeightKg || deliveredWeightKg <= 0) {
      setErrorMessage('Please enter a valid delivered weight in kg.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage(null);
      await api.submitDeliveryEvidence(
        recyclingDispatch.dispatchId,
        evidencePhotoUrl,
        deliveredWeightKg,
        deliveryNotes || 'Delivery evidence submitted by driver at facility gate.',
        currentUser.id,
        currentUser.fullName
      );
      setSuccessMessage(
        'Recycling delivery confirmation submitted. Waiting for Admin verification.'
      );
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit delivery confirmation.');
    } finally {
      setActionLoading(false);
    }
  };

  const activeTrips = trips.filter((t) =>
    [
      'ASSIGNED',
      'DISPATCHED',
      'IN_PROGRESS',
      'COLLECTION_COMPLETED',
      'READY_FOR_RECYCLING',
      'DELIVERED_TO_FACILITY',
      'PENDING_ADMIN_VERIFICATION',
      'REUPLOAD_REQUESTED',
    ].includes(t.status)
  );

  const getTripBadgeStyle = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DISPATCHED':
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'COLLECTION_COMPLETED':
      case 'READY_FOR_RECYCLING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED_TO_FACILITY':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PENDING_ADMIN_VERIFICATION':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'REUPLOAD_REQUESTED':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'CLOSED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isCollectionCompleted =
    selectedTrip &&
    (selectedTrip.actualCollectedKg != null ||
      [
        'COLLECTION_COMPLETED',
        'READY_FOR_RECYCLING',
        'DELIVERED_TO_FACILITY',
        'PENDING_ADMIN_VERIFICATION',
        'REUPLOAD_REQUESTED',
        'CLOSED',
      ].includes(selectedTrip.status));

  return (
    <div className="space-y-6">
      {/* Top Driver Profile & Vehicle Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Driver Operations Portal
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 m-0">
            Welcome, {currentUser.fullName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official Driver Account &bull; {currentUser.email} &bull; Municipal Waste Fleet Division
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Trips</span>
          </button>
          {onNavigateToMap && (
            <button
              onClick={onNavigateToMap}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live City Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Driver Notification: New Recycling Destination Assigned */}
      {selectedTrip && isCollectionCompleted && recyclingDispatch && !['PENDING_ADMIN_VERIFICATION', 'CLOSED'].includes(selectedTrip.status) && recyclingDispatch.verificationStatus !== 'APPROVED' && (
        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-3xl text-purple-950 space-y-2 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
            <span className="font-bold text-sm text-purple-900">New Recycling Destination Assigned</span>
          </div>
          <p className="text-xs text-purple-800 m-0">
            Proceed to <strong>{recyclingDispatch.facilityName}</strong> with truck <strong>{selectedTrip.truckCode || selectedTrip.truckId}</strong> ({selectedTrip.actualCollectedKg || recyclingDispatch.dispatchedQuantityKg} kg payload). Click <strong>Confirm Recycling Delivery</strong> below when at facility.
          </p>
        </div>
      )}

      {/* Driver Notification: New Assignment Received */}
      {selectedTrip && selectedTrip.status === 'ASSIGNED' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-3xl text-blue-950 space-y-1 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-sm text-blue-900">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>New Collection Job Assigned: {selectedTrip.tripCode}</span>
          </div>
          <p className="text-xs text-blue-800 m-0">
            Assigned to Truck <strong>{selectedTrip.truckCode || selectedTrip.truckId}</strong>. Collect the citizen-reported roadside waste and municipal bins, then click <strong>Confirm Waste Collection</strong> below.
          </p>
        </div>
      )}

      {/* Assigned Truck(s) Status Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Truck className="w-4 h-4" />
          <span>Your Assigned Municipal Truck Fleet</span>
        </div>

        {assignedTrucks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No truck is currently registered to your driver profile. Please contact the Municipal Admin.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assignedTrucks.map((trk) => (
              <div
                key={trk.truckId}
                className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white m-0">{trk.truckCode}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{trk.registrationNumber}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trk.operationalStatus === 'AVAILABLE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : trk.operationalStatus === 'ASSIGNED'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {trk.operationalStatus}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700/50 flex justify-between text-xs">
                  <span className="text-slate-400">Total Capacity:</span>
                  <span className="font-bold text-white">{trk.totalCapacityKg} kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Load:</span>
                  <span className="font-bold text-emerald-400">{trk.currentLoadKg} kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Remaining Free:</span>
                  <span className="font-bold text-slate-200">{trk.remainingCapacityKg} kg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Assigned Jobs */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>My Assigned Jobs ({trips.length})</span>
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {activeTrips.length} Active
              </span>
            </div>

            {trips.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No collection jobs are currently assigned to your account.</p>
                <p className="text-[11px] text-slate-400">
                  When the Municipal Admin confirms a collection plan with your truck, it will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trips.map((trip) => {
                  const isSelected = selectedTrip?.tripId === trip.tripId;

                  return (
                    <div
                      key={trip.tripId}
                      onClick={() => handleSelectTrip(trip)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 block">{trip.tripCode}</span>
                          <span className="text-[11px] text-slate-500">
                            Truck: <strong>{trip.truckCode || `Truck #${trip.truckId}`}</strong>
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTripBadgeStyle(
                            trip.status
                          )}`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      {/* Work Overview */}
                      <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                        <div className="flex items-center space-x-1 text-slate-700">
                          <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Roadside: {trip.plannedRoadsideKg} kg</span>
                          <span className="text-slate-400">&bull;</span>
                          <Trash2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{trip.tripBins?.length || 0} Municipal Bins</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span>Planned Load: <strong>{trip.plannedTotalLoadKg} kg</strong></span>
                          {trip.actualCollectedKg ? (
                            <span className="text-emerald-700 font-bold">
                              Collected: {trip.actualCollectedKg} kg
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Weigh Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Selected Job Execution Details & 3-Stage Workflow */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTrip ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
              {/* Job Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-900">
                      Job Details: {selectedTrip.tripCode}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getTripBadgeStyle(
                        selectedTrip.status
                      )}`}
                    >
                      {selectedTrip.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Truck Code: <strong>{selectedTrip.truckCode || selectedTrip.truckId}</strong> &bull; Planned Load:{' '}
                    <strong>{selectedTrip.plannedTotalLoadKg} kg</strong> (Roadside: {selectedTrip.plannedRoadsideKg} kg + Bins:{' '}
                    {selectedTrip.plannedBinsKg} kg)
                  </p>
                </div>
              </div>

              {/* Citizen Waste Report & Work Scope */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Citizen Waste Report &amp; Collection Scope</span>
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    Report #{selectedTrip.primaryReportId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Report Location / Address:</span>
                    <strong className="text-slate-800 font-medium">
                      {selectedTrip.reportAddress || selectedTrip.reportArea || 'Designated Collection Site'}
                    </strong>
                    {selectedTrip.reportArea && selectedTrip.reportAddress && (
                      <span className="text-slate-500 block text-[10px]">Zone: {selectedTrip.reportArea}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Waste Category &amp; Citizen Notes:</span>
                    <strong className="text-slate-800">
                      {selectedTrip.wasteCategory || 'Mixed / General Waste'}
                    </strong>
                    {selectedTrip.reportDescription && (
                      <p className="text-slate-600 text-[10px] m-0 italic mt-0.5">
                        "{selectedTrip.reportDescription}"
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Roadside Quantity:</span>
                    <strong className="text-slate-800">{selectedTrip.plannedRoadsideKg} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Assigned Municipal Bins:</span>
                    <strong className="text-slate-800">
                      {selectedTrip.tripBins?.length || 0} Bins ({selectedTrip.plannedBinsKg} kg total)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Stop-by-Stop Ordered Route */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 m-0">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>Ordered Collection Stops ({tripStops.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Optimized by Geographic Proximity Matrix
                  </span>
                </div>

                {tripStops.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                    Loading stops sequence...
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {tripStops.map((stop) => {
                      const isRoadside = stop.stopType === 'ROADSIDE_REPORT';
                      const isCollected = stop.status === 'COLLECTED' || isCollectionCompleted;

                      return (
                        <div
                          key={stop.stopId || stop.stopOrder}
                          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                            isCollected
                              ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                              : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCollected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {stop.stopOrder}
                            </span>
                            <div>
                              <div className="flex items-center space-x-2 font-bold">
                                {isRoadside ? (
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                                <span>{stop.locationName}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                Coords: {stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="block font-bold text-slate-800">
                              Planned: {stop.plannedKg} kg
                            </span>
                            {stop.actualCollectedKg != null && (
                              <span className="text-[11px] text-emerald-700 font-bold">
                                Actual: {stop.actualCollectedKg} kg
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* STAGE A: COLLECT WASTE */}
              {/* ========================================================================= */}
              <div className="border border-slate-200 rounded-3xl p-5 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      A
                    </span>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Stage A: Collect Waste
                    </span>
                  </div>
                  {isCollectionCompleted ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Collection Completed</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      In Progress
                    </span>
                  )}
                </div>

                {isCollectionCompleted ? (
                  /* Completed Summary */
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-3">
                    <div className="flex items-center space-x-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Waste Successfully Collected &amp; Weighed</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Roadside Waste:</span>
                        <strong className="text-slate-800">{actualRoadsideKg || selectedTrip.plannedRoadsideKg} kg</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Municipal Bins Cleared:</span>
                        <strong className="text-slate-800">{tripStops.filter((s) => s.stopType === 'MUNICIPAL_BIN').length} Bins (Reset to 0.00 kg)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Truck Payload:</span>
                        <strong className="text-emerald-800 font-bold">{selectedTrip.actualCollectedKg || selectedTrip.plannedTotalLoadKg} kg</strong>
                      </div>
                    </div>

                    {(selectedTrip.collectionPhotoUrl || collectionPhotoUrl) && (
                      <div className="pt-2 border-t border-emerald-200">
                        <span className="text-[11px] font-bold text-slate-700 block mb-1">Collection Photo Reference:</span>
                        <img
                          src={selectedTrip.collectionPhotoUrl || collectionPhotoUrl}
                          alt="Collection Proof"
                          onClick={() => setPreviewModalUrl((selectedTrip.collectionPhotoUrl || collectionPhotoUrl)!)}
                          className="w-20 h-20 object-cover rounded-xl border border-emerald-300 shadow-xs cursor-pointer hover:opacity-90"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Collection Form (Action 1: Confirm Waste Collection) */
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 m-0">
                      Enter the measured scale weights for the roadside dump site and each collected municipal bin, attach a collection photo, and click <strong>Confirm Waste Collection</strong>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Actual Roadside Waste (kg) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={actualRoadsideKg}
                          onChange={(e) => setActualRoadsideKg(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Planned: {selectedTrip.plannedRoadsideKg} kg
                        </span>
                      </div>

                      {tripStops
                        .filter((s) => s.stopType === 'MUNICIPAL_BIN')
                        .map((bStop) => (
                          <div key={bStop.referenceId} className="bg-white p-3 rounded-2xl border border-slate-200">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                              {bStop.locationName} (kg) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={binWeights[bStop.referenceId] ?? bStop.plannedKg}
                              onChange={(e) =>
                                setBinWeights({
                                  ...binWeights,
                                  [bStop.referenceId]: Number(e.target.value),
                                })
                              }
                              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                            />
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Planned: {bStop.plannedKg} kg
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Collection Completion Photo Upload */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Collection Completion Photo Upload
                      </label>
                      <input
                        type="file"
                        ref={collectionFileInputRef}
                        accept="image/*"
                        onChange={handleCollectionPhotoUpload}
                        className="hidden"
                      />

                      {collectionPhotoUrl ? (
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-2xl border border-emerald-200">
                          <img
                            src={collectionPhotoUrl}
                            alt="Collection Proof"
                            onClick={() => setPreviewModalUrl(collectionPhotoUrl)}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 cursor-pointer"
                          />
                          <div className="flex-1 text-xs">
                            <span className="font-bold text-emerald-800 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Collection Photo Attached</span>
                            </span>
                            <span className="text-[11px] text-slate-500 block">Click photo thumbnail to view full image</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => collectionFileInputRef.current?.click()}
                            disabled={uploadingCollectionPhoto}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition-all cursor-pointer"
                          >
                            Change Photo
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => collectionFileInputRef.current?.click()}
                          disabled={uploadingCollectionPhoto}
                          className="w-full py-5 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-white flex flex-col items-center justify-center text-xs text-slate-600 transition-all cursor-pointer hover:bg-emerald-50/30"
                        >
                          <Camera className="w-6 h-6 text-emerald-600 mb-1" />
                          <span className="font-bold text-slate-800">
                            {uploadingCollectionPhoto ? 'Uploading Collection Photo...' : 'Click to Upload Collection Completion Photo'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Supports PNG, JPG, JPEG (saved in backend storage)
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Collection Field Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cleared all roadside waste and emptied assigned bins."
                        value={collectionNotes}
                        onChange={(e) => setCollectionNotes(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                      />
                    </div>

                    <button
                      onClick={handleCompleteCollection}
                      disabled={actionLoading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Waste Collection</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* STAGE B: RECYCLING DESTINATION */}
              {/* ========================================================================= */}
              <div className="border border-slate-200 rounded-3xl p-5 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                      B
                    </span>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Stage B: Recycling Destination
                    </span>
                  </div>
                  {recyclingDispatch ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Destination Assigned
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Pending Assignment
                    </span>
                  )}
                </div>

                {!isCollectionCompleted ? (
                  <p className="text-xs text-slate-400 italic">
                    Complete Stage A (Collect Waste) first to enable recycling facility transfer.
                  </p>
                ) : !recyclingDispatch ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center space-x-2 font-bold">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Awaiting Admin Recycling Assignment</span>
                    </div>
                    <p className="text-[11px] text-amber-700 m-0">
                      Waste collected ({selectedTrip.actualCollectedKg || selectedTrip.plannedTotalLoadKg} kg).
                      The Municipal Admin is currently matching material category with an authorized recycling facility.
                      You cannot confirm delivery until the destination is assigned.
                    </p>
                  </div>
                ) : (
                  /* Facility Details Card */
                  <div className="p-4 bg-white rounded-2xl border border-purple-100 shadow-xs space-y-3 text-xs">
                    <div className="p-3.5 bg-purple-100/70 border border-purple-300 rounded-2xl text-purple-950 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
                        <span className="font-bold text-xs uppercase tracking-wider text-purple-900">
                          New Recycling Destination Assigned
                        </span>
                      </div>
                      <p className="text-xs text-purple-800 m-0 font-medium">
                        Collection completed. Proceed to <strong>{recyclingDispatch.facilityName}</strong>.
                      </p>
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm m-0">
                          {recyclingDispatch.facilityName || `Facility #${recyclingDispatch.facilityId}`}
                        </h5>
                        <span className="text-[11px] text-purple-700 font-semibold">
                          {recyclingDispatch.facilityType || 'Authorized Waste Recovery Unit'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {recyclingDispatch.dispatchCode}
                      </span>
                    </div>

                    {recyclingDispatch.facilityAddress && (
                      <div className="flex items-start space-x-1.5 text-slate-600 text-[11px] pt-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>Address: {recyclingDispatch.facilityAddress}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400">Assigned Truck &amp; Trip:</span>{' '}
                        <strong className="text-slate-900">{selectedTrip.truckCode || selectedTrip.truckId} &bull; {selectedTrip.tripCode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Collected Waste Quantity:</span>{' '}
                        <strong className="text-purple-900 font-bold">{selectedTrip.actualCollectedKg || recyclingDispatch.dispatchedQuantityKg} kg</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Material Category:</span>{' '}
                        <strong className="text-purple-900">{recyclingDispatch.wasteCategory}</strong>
                      </div>
                      {(recyclingDispatch.contactPerson || recyclingDispatch.contactPhone) && (
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Phone className="w-3 h-3 text-purple-600" />
                          <span>
                            {recyclingDispatch.contactPerson ? `${recyclingDispatch.contactPerson}: ` : ''}
                            {recyclingDispatch.contactPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* STAGE C: SUBMIT DELIVERY EVIDENCE */}
              {/* ========================================================================= */}
              <div className="border border-slate-200 rounded-3xl p-5 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      C
                    </span>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Stage C: Submit Delivery Evidence
                    </span>
                  </div>
                  {recyclingDispatch?.verificationStatus === 'APPROVED' || selectedTrip.status === 'CLOSED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Verified &amp; Closed</span>
                    </span>
                  ) : recyclingDispatch?.verificationStatus === 'REJECTED' || selectedTrip.status === 'REUPLOAD_REQUESTED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Re-upload Requested</span>
                    </span>
                  ) : recyclingDispatch?.verificationStatus === 'PENDING' || selectedTrip.status === 'PENDING_ADMIN_VERIFICATION' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Pending Verification</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Not Submitted
                    </span>
                  )}
                </div>

                {!recyclingDispatch ? (
                  <p className="text-xs text-slate-400 italic">
                    Delivery evidence can only be submitted after the Admin assigns a recycling destination in Stage B.
                  </p>
                ) : recyclingDispatch.verificationStatus === 'APPROVED' || selectedTrip.status === 'CLOSED' ? (
                  /* Verified & Closed Status */
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-3">
                    <div className="flex items-center space-x-2 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-sm">Delivery Verified &amp; Receipt Confirmed</span>
                        <p className="text-[11px] text-emerald-700 m-0">
                          Verified by Municipal Admin {recyclingDispatch.verifiedBy ? `(${recyclingDispatch.verifiedBy})` : ''} at{' '}
                          {recyclingDispatch.verifiedAt ? new Date(recyclingDispatch.verifiedAt).toLocaleString() : 'Recent'}.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200 text-[11px]">
                      <div>
                        <span className="text-slate-500">Official Received Weight:</span>{' '}
                        <strong className="text-emerald-900">
                          {recyclingDispatch.receivedWeightKg || recyclingDispatch.deliveredWeightKg} kg
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Truck Fleet State:</span>{' '}
                        <strong className="text-emerald-900">Emptied to 0.00 kg (Available)</strong>
                      </div>
                    </div>

                    {recyclingDispatch.evidencePhotoUrl && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-700 block mb-1">Archived Delivery Photo:</span>
                        <img
                          src={recyclingDispatch.evidencePhotoUrl}
                          alt="Delivery Evidence"
                          onClick={() => setPreviewModalUrl(recyclingDispatch.evidencePhotoUrl!)}
                          className="w-24 h-24 object-cover rounded-xl border border-emerald-300 shadow-xs cursor-pointer hover:opacity-90"
                        />
                      </div>
                    )}
                  </div>
                ) : recyclingDispatch.verificationStatus === 'PENDING' || selectedTrip.status === 'PENDING_ADMIN_VERIFICATION' ? (
                  /* Pending Verification State - Locked from duplicate submissions */
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-3">
                    <div className="flex items-center space-x-2 font-bold">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-spin" />
                      <div>
                        <span className="text-sm">Delivery Evidence Submitted &bull; Pending Admin Verification</span>
                        <p className="text-[11px] text-amber-700 m-0">
                          Your proof of delivery and weighbridge slip have been recorded in MySQL. The Municipal Admin has been notified to inspect and confirm receipt.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Delivered Weight:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {recyclingDispatch.receivedWeightKg || deliveredWeightKg} kg
                        </span>
                      </div>
                      {recyclingDispatch.deliveryNotes && (
                        <div>
                          <span className="text-slate-500 text-[11px] block">Driver Delivery Notes:</span>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            "{recyclingDispatch.deliveryNotes}"
                          </span>
                        </div>
                      )}
                    </div>

                    {evidencePhotoUrl && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-700 block mb-1">Submitted Evidence Photo:</span>
                        <img
                          src={evidencePhotoUrl}
                          alt="Uploaded Delivery Proof"
                          onClick={() => setPreviewModalUrl(evidencePhotoUrl)}
                          className="w-28 h-28 object-cover rounded-xl border border-amber-300 shadow-xs cursor-pointer hover:opacity-90"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">Click photo to preview full size</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Active Submission / Re-upload Form */
                  <div className="space-y-4">
                    {/* Rejection Alert if applicable */}
                    {(recyclingDispatch.verificationStatus === 'REJECTED' || selectedTrip.status === 'REUPLOAD_REQUESTED') && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                        <div className="flex items-center space-x-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Delivery Evidence Rejected by Admin</span>
                        </div>
                        <p className="text-[11px] text-rose-700 m-0">
                          <strong>Admin Feedback:</strong> "{recyclingDispatch.rejectionReason || 'Please upload a clearer delivery photo or verify the weight scale reading.'}"
                        </p>
                        <p className="text-[10px] text-rose-600 italic m-0 pt-0.5">
                          Please re-upload a clear delivery photo and submit corrected delivery details below.
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 m-0">
                      When you reach {recyclingDispatch.facilityName}, upload a photo of the facility gate / weighbridge slip and confirm the delivered payload.
                    </p>

                    {/* Photo Upload Section */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Delivery Evidence Photo *
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      {evidencePhotoUrl ? (
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-2xl border border-emerald-200">
                          <img
                            src={evidencePhotoUrl}
                            alt="Delivery Evidence"
                            onClick={() => setPreviewModalUrl(evidencePhotoUrl)}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 cursor-pointer"
                          />
                          <div className="flex-1 text-xs">
                            <span className="font-bold text-emerald-800 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Photo Ready</span>
                            </span>
                            <span className="text-[11px] text-slate-500 block">Click to view full image</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition-all cursor-pointer"
                          >
                            Change Photo
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-white flex flex-col items-center justify-center text-xs text-slate-600 transition-all cursor-pointer hover:bg-indigo-50/30"
                        >
                          <Camera className="w-6 h-6 text-indigo-600 mb-1" />
                          <span className="font-bold text-slate-800">
                            {uploadingPhoto ? 'Uploading Photo...' : 'Click to Upload Facility Gate / Weight Slip Photo'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Supports PNG, JPG, JPEG (saved in backend storage)
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Weight and Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Delivered Weight (kg) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={deliveredWeightKg}
                          onChange={(e) => setDeliveredWeightKg(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Dispatched: {recyclingDispatch.dispatchedQuantityKg} kg
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Delivery Field Notes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Unloaded at Gate 2 weighbridge."
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Optional driver remarks for Admin
                        </span>
                      </div>
                    </div>

                    {/* Submit Action */}
                    <button
                      onClick={handleSubmitDeliveryEvidence}
                      disabled={actionLoading || uploadingPhoto || !evidencePhotoUrl}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {recyclingDispatch.verificationStatus === 'REJECTED'
                          ? 'Confirm Corrected Recycling Delivery'
                          : 'Confirm Recycling Delivery'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs text-slate-400 text-xs">
              Select a job from "My Assigned Jobs" on the left to view stops, route details, and stages.
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-4 max-w-xl w-full shadow-2xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Delivery Evidence Photo Preview</span>
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
                alt="Full Delivery Evidence Preview"
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
