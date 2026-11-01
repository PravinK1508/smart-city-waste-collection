export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'DRIVER' | 'CITIZEN';
  phone?: string;
  areaName?: string;
}

export interface WasteReport {
  reportId: number;
  citizenId?: number;
  citizenEmail: string;
  citizenName?: string;
  citizenPhone?: string;
  wasteCategory: string;
  description: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  areaName: string;
  estimatedQuantityKg: number;
  status: string; // PENDING, PLANNED, ASSIGNED, DISPATCHED, IN_PROGRESS, COLLECTION_COMPLETED, READY_FOR_RECYCLING, CLOSED
  createdAt: string;
  updatedAt: string;
}

export interface DustBin {
  binId: number;
  binCode: string;
  areaId: string;
  areaName: string;
  latitude: number;
  longitude: number;
  binCapacityKg: number;
  currentFillKg: number;
  fillPercentage: number;
  wasteCategory: string;
  operationalStatus: string; // ACTIVE, MAINTENANCE, DAMAGED, INACTIVE
  collectionStatus: string; // IDLE, SCHEDULED, COLLECTING, COLLECTED
  lastEmptiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Truck {
  truckId: number;
  truckCode: string;
  registrationNumber: string;
  truckType: string;
  totalCapacityKg: number;
  currentLoadKg: number;
  remainingCapacityKg: number;
  assignedArea?: string;
  operationalStatus: string; // AVAILABLE, ASSIGNED, EN_ROUTE, MAINTENANCE, OFF_DUTY
  currentLatitude?: number;
  currentLongitude?: number;
  lastActiveAt: string;
  assignedDriverId?: number;
  assignedDriverName?: string;
}

export interface CandidateBin {
  binId: number;
  binCode: string;
  areaName: string;
  latitude: number;
  longitude: number;
  binCapacityKg: number;
  currentFillKg: number;
  fillPercentage: number;
  wasteCategory: string;
  operationalStatus: string;
  collectionStatus: string;
  distanceKm?: number;
  eligible: boolean;
  exclusionReason?: string;
}

export interface TripStop {
  stopId?: number;
  tripId?: number;
  stopOrder: number;
  stopType: 'ROADSIDE_REPORT' | 'MUNICIPAL_BIN';
  referenceId: number;
  locationName: string;
  latitude: number;
  longitude: number;
  plannedKg: number;
  actualCollectedKg?: number;
  status: string; // PENDING, ARRIVED, COLLECTED, SKIPPED
  completedAt?: string;
}

export interface TripBin {
  id?: number;
  tripId?: number;
  binId: number;
  plannedKg: number;
  actualCollectedKg?: number;
  status: string;
  collectedAt?: string;
}

export interface CollectionTrip {
  tripId: number;
  tripCode: string;
  truckId: number;
  driverId?: number;
  driverName?: string;
  truckCode?: string;
  reportArea?: string;
  wasteCategory?: string;
  reportDescription?: string;
  reportAddress?: string;
  primaryReportId: number;
  status: string; // ASSIGNED, DISPATCHED, IN_PROGRESS, COLLECTION_COMPLETED, READY_FOR_RECYCLING, CLOSED
  plannedRoadsideKg: number;
  plannedBinsKg: number;
  plannedTotalLoadKg: number;
  actualCollectedKg?: number;
  collectionNotes?: string;
  collectionPhotoUrl?: string;
  dispatchedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  tripBins?: TripBin[];
  tripStops?: TripStop[];
  stops?: TripStop[];
}

export interface TripPlanningResponse {
  tripId?: number;
  tripCode?: string;
  reportId: number;
  reportDescription: string;
  truckId: number;
  truckCode: string;
  truckCapacityKg: number;
  truckCurrentLoadKg: number;
  truckInitialRemainingKg: number;
  roadsideWasteKg: number;
  selectedBinsCount: number;
  selectedBinsTotalKg: number;
  combinedAdditionalLoadKg: number;
  projectedTruckLoadKg: number;
  projectedRemainingCapacityKg: number;
  feasible: boolean;
  feasibilityWarning?: string;
  recommendedStops: TripStop[];
  estimatedTotalDistanceKm?: number;
  distanceCalculationMethod?: string;
  status?: string;
  message?: string;
  assignedDriverId?: number;
  assignedDriverName?: string;
  recommendationRationale?: string;
  recommendedBinIds?: number[];
  truckDistanceKm?: number;
}

export interface RecyclingFacility {
  facilityId: number;
  facilityCode: string;
  facilityName: string;
  facilityType: string;
  address: string;
  latitude: number;
  longitude: number;
  acceptedCategories: string;
  dailyCapacityKg: number;
  currentIntakeKg: number;
  operationalStatus: string; // ACTIVE, NEAR_CAPACITY, MAINTENANCE, INACTIVE
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface RecyclingDispatch {
  dispatchId: number;
  dispatchCode: string;
  tripId: number;
  facilityId: number;
  facilityName?: string;
  facilityAddress?: string;
  facilityType?: string;
  contactPerson?: string;
  contactPhone?: string;
  wasteCategory: string;
  dispatchedQuantityKg: number;
  status: string; // READY_FOR_DISPATCH, DISPATCH_PLANNED, DISPATCHED, DELIVERED, RECEIPT_CONFIRMED
  dispatchedAt?: string;
  deliveredAt?: string;
  receiptConfirmedAt?: string;
  receivedWeightKg?: number;
  deliveredWeightKg?: number;
  receiptNotes?: string;
  evidencePhotoUrl?: string;
  driverId?: number;
  driverName?: string;
  truckCode?: string;
  reportId?: number;
  verificationStatus?: string; // PENDING, APPROVED, REJECTED
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  deliveryNotes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  completedReports: number;
  totalBins: number;
  activeBins: number;
  binsAbove75Pct: number;
  averageBinFillPercentage: number;
  totalTrucks: number;
  availableTrucks: number;
  busyTrucks: number;
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  combinedTripsCount: number;
  singleSourceTripsCount: number;
  totalRecyclingDispatches: number;
  deliveredRecyclingDispatches: number;
  totalWasteCollectedKg: number;
  totalWasteRecycledKg: number;
  reportsByCategory: Record<string, number>;
  reportsByLocality: Record<string, number>;
  dispatchesByFacility: Record<string, number>;
}

export interface SimulationResult {
  label: string;
  feasible: boolean;
  feasibilityStatus: string;
  truckCode: string;
  truckCapacityKg: number;
  truckCurrentLoadKg: number;
  roadsideWasteKg: number;
  selectedBinsCount: number;
  selectedBinsTotalKg: number;
  combinedAdditionalLoadKg: number;
  projectedTruckLoadKg: number;
  projectedRemainingCapacityKg: number;
  simulatedStops: TripStop[];
  estimatedTotalDistanceKm: number;
  facilityName?: string;
  facilityAcceptsCategory?: boolean;
  facilityRecommendationNotes?: string;
  warnings: string[];
  assumptions: string[];
}

export interface AuditLog {
  logId: number;
  entityType: string;
  entityId: number;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  performedBy?: string;
  details?: string;
  createdAt: string;
}
