import {
  WasteReport,
  DustBin,
  Truck,
  CandidateBin,
  CollectionTrip,
  TripStop,
  TripPlanningResponse,
  RecyclingFacility,
  RecyclingDispatch,
  DashboardStats,
  SimulationResult,
  AuditLog,
  User,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errObj = await response.json();
      if (errObj.message) errMsg = errObj.message;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    const res = await fetchJson<any>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return {
      success: res.success,
      user: res.success
        ? {
            id: res.userId,
            fullName: res.fullName,
            email: res.email,
            role: res.role,
            areaName: res.areaName,
          }
        : undefined,
      message: res.message,
    };
  },

  // Reports
  createReport: (data: Partial<WasteReport>) =>
    fetchJson<WasteReport>(`${API_BASE}/reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAllReports: () => fetchJson<WasteReport[]>(`${API_BASE}/reports`),

  getMyReports: (email: string) =>
    fetchJson<WasteReport[]>(`${API_BASE}/reports/my-reports?email=${encodeURIComponent(email)}`),

  getReportById: (id: number) => fetchJson<WasteReport>(`${API_BASE}/reports/${id}`),

  updateReportStatus: (id: number, status: string, performedBy = 'Admin', notes = '') =>
    fetchJson<WasteReport>(`${API_BASE}/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, performedBy, notes }),
    }),

  // Upload photo
  uploadPhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Photo upload failed');
    }
    const data = await res.json();
    return data.url;
  },

  // Bins
  getAllBins: () => fetchJson<DustBin[]>(`${API_BASE}/bins`),

  getBinById: (id: number) => fetchJson<DustBin>(`${API_BASE}/bins/${id}`),

  getNearbyBins: (reportId: number, radius = 5.0) =>
    fetchJson<CandidateBin[]>(`${API_BASE}/bins/nearby?reportId=${reportId}&radius=${radius}`),

  updateBinFill: (id: number, currentFillKg: number) =>
    fetchJson<DustBin>(`${API_BASE}/bins/${id}/fill`, {
      method: 'PUT',
      body: JSON.stringify({ currentFillKg }),
    }),

  // Trucks
  getAllTrucks: () => fetchJson<Truck[]>(`${API_BASE}/trucks`),

  getAvailableTrucks: () => fetchJson<Truck[]>(`${API_BASE}/trucks/available`),

  getTruckById: (id: number) => fetchJson<Truck>(`${API_BASE}/trucks/${id}`),

  updateTruckStatus: (id: number, status: string, performedBy = 'Admin') =>
    fetchJson<Truck>(`${API_BASE}/trucks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, performedBy }),
    }),

  getTrucksByDriver: (driverId: number) => fetchJson<Truck[]>(`${API_BASE}/trucks/driver/${driverId}`),

  // Trips & Combined Planning
  getAutoSuggestPlan: (reportId: number, radius = 5.0) =>
    fetchJson<TripPlanningResponse>(`${API_BASE}/trips/auto-suggest?reportId=${reportId}&radiusKm=${radius}`),

  calculateTrip: (reportId: number, truckId: number, selectedBinIds: number[], notes = '') =>
    fetchJson<TripPlanningResponse>(`${API_BASE}/trips/calculate`, {
      method: 'POST',
      body: JSON.stringify({ reportId, truckId, selectedBinIds, notes }),
    }),

  confirmTrip: (reportId: number, truckId: number, selectedBinIds: number[], notes = '', adminName = 'Municipal Admin') =>
    fetchJson<TripPlanningResponse>(`${API_BASE}/trips/confirm?adminName=${encodeURIComponent(adminName)}`, {
      method: 'POST',
      body: JSON.stringify({ reportId, truckId, selectedBinIds, notes }),
    }),

  getAllTrips: () => fetchJson<CollectionTrip[]>(`${API_BASE}/trips`),

  getTripById: (id: number) => fetchJson<CollectionTrip>(`${API_BASE}/trips/${id}`),

  getTripsByDriver: (driverId: number) => fetchJson<CollectionTrip[]>(`${API_BASE}/trips/driver/${driverId}`),

  getTripStops: (tripId: number) => fetchJson<TripStop[]>(`${API_BASE}/trips/${tripId}/stops`),

  dispatchTrip: (id: number, performedBy = 'Admin') =>
    fetchJson<CollectionTrip>(`${API_BASE}/trips/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({ performedBy }),
    }),

  startTrip: (id: number, performedBy = 'Driver') =>
    fetchJson<CollectionTrip>(`${API_BASE}/trips/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ performedBy }),
    }),

  completeTrip: (id: number, actualRoadsideKg: number, binActualKg: Record<number, number>, notes = '', performedBy = 'Admin', collectionPhotoUrl = '') =>
    fetchJson<CollectionTrip>(`${API_BASE}/trips/${id}/complete?performedBy=${encodeURIComponent(performedBy)}`, {
      method: 'POST',
      body: JSON.stringify({ actualRoadsideKg, binActualKg, notes, collectionPhotoUrl }),
    }),

  // Recycling
  getFacilities: () => fetchJson<RecyclingFacility[]>(`${API_BASE}/recycling/facilities`),

  getRecyclingRecommendations: (tripId: number) =>
    fetchJson<RecyclingFacility[]>(`${API_BASE}/recycling/recommendations?tripId=${tripId}`),

  getDispatches: () => fetchJson<RecyclingDispatch[]>(`${API_BASE}/recycling/dispatches`),

  getDispatchByTripId: (tripId: number) =>
    fetchJson<RecyclingDispatch>(`${API_BASE}/recycling/dispatches/by-trip/${tripId}`),

  createDispatch: (tripId: number, facilityId: number, dispatchedQuantityKg?: number, notes = '', performedBy = 'Admin') =>
    fetchJson<RecyclingDispatch>(`${API_BASE}/recycling/dispatches?performedBy=${encodeURIComponent(performedBy)}`, {
      method: 'POST',
      body: JSON.stringify({ tripId, facilityId, dispatchedQuantityKg, notes }),
    }),

  updateDispatchStatus: (dispatchId: number, status: string, receivedWeightKg?: number, receiptNotes = '', performedBy = 'Facility Officer') =>
    fetchJson<RecyclingDispatch>(`${API_BASE}/recycling/dispatches/${dispatchId}/status?performedBy=${encodeURIComponent(performedBy)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, receivedWeightKg, receiptNotes }),
    }),

  submitDeliveryEvidence: (
    dispatchId: number,
    evidencePhotoUrl: string,
    deliveredWeightKg: number,
    deliveryNotes: string,
    driverId?: number,
    driverName?: string
  ) =>
    fetchJson<RecyclingDispatch>(`${API_BASE}/recycling/dispatches/${dispatchId}/submit-evidence`, {
      method: 'POST',
      body: JSON.stringify({ evidencePhotoUrl, deliveredWeightKg, deliveryNotes, driverId, driverName }),
    }),

  verifyDelivery: (
    dispatchId: number,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    verifiedWeightKg?: number,
    notes?: string,
    adminName = 'Municipal Admin'
  ) =>
    fetchJson<RecyclingDispatch>(`${API_BASE}/recycling/dispatches/${dispatchId}/verify?adminName=${encodeURIComponent(adminName)}`, {
      method: 'POST',
      body: JSON.stringify({ action, rejectionReason, verifiedWeightKg, notes }),
    }),

  // Analytics
  getDashboardStats: () => fetchJson<DashboardStats>(`${API_BASE}/analytics/dashboard`),

  // Audit Logs
  getAuditLogs: () => fetchJson<AuditLog[]>(`${API_BASE}/audit/logs`),
};
