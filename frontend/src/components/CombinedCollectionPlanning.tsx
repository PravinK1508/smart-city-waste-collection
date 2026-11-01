import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  Truck as TruckIcon,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  RefreshCw,
  MapPin,
  Compass,
  Check,
  X,
  Gauge,
  Sparkles,
  ShieldCheck,
  Building2,
  Phone,
  Scale,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  WasteReport,
  Truck,
  CandidateBin,
  TripPlanningResponse,
  RecyclingFacility,
  RecyclingDispatch,
} from '../types';
import { api } from '../api/client';

interface CombinedCollectionPlanningProps {
  preselectedReportId?: number | null;
  onTripConfirmed?: (tripId: number) => void;
}

export const CombinedCollectionPlanning: React.FC<CombinedCollectionPlanningProps> = ({
  preselectedReportId,
  onTripConfirmed,
}) => {
  // Master data
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [candidateBins, setCandidateBins] = useState<CandidateBin[]>([]);

  // Selection states
  const [selectedReportId, setSelectedReportId] = useState<number | null>(preselectedReportId || null);
  const [selectedTruckId, setSelectedTruckId] = useState<number | null>(null);
  const [selectedBinIds, setSelectedBinIds] = useState<number[]>([]);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5.0);
  const [notes, setNotes] = useState('');

  // Mode Selection State: Auto-Suggest Mode vs Manual Planning Mode
  const [planningMode, setPlanningMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [loadingAutoPlan, setLoadingAutoPlan] = useState<boolean>(false);

  // Live recalculation state
  const [planResult, setPlanResult] = useState<TripPlanningResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmedTrip, setConfirmedTrip] = useState<TripPlanningResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Change 2: Explicit Recycling Destination Selection State
  const [facilities, setFacilities] = useState<RecyclingFacility[]>([]);
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState<RecyclingFacility | null>(null);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [dispatchedRecord, setDispatchedRecord] = useState<RecyclingDispatch | null>(null);
  const [dispatchingIndustry, setDispatchingIndustry] = useState(false);
  const [industryNotes, setIndustryNotes] = useState('');
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Load initial reports and trucks
  useEffect(() => {
    const init = async () => {
      try {
        const [reps, trks] = await Promise.all([
          api.getAllReports(),
          api.getAllTrucks(),
        ]);
        const pendingReps = reps.filter((r) => r.status === 'PENDING');
        setReports(pendingReps);
        setTrucks(trks);

        if (preselectedReportId) {
          setSelectedReportId(preselectedReportId);
        } else if (pendingReps.length > 0) {
          setSelectedReportId(pendingReps[0].reportId);
        }

        // Auto select first available truck
        const availTrk = trks.find((t) => t.operationalStatus === 'AVAILABLE');
        if (availTrk) {
          setSelectedTruckId(availTrk.truckId);
        }
      } catch (err) {
        console.error('Failed to initialize planning data:', err);
      }
    };
    init();
  }, [preselectedReportId]);

  // When selected report or radius changes, fetch nearby candidate bins
  useEffect(() => {
    if (!selectedReportId) {
      setCandidateBins([]);
      return;
    }

    const fetchNearby = async () => {
      try {
        setLoadingCandidates(true);
        const candidates = await api.getNearbyBins(selectedReportId, searchRadiusKm);
        setCandidateBins(candidates);
        // Pre-select the eligible bins with >50% fill by default for convenience
        const autoSelected = candidates
          .filter((b) => b.eligible && b.fillPercentage >= 50)
          .map((b) => b.binId);
        setSelectedBinIds(autoSelected);
      } catch (err: any) {
        console.error('Failed to load candidate bins:', err);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchNearby();
  }, [selectedReportId, searchRadiusKm]);

  // Auto-Suggest planning calculation
  useEffect(() => {
    if (!selectedReportId || planningMode !== 'AUTO') return;

    const fetchAuto = async () => {
      try {
        setLoadingAutoPlan(true);
        setErrorMessage(null);
        const autoPlan = await api.getAutoSuggestPlan(selectedReportId, searchRadiusKm);
        setPlanResult(autoPlan);
        if (autoPlan.truckId) {
          setSelectedTruckId(autoPlan.truckId);
        }
        if (autoPlan.recommendedBinIds) {
          setSelectedBinIds(autoPlan.recommendedBinIds);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Auto-suggest recommendation error');
      } finally {
        setLoadingAutoPlan(false);
      }
    };

    fetchAuto();
  }, [selectedReportId, searchRadiusKm, planningMode]);

  // Live dynamic recalculation in MANUAL mode whenever report, truck, or bin selection changes
  useEffect(() => {
    if (planningMode !== 'MANUAL' || !selectedReportId || !selectedTruckId) {
      return;
    }

    const recalc = async () => {
      try {
        setCalculating(true);
        setErrorMessage(null);
        const res = await api.calculateTrip(
          selectedReportId,
          selectedTruckId,
          selectedBinIds,
          notes
        );
        setPlanResult(res);
      } catch (err: any) {
        setErrorMessage(err.message || 'Calculation error');
      } finally {
        setCalculating(false);
      }
    };

    recalc();
  }, [selectedReportId, selectedTruckId, selectedBinIds, notes, planningMode]);

  const toggleBinSelection = (binId: number) => {
    setSelectedBinIds((prev) =>
      prev.includes(binId) ? prev.filter((id) => id !== binId) : [...prev, binId]
    );
  };

  const handleConfirmPlan = async () => {
    if (!selectedReportId || !selectedTruckId || !planResult?.feasible) return;

    try {
      setConfirming(true);
      setErrorMessage(null);
      const res = await api.confirmTrip(
        selectedReportId,
        selectedTruckId,
        selectedBinIds,
        notes,
        'Municipal Admin'
      );
      setConfirmedTrip(res);
      setShowConfirmModal(false);

      if (onTripConfirmed && res.tripId) {
        onTripConfirmed(res.tripId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to confirm trip in database.');
      setShowConfirmModal(false);
    } finally {
      setConfirming(false);
    }
  };

  // Change 2: Load real facilities and any existing dispatch when confirmedTrip is active
  useEffect(() => {
    if (confirmedTrip && confirmedTrip.tripId) {
      const tripId = confirmedTrip.tripId;
      const loadFacilitiesAndDispatch = async () => {
        try {
          const facs = await api.getFacilities();
          setFacilities(facs);
          try {
            const existing = await api.getDispatchByTripId(tripId);
            if (existing) {
              setDispatchedRecord(existing);
            }
          } catch {
            // No existing dispatch
          }
        } catch (err) {
          console.error('Failed to load facilities:', err);
        }
      };
      loadFacilitiesAndDispatch();
    }
  }, [confirmedTrip]);

  const handleOpenFacilityModal = (fac: RecyclingFacility) => {
    setSelectedFacilityForModal(fac);
    setIndustryNotes(`Recycling transfer of Trip ${confirmedTrip?.tripCode || ''} to ${fac.facilityName}`);
    setDispatchError(null);
    setShowFacilityModal(true);
  };

  const handleConfirmIndustryDispatch = async () => {
    if (!confirmedTrip || !confirmedTrip.tripId || !selectedFacilityForModal) return;
    try {
      setDispatchingIndustry(true);
      setDispatchError(null);
      const disp = await api.createDispatch(
        confirmedTrip.tripId,
        selectedFacilityForModal.facilityId,
        confirmedTrip.combinedAdditionalLoadKg,
        industryNotes,
        'Municipal Admin'
      );
      setDispatchedRecord(disp);
      setShowFacilityModal(false);
    } catch (err: any) {
      setDispatchError(err.message || 'Failed to assign recycling destination in database.');
    } finally {
      setDispatchingIndustry(false);
    }
  };

  const selectedReport = reports.find((r) => r.reportId === selectedReportId);
  const selectedTruck = trucks.find((t) => t.truckId === selectedTruckId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Core Optimization Algorithm
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 m-0">
            Combined Roadside Waste &amp; Municipal Dustbin Collection
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pairs citizen-reported roadside dumps with eligible nearby municipal dustbins within available truck capacity.
          </p>
        </div>

        {planResult && (
          <div className="flex items-center space-x-3">
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
                planResult.feasible
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {planResult.feasible ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payload Feasible</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Payload Exceeded</span>
                </>
              )}
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!planResult.feasible || confirming}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center space-x-1.5 ${
                planResult.feasible
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed opacity-70'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Dispatch Trip</span>
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Confirmed Trip Success Banner & Change 2: Recycling Destination Selection */}
      {confirmedTrip && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-emerald-50 border-2 border-emerald-500 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center space-x-2 font-bold text-emerald-900 text-base">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Step 1 Complete: Combined Collection Trip Confirmed in MySQL!</span>
            </div>
            <div className="text-xs text-emerald-800 space-y-1">
              <p>
                Authoritative Trip Code: <strong>{confirmedTrip.tripCode}</strong> (Trip ID #{confirmedTrip.tripId})
              </p>
              <p>
                Assigned Truck: <strong>{confirmedTrip.truckCode}</strong> | Total Combined Load: <strong>{confirmedTrip.combinedAdditionalLoadKg} kg</strong> | Planned Stops: <strong>{confirmedTrip.recommendedStops?.length}</strong>
              </p>
              <p className="text-[11px] text-emerald-700">
                The roadside report status is updated to <strong>ASSIGNED</strong>, selected dustbins are locked to <strong>SCHEDULED</strong>, and the truck payload capacity is reserved.
              </p>
            </div>
          </div>

          {/* CHANGE 2: Step 2 — Display the recycling destination selection */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900 m-0">
                    Step 2: Assign Recycling Industry Destination
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Select an authorized recycling facility destination for Truck <strong>{confirmedTrip.truckCode}</strong> carrying <strong>{confirmedTrip.combinedAdditionalLoadKg} kg</strong> of <strong>{selectedReport?.wasteCategory || 'Material'}</strong>.
                </p>
              </div>

              {dispatchedRecord ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Destination Assigned &amp; Dispatched</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                  Awaiting Industry Selection
                </span>
              )}
            </div>

            {/* If Dispatch is already confirmed and persisted */}
            {dispatchedRecord ? (
              <div className="p-5 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Recycling Destination Successfully Assigned &amp; Persisted!</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    {dispatchedRecord.dispatchCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Industry</span>
                    <strong className="text-slate-900 text-sm">
                      {facilities.find((f) => f.facilityId === dispatchedRecord.facilityId)?.facilityName || `Facility #${dispatchedRecord.facilityId}`}
                    </strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {facilities.find((f) => f.facilityId === dispatchedRecord.facilityId)?.address}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Dispatch Status</span>
                    <strong className="text-emerald-700 text-sm">
                      {dispatchedRecord.status === 'DISPATCH_PLANNED' ? 'Destination Assigned' : dispatchedRecord.status}
                    </strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Dispatched Payload: {dispatchedRecord.dispatchedQuantityKg} kg
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Associated Trip &amp; Truck</span>
                    <strong className="text-slate-900 text-sm">{confirmedTrip.truckCode}</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Trip {confirmedTrip.tripCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-emerald-700">
                    ✓ Persisted in MySQL table <code>recycling_dispatches</code>. Duplicate dispatches for this trip are prevented.
                  </span>
                  <button
                    onClick={() => setConfirmedTrip(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Plan Another Collection Trip
                  </button>
                </div>
              </div>
            ) : (
              /* Facilities Grid: Explicit Industry Selection */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facilities.map((fac) => {
                    const isCompatible = selectedReport
                      ? fac.acceptedCategories.toLowerCase().includes(selectedReport.wasteCategory.toLowerCase())
                      : true;
                    const remainingCapacity = Math.max(0, fac.dailyCapacityKg - fac.currentIntakeKg);

                    return (
                      <div
                        key={fac.facilityId}
                        className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                          isCompatible
                            ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-400 hover:shadow-md'
                            : 'bg-slate-50/30 border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{fac.facilityName}</h4>
                              <span className="text-[11px] text-emerald-700 font-semibold">{fac.facilityType}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {fac.operationalStatus}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1">
                            <div className="flex items-center space-x-1 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{fac.address}</span>
                            </div>

                            <div className="pt-1">
                              <span className="text-slate-400 text-[11px] block">Accepted Materials:</span>
                              <span className="font-semibold text-slate-800 text-[11px]">{fac.acceptedCategories}</span>
                            </div>

                            <div className="pt-1">
                              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                                <span>Intake: {fac.currentIntakeKg} kg</span>
                                <span>Max: {fac.dailyCapacityKg} kg</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.round((fac.currentIntakeKg / fac.dailyCapacityKg) * 100))}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                          {isCompatible ? (
                            <>
                              <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-center">
                                ✓ Compatible with {selectedReport?.wasteCategory}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenFacilityModal(fac)}
                                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                              >
                                <span>Select This Industry</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-center">
                                Incompatible (Requires {fac.acceptedCategories})
                              </div>
                              <button
                                type="button"
                                disabled
                                className="w-full py-2 px-3 bg-slate-200 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                              >
                                Cannot Accept Waste Type
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setPlanningMode('AUTO')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              planningMode === 'AUTO'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Suggest Mode (Recommended)</span>
          </button>

          <button
            type="button"
            onClick={() => setPlanningMode('MANUAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              planningMode === 'MANUAL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manual Planning Mode</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-medium px-2">
          {planningMode === 'AUTO'
            ? '⚡ Proximity ranking, bin bundling & capacity optimization'
            : '🔧 Full administrative control over truck and bin selections'}
        </span>
      </div>

      {/* Auto-Suggest Mode View */}
      {planningMode === 'AUTO' && (
        <div className="space-y-6">
          {/* Step A: Choose Roadside Report */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 sm:flex-initial">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Roadside Waste Report
                </span>
                {reports.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No pending reports</span>
                ) : (
                  <select
                    value={selectedReportId || ''}
                    onChange={(e) => setSelectedReportId(Number(e.target.value))}
                    className="text-xs font-bold text-slate-800 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                  >
                    {reports.map((r) => (
                      <option key={r.reportId} value={r.reportId}>
                        Report #{r.reportId} &bull; {r.areaName} ({r.wasteCategory}, ~{r.estimatedQuantityKg} kg)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-slate-500">Search Radius:</span>
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-700">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>{searchRadiusKm} km</span>
              </div>
            </div>
          </div>

          {loadingAutoPlan ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Analyzing fleet GPS proximity, truck capacity limits, and nearby dustbin fill levels...
              </p>
            </div>
          ) : planResult ? (
            <div className="space-y-6">
              {/* Recommendation Rationale Highlight */}
              {planResult.recommendationRationale && (
                <div className="bg-emerald-50/80 border-2 border-emerald-500 rounded-3xl p-6 shadow-xs space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-950 font-bold text-sm">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span>Auto-Suggest Recommendation Rationale</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                    {planResult.recommendationRationale}
                  </p>
                </div>
              )}

              {/* 3 Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Optimal Truck Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recommended Truck
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Rank #1 Nearest
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 m-0 flex items-center space-x-2">
                      <TruckIcon className="w-4 h-4 text-emerald-600" />
                      <span>{planResult.truckCode}</span>
                    </h4>
                    {planResult.truckDistanceKm != null && (
                      <span className="text-xs text-slate-500 font-medium">
                        Proximity: <strong>{planResult.truckDistanceKm} km</strong> from roadside report
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Capacity:</span>
                      <strong className="text-slate-900">{planResult.truckCapacityKg} kg</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Assigned Driver:</span>
                      <strong className="text-emerald-700">
                        {planResult.assignedDriverName || 'Unassigned'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bundled Bins Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Bundled Municipal Bins
                    </span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {planResult.selectedBinsCount} Bins Bundled
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 m-0 flex items-center space-x-2">
                      <Trash2 className="w-4 h-4 text-blue-600" />
                      <span>{planResult.selectedBinsTotalKg} kg Additional</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      High-fill bins within {searchRadiusKm} km radius
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span>Bundled collection avoids duplicate truck trips to the same zone.</span>
                  </div>
                </div>

                {/* Combined Payload & Feasibility */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Capacity Verification
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        planResult.feasible
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {planResult.feasible ? 'Within Limits' : 'Capacity Exceeded'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 m-0">
                      {planResult.combinedAdditionalLoadKg} / {planResult.truckCapacityKg} kg
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Remaining Free: <strong>{planResult.projectedRemainingCapacityKg} kg</strong>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        planResult.feasible ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (planResult.combinedAdditionalLoadKg / planResult.truckCapacityKg) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Stop Sequence & Quick Actions Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900 m-0">
                      Recommended Stop-by-Stop Collection Route ({planResult.recommendedStops?.length} stops)
                    </h4>
                  </div>
                  {planResult.estimatedTotalDistanceKm != null && (
                    <span className="text-xs font-semibold text-slate-500">
                      Est. Route Distance: <strong>{planResult.estimatedTotalDistanceKm} km</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {planResult.recommendedStops?.map((stop) => (
                    <div
                      key={stop.stopOrder}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {stop.stopOrder}
                        </span>
                        <strong className="text-slate-800 truncate">{stop.locationName}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                        <span>Load:</span>
                        <span className="font-bold text-slate-800">{stop.plannedKg} kg</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto Actions Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPlanningMode('MANUAL')}
                    className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center space-x-1.5 cursor-pointer py-2 px-3 rounded-xl hover:bg-slate-50"
                  >
                    <span>Need to customize? Switch to Manual Planning Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!planResult.feasible || confirming}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Assignment (Dispatch to Driver)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs text-slate-400 text-xs">
              Select a pending roadside report to generate an automated collection suggestion.
            </div>
          )}
        </div>
      )}

      {/* Manual Planning Mode View */}
      {planningMode === 'MANUAL' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: Select Citizen Report & Truck */}
        <div className="space-y-5">
          {/* Step A: Select Citizen Report */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Step A: Roadside Report</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {reports.length} Pending
              </span>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                No pending roadside waste reports requiring collection.
              </p>
            ) : (
              <select
                value={selectedReportId || ''}
                onChange={(e) => setSelectedReportId(Number(e.target.value))}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
              >
                {reports.map((r) => (
                  <option key={r.reportId} value={r.reportId}>
                    #{r.reportId} - {r.areaName} ({r.wasteCategory}, ~{r.estimatedQuantityKg} kg)
                  </option>
                ))}
              </select>
            )}

            {selectedReport && (
              <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-2 text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Material Category:</span>
                  <strong className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedReport.wasteCategory}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roadside Weight:</span>
                  <strong className="text-slate-900 font-bold">{selectedReport.estimatedQuantityKg} kg</strong>
                </div>
                <div>
                  <span className="text-slate-500">Location / Address:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedReport.address || `${selectedReport.areaName} (${selectedReport.latitude?.toFixed(4)}, ${selectedReport.longitude?.toFixed(4)})`}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Description:</span>
                  <p className="italic text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60 mt-0.5">
                    "{selectedReport.description}"
                  </p>
                </div>
                {selectedReport.photoUrl && (
                  <img
                    src={selectedReport.photoUrl}
                    alt="Roadside Dump"
                    className="w-full h-24 object-cover rounded-xl mt-1 border border-slate-200"
                  />
                )}
              </div>
            )}
          </div>

          {/* Step C: Select Truck */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <TruckIcon className="w-4 h-4 text-emerald-600" />
              <span>Step C: Select Assigned Truck</span>
            </span>

            <div className="space-y-2">
              {trucks.map((t) => {
                const isSelected = selectedTruckId === t.truckId;
                const isAvail = t.operationalStatus === 'AVAILABLE';

                return (
                  <div
                    key={t.truckId}
                    onClick={() => isAvail && setSelectedTruckId(t.truckId)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : isAvail
                        ? 'border-slate-200 hover:border-slate-300 bg-white'
                        : 'border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                          <span>{t.truckCode}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({t.registrationNumber})</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{t.truckType}</span>
                        {t.assignedDriverName && (
                          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                            Driver: {t.assignedDriverName}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {t.operationalStatus}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">
                        Payload: {t.currentLoadKg}/{t.totalCapacityKg} kg
                      </span>
                      <span className="font-bold text-emerald-800">
                        Free: {t.remainingCapacityKg} kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Nearby Bins Selection (STEP D & DYNAMIC PROMPT) */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            {/* Prominent Required Prompt Heading */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Additional Nearby Waste Collection Available</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                This truck has remaining capacity. There are nearby municipal bins that may be collected on the same trip. Review their fill levels and select which bins to include.
              </p>
            </div>

            {/* Proximity Radius Slider */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-slate-700">Search Radius:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={searchRadiusKm}
                  onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                  className="w-24 accent-emerald-600 cursor-pointer"
                />
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                  {searchRadiusKm} km
                </span>
              </div>
            </div>

            {/* Candidate Dustbins List */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {loadingCandidates ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs">Finding nearby municipal bins...</span>
                </div>
              ) : candidateBins.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">
                  No candidate dustbins located within {searchRadiusKm} km of this report.
                </p>
              ) : (
                candidateBins.map((bin) => {
                  const isChecked = selectedBinIds.includes(bin.binId);
                  const isUrgent = bin.fillPercentage >= 75;

                  return (
                    <div
                      key={bin.binId}
                      className={`p-3 rounded-2xl border text-xs transition-all ${
                        !bin.eligible
                          ? 'border-slate-200 bg-slate-50/70 opacity-60'
                          : isChecked
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!bin.eligible}
                          onChange={() => toggleBinSelection(bin.binId)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                        />

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-900">{bin.binCode}</span>
                              <p className="text-[11px] text-slate-500">{bin.areaName}</p>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isUrgent
                                  ? 'bg-red-100 text-red-800'
                                  : bin.fillPercentage >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {bin.fillPercentage}% Full
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap justify-between items-center text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                            <span>
                              Waste: <strong className="text-slate-900">{bin.currentFillKg} kg</strong>
                            </span>
                            <span>
                              Proximity: <strong className="text-emerald-800">{bin.distanceKm !== undefined ? `${bin.distanceKm} km` : 'Zone match'}</strong>
                            </span>
                          </div>

                          {!bin.eligible && bin.exclusionReason && (
                            <p className="text-[10px] text-red-600 mt-1.5 italic font-medium">
                              ⚠️ {bin.exclusionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Dynamic Recalculation Panel & Route Sequence */}
        <div className="space-y-5">
          {planResult ? (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Gauge className="w-4 h-4 text-emerald-600" />
                  <span>Dynamic Load Calculation</span>
                </span>
                {calculating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
              </div>

              {/* Dynamic Calculation Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">1. Roadside Waste Load:</span>
                  <strong className="text-slate-900">{planResult.roadsideWasteKg} kg</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    2. Selected Bins ({planResult.selectedBinsCount} bins):
                  </span>
                  <strong className="text-slate-900">+{planResult.selectedBinsTotalKg} kg</strong>
                </div>

                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-900">
                  <span>Combined Additional Load:</span>
                  <span>{planResult.combinedAdditionalLoadKg} kg</span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Truck Initial Payload Free:</span>
                  <span>{planResult.truckInitialRemainingKg} kg</span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Projected Truck Total Load:</span>
                  <span className="font-semibold text-slate-800">{planResult.projectedTruckLoadKg} kg / {planResult.truckCapacityKg} kg</span>
                </div>

                <div
                  className={`flex justify-between pt-1 border-t border-slate-200 font-bold text-sm ${
                    planResult.feasible ? 'text-emerald-800' : 'text-red-600'
                  }`}
                >
                  <span>Projected Remaining Capacity:</span>
                  <span>{planResult.projectedRemainingCapacityKg} kg</span>
                </div>
              </div>

              {/* Capacity Warning Alert if Infeasible */}
              {!planResult.feasible && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs space-y-1 animate-pulse">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Plan Infeasible — Over Capacity!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {planResult.feasibilityWarning}
                  </p>
                  <p className="text-[10px] text-red-700 mt-1">
                    Tip: Deselect one or more bins, or choose a truck with larger payload capacity (e.g., TRK-01 or TRK-04).
                  </p>
                </div>
              )}

              {/* Recommended Ordered Stops Sequence */}
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Proximity Collection Sequence</span>
                </span>

                <div className="space-y-2">
                  {planResult.recommendedStops?.map((stop) => (
                    <div
                      key={stop.stopOrder}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2.5 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {stop.stopOrder}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">
                          {stop.locationName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Planned Pickup: <strong className="text-emerald-700">{stop.plannedKg} kg</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {planResult.estimatedTotalDistanceKm !== undefined && (
                  <div className="mt-2 p-2 bg-emerald-50/50 rounded-xl text-[11px] text-slate-600 flex justify-between">
                    <span>Est. Sequence Distance:</span>
                    <strong className="text-emerald-900">{planResult.estimatedTotalDistanceKm} km</strong>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!planResult.feasible || confirming}
                className={`w-full py-3 rounded-2xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center space-x-2 ${
                  planResult.feasible
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed opacity-70'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirm Collection Plan</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Select a report and truck to calculate combined feasibility.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && planResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                  Admin Dispatch Gate
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 m-0">
                  Confirm Combined Collection Dispatch
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are authorizing a combined collection trip linking citizen roadside dump <strong>#{planResult.reportId}</strong> with <strong>{planResult.selectedBinsCount} municipal dustbins</strong>.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Truck:</span>
                <strong className="text-slate-900">{planResult.truckCode} ({planResult.truckCapacityKg} kg max)</strong>
              </div>
              {planResult.assignedDriverName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Driver:</span>
                  <strong className="text-emerald-700">{planResult.assignedDriverName}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Roadside Waste:</span>
                <strong>{planResult.roadsideWasteKg} kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nearby Bins Load:</span>
                <strong>{planResult.selectedBinsTotalKg} kg ({planResult.selectedBinsCount} bins)</strong>
              </div>
              <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-slate-200">
                <span>Total Combined Payload:</span>
                <span>{planResult.combinedAdditionalLoadKg} kg</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Projected Remaining Capacity:</span>
                <span>{planResult.projectedRemainingCapacityKg} kg</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmPlan}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
              >
                {confirming ? 'Persisting to MySQL...' : 'Confirm & Commit Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE 2: Explicit Facility Destination Modal with "Go to This Industry" */}
      {showFacilityModal && selectedFacilityForModal && confirmedTrip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base m-0">
                    Recycling Destination Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review facility specifications and confirm dispatch destination
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFacilityModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {dispatchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}

            {/* Facility Information Box */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2.5 text-xs">
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
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Location / Address</span>
                  <span className="font-semibold text-slate-800">{selectedFacilityForModal.address}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Contact Person</span>
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

            {/* Trip & Dispatch Linkage Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Dispatched Trip &amp; Truck Association
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Collection Trip</span>
                  <strong className="text-slate-800 font-mono text-[11px]">{confirmedTrip.tripCode}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Truck</span>
                  <strong className="text-slate-800">{confirmedTrip.truckCode}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Dispatched Payload</span>
                  <strong className="text-emerald-700">{confirmedTrip.combinedAdditionalLoadKg} kg</strong>
                </div>
              </div>
            </div>

            {/* Transfer Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Transfer &amp; Manifest Notes
              </label>
              <input
                type="text"
                value={industryNotes}
                onChange={(e) => setIndustryNotes(e.target.value)}
                placeholder="e.g. Weighbridge manifest instructions, driver gate pass notes..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
              />
            </div>

            {/* Modal Actions with Prominent "Go to This Industry" Button */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFacilityModal(false)}
                className="flex-1 py-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dispatchingIndustry}
                onClick={handleConfirmIndustryDispatch}
                className="flex-2 py-3 px-5 text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                <span>{dispatchingIndustry ? 'Assigning Destination...' : 'Go to This Industry'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
