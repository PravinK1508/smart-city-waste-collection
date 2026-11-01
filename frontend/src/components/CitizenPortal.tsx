import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Navigation,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { User, WasteReport } from '../types';
import { api } from '../api/client';

interface CitizenPortalProps {
  currentUser: User;
  initialTab?: 'report' | 'my-reports';
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ currentUser, initialTab = 'report' }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'my-reports'>(initialTab);

  // Form State
  const [wasteCategory, setWasteCategory] = useState('Plastic');
  const [description, setDescription] = useState('');
  const [areaName, setAreaName] = useState(currentUser.areaName || 'Perundurai');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(11.2758);
  const [longitude, setLongitude] = useState<number | undefined>(77.5835);
  const [estimatedQuantityKg, setEstimatedQuantityKg] = useState<number>(40);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<WasteReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // My Reports State
  const [myReports, setMyReports] = useState<WasteReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true);
      const data = await api.getMyReports(currentUser.email);
      setMyReports(data);
    } catch (err: any) {
      console.error('Failed to load citizen reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-reports') {
      fetchMyReports();
    }
  }, [activeTab, currentUser.email]);

  const handleCaptureGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please enter street address manually.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(7)));
        setLongitude(Number(position.coords.longitude.toFixed(7)));
        setGpsCaptured(true);
      },
      (err) => {
        setGpsError(`GPS permission denied or unavailable (${err.message}). Storing locality address fallback.`);
        setGpsCaptured(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim()) {
      setErrorMessage('Please provide a description of the waste accumulation.');
      return;
    }

    if (!areaName.trim()) {
      setErrorMessage('Please select or enter the locality name.');
      return;
    }

    try {
      setSubmitting(true);
      let photoUrl: string | undefined = undefined;

      // Upload photo first if selected
      if (photoFile) {
        setUploadingPhoto(true);
        photoUrl = await api.uploadPhoto(photoFile);
        setUploadingPhoto(false);
      }

      const reportPayload = {
        citizenEmail: currentUser.email,
        citizenName: currentUser.fullName,
        citizenPhone: currentUser.phone || '9876543210',
        wasteCategory,
        description,
        areaName,
        address: address.trim() || undefined,
        latitude,
        longitude,
        photoUrl,
        estimatedQuantityKg,
      };

      const saved = await api.createReport(reportPayload);
      setSubmittedReport(saved);

      // Reset form
      setDescription('');
      setAddress('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setGpsCaptured(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please check your network and try again.');
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Citizen Navigation Pill */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'report' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Report Roadside Waste</span>
        </button>
        <button
          onClick={() => setActiveTab('my-reports')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'my-reports' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Submissions ({myReports.length})</span>
        </button>
      </div>

      {activeTab === 'report' ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">Citizen Roadside Waste Reporting</h2>
            <p className="text-xs text-slate-500 mt-1">
              Notify the municipal sanitation department of illegal dumping, street litter, or roadside waste.
            </p>
          </div>

          {/* Success Notification Modal */}
          {submittedReport && (
            <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl animate-fade-in text-emerald-900 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="text-base">Waste Report Successfully Persisted in MySQL!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Your report has been assigned authoritative <strong>Report ID: #{submittedReport.reportId}</strong>.
                Our optimization engine has queued this location for nearby municipal bin combination and truck dispatch.
              </p>
              <div className="pt-2 flex space-x-3">
                <button
                  onClick={() => {
                    setSubmittedReport(null);
                    setActiveTab('my-reports');
                  }}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Track In My Submissions
                </button>
                <button
                  onClick={() => setSubmittedReport(null)}
                  className="px-4 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-50"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Category Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Waste Material Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'Plastic', label: 'Plastic & Bottles', desc: 'PET, wrappers, packaging' },
                  { id: 'Organic', label: 'Organic & Food', desc: 'Vegetables, market waste' },
                  { id: 'E-Waste / Metal', label: 'E-Waste & Metal', desc: 'Appliances, scrap wires' },
                  { id: 'Construction / Debris', label: 'Construction Debris', desc: 'Rubble, tiles, mortar' },
                  { id: 'Mixed', label: 'Mixed Street Waste', desc: 'General unsorted debris' },
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setWasteCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      wasteCategory === cat.id
                        ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className={`block text-xs font-bold ${wasteCategory === cat.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {cat.label}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                2. Description of Waste Accumulation *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, landmarks, size of accumulation, or hazards..."
                rows={3}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* 3. Photograph Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                3. Photo Verification (Upload or Camera)
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <label className="flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50/50 transition-all">
                  <Camera className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">Select Image (JPG, PNG, WEBP)</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 10 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>

                {photoPreview && (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Geolocation & Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  4. Locality / Zone Name *
                </label>
                <select
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Perundurai">Perundurai Central</option>
                  <option value="Thindal">Thindal Ring Road</option>
                  <option value="Solar">Solar Transport Nagar</option>
                  <option value="SIPCOT">Perundurai SIPCOT Phase 1</option>
                  <option value="Erode Market">Erode Central Market</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Street Address / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Old Bus Stand, North Junction"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 5. GPS Capture Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>GPS Geotag Verification</span>
                </span>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{gpsCaptured ? 'Update Current GPS' : 'Capture Current Location'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-600 flex items-center space-x-4">
                <span>
                  <strong>Latitude:</strong> {latitude || 'Not set'}
                </span>
                <span>
                  <strong>Longitude:</strong> {longitude || 'Not set'}
                </span>
                {gpsCaptured && (
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    ✓ Real Browser GPS Locked
                  </span>
                )}
              </div>

              {gpsError && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {gpsError}
                </p>
              )}
            </div>

            {/* 6. Estimated Roadside Quantity */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-950">Estimated Roadside Waste Weight</p>
                <p className="text-[11px] text-emerald-700">
                  Used by our truck payload capacity engine to calculate feasibility before dispatch.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  max="1000"
                  step="5"
                  value={estimatedQuantityKg}
                  onChange={(e) => setEstimatedQuantityKg(Number(e.target.value))}
                  className="w-24 text-xs p-2 rounded-lg border border-emerald-300 font-bold text-center bg-white"
                />
                <span className="text-xs font-bold text-emerald-900">kg</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
            >
              {submitting || uploadingPhoto ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{uploadingPhoto ? 'Uploading Photo...' : 'Persisting to MySQL Database...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit Verified Waste Report</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* MY SUBMISSIONS TAB */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 m-0">My Reported Issues</h2>
              <p className="text-xs text-slate-500 mt-1">
                Authoritative database history for citizen account: <strong>{currentUser.email}</strong>
              </p>
            </div>
            <button
              onClick={fetchMyReports}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingReports ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              <p className="text-xs">Retrieving your reports...</p>
            </div>
          ) : myReports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No Reports Submitted Yet</p>
              <p className="text-[11px]">Any reports you submit will appear here with live tracking of municipal truck collection.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReports.map((report) => {
                const getStatusStyle = (st: string) => {
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
                      return 'bg-purple-50 text-purple-800 border-purple-200';
                    case 'CLOSED':
                      return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
                    default:
                      return 'bg-slate-50 text-slate-800 border-slate-200';
                  }
                };

                const getStatusLabel = (st: string) => {
                  switch (st) {
                    case 'PENDING':
                      return 'Pending Assignment';
                    case 'ASSIGNED':
                      return 'Truck Assigned';
                    case 'DISPATCHED':
                      return 'Fleet En Route';
                    case 'IN_PROGRESS':
                      return 'Collection In Progress';
                    case 'COLLECTION_COMPLETED':
                    case 'READY_FOR_RECYCLING':
                      return 'Waste Collected (Recycling In Progress)';
                    case 'CLOSED':
                      return 'CLOSED — Waste Collected and Delivered to Recycling Facility';
                    default:
                      return st;
                  }
                };

                return (
                  <div
                    key={report.reportId}
                    className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-emerald-200 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">
                            Report #{report.reportId}
                          </span>
                          <span className="text-xs font-medium text-slate-500">•</span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {report.wasteCategory}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted on {new Date(report.createdAt).toLocaleString()} in <strong>{report.areaName}</strong>
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusStyle(
                          report.status
                        )}`}
                      >
                        {getStatusLabel(report.status)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                      "{report.description}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center space-x-3">
                        <span>
                          <strong>Location:</strong> {report.address || `${report.latitude}, ${report.longitude}`}
                        </span>
                        <span>
                          <strong>Est. Weight:</strong> {report.estimatedQuantityKg} kg
                        </span>
                      </div>

                      {report.photoUrl && (
                        <a
                          href={report.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-semibold hover:underline flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Photo</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
