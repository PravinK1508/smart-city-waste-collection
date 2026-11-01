import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Trash2,
  Truck as TruckIcon,
  Recycle,
  Filter,
  Layers,
  ArrowRight,
  Info,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { WasteReport, DustBin, Truck, RecyclingFacility } from '../types';
import { api } from '../api/client';

interface InteractiveMapProps {
  onPlanReport?: (reportId: number) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onPlanReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [bins, setBins] = useState<DustBin[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [facilities, setFacilities] = useState<RecyclingFacility[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter toggles
  const [showReports, setShowReports] = useState(true);
  const [showBins, setShowBins] = useState(true);
  const [showTrucks, setShowTrucks] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);

  // Selected item detail panel
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'REPORT' | 'BIN' | 'TRUCK' | 'FACILITY';
    data: any;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsData, binsData, trucksData, facilitiesData] = await Promise.all([
        api.getAllReports(),
        api.getAllBins(),
        api.getAllTrucks(),
        api.getFacilities(),
      ]);
      setReports(reportsData);
      setBins(binsData);
      setTrucks(trucksData);
      setFacilities(facilitiesData);
    } catch (err) {
      console.error('Error loading map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Perundurai / Erode district (11.2756, 77.5833)
      const map = L.map(mapContainerRef.current, {
        center: [11.285, 77.61],
        zoom: 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render markers whenever data or toggles change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    // 1. Citizen Waste Reports
    if (showReports) {
      reports.forEach((rep) => {
        if (rep.latitude && rep.longitude) {
          const isPending = rep.status === 'PENDING';
          const iconHtml = `
            <div style="background-color: ${isPending ? '#ef4444' : '#f59e0b'}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
          `;
          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-report-pin',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([rep.latitude, rep.longitude], { icon: customIcon });
          marker.on('click', () => {
            setSelectedEntity({ type: 'REPORT', data: rep });
          });
          marker.bindTooltip(`Report #${rep.reportId}: ${rep.wasteCategory} (${rep.status})`, { direction: 'top' });
          marker.addTo(layerGroupRef.current!);
        }
      });
    }

    // 2. Municipal Dustbins (color-coded by fill level)
    if (showBins) {
      bins.forEach((bin) => {
        if (bin.latitude && bin.longitude) {
          let bgColor = '#10b981'; // emerald <50%
          if (bin.fillPercentage >= 75) bgColor = '#ef4444'; // red >=75%
          else if (bin.fillPercentage >= 50) bgColor = '#f59e0b'; // amber >=50%

          const iconHtml = `
            <div style="background-color: ${bgColor}; width: 30px; height: 30px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); font-size: 10px; font-weight: bold; cursor: pointer;">
              <span>${Math.round(bin.fillPercentage)}%</span>
            </div>
          `;
          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-bin-pin',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          const marker = L.marker([bin.latitude, bin.longitude], { icon: customIcon });
          marker.on('click', () => {
            setSelectedEntity({ type: 'BIN', data: bin });
          });
          marker.bindTooltip(`Bin ${bin.binCode}: ${bin.currentFillKg}/${bin.binCapacityKg} kg (${bin.fillPercentage}%)`, { direction: 'top' });
          marker.addTo(layerGroupRef.current!);
        }
      });
    }

    // 3. Collection Trucks
    if (showTrucks) {
      trucks.forEach((trk) => {
        if (trk.currentLatitude && trk.currentLongitude) {
          const isAvail = trk.operationalStatus === 'AVAILABLE';
          const iconHtml = `
            <div style="background-color: ${isAvail ? '#2563eb' : '#64748b'}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); cursor: pointer;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>
            </div>
          `;
          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-truck-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([trk.currentLatitude, trk.currentLongitude], { icon: customIcon });
          marker.on('click', () => {
            setSelectedEntity({ type: 'TRUCK', data: trk });
          });
          marker.bindTooltip(`Truck ${trk.truckCode} (${trk.operationalStatus}) - Free: ${trk.remainingCapacityKg} kg`, { direction: 'top' });
          marker.addTo(layerGroupRef.current!);
        }
      });
    }

    // 4. Recycling Facilities
    if (showFacilities) {
      facilities.forEach((fac) => {
        if (fac.latitude && fac.longitude) {
          const iconHtml = `
            <div style="background-color: #8b5cf6; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); cursor: pointer;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"></path><path d="M11 19h8.2a1.8 1.8 0 0 0 1.7-1.2 1.8 1.8 0 0 0-.3-1.8L17.5 11"></path><path d="m14 5 3 5h-6l3-5Z"></path></svg>
            </div>
          `;
          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-facility-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([fac.latitude, fac.longitude], { icon: customIcon });
          marker.on('click', () => {
            setSelectedEntity({ type: 'FACILITY', data: fac });
          });
          marker.bindTooltip(`Facility: ${fac.facilityName}`, { direction: 'top' });
          marker.addTo(layerGroupRef.current!);
        }
      });
    }
  }, [reports, bins, trucks, facilities, showReports, showBins, showTrucks, showFacilities]);

  return (
    <div className="space-y-4">
      {/* Map Control Bar & Layer Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Map Layers:</span>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={showReports}
              onChange={(e) => setShowReports(e.target.checked)}
              className="rounded text-rose-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Reports ({reports.length})</span>
          </label>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={showBins}
              onChange={(e) => setShowBins(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Municipal Bins ({bins.length})</span>
          </label>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={showTrucks}
              onChange={(e) => setShowTrucks(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Truck Fleet ({trucks.length})</span>
          </label>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={showFacilities}
              onChange={(e) => setShowFacilities(e.target.checked)}
              className="rounded text-purple-600 focus:ring-0"
            />
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>Recycling Units ({facilities.length})</span>
          </label>
        </div>

        <button
          onClick={fetchData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Map & Interactive Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 bg-white p-2 rounded-3xl border border-slate-100 shadow-xs h-[560px] relative">
          <div ref={mapContainerRef} className="w-full h-full rounded-2xl" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-5 left-5 z-[400] bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1.5">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Marker Legend</p>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-white"></span>
              <span>Pending Citizen Roadside Waste</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block border border-white"></span>
              <span>Municipal Dustbin (&lt;50% Fill)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block border border-white"></span>
              <span>Municipal Dustbin (50-75% Fill)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block border border-white"></span>
              <span>Municipal Dustbin (&gt;75% Urgent)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-white"></span>
              <span>Municipal Collection Truck</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-purple-600 inline-block border border-white"></span>
              <span>Registered Recycling Facility</span>
            </div>
          </div>
        </div>

        {/* Selected Inspector Panel */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between h-[560px] overflow-y-auto">
          {selectedEntity ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {selectedEntity.type} INSPECTOR
                </span>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* REPORT DETAILS */}
              {selectedEntity.type === 'REPORT' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Report #{selectedEntity.data.reportId}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      {selectedEntity.data.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-2 text-slate-600">
                    <div>
                      <strong className="text-slate-800">Category:</strong> {selectedEntity.data.wasteCategory}
                    </div>
                    <div>
                      <strong className="text-slate-800">Locality:</strong> {selectedEntity.data.areaName}
                    </div>
                    <div>
                      <strong className="text-slate-800">Address:</strong> {selectedEntity.data.address || 'GPS Coordinates Stored'}
                    </div>
                    <div>
                      <strong className="text-slate-800">Estimated Load:</strong>{' '}
                      <span className="font-bold text-emerald-700">{selectedEntity.data.estimatedQuantityKg} kg</span>
                    </div>
                    <div>
                      <strong className="text-slate-800">Description:</strong>
                      <p className="p-2 bg-slate-50 rounded-lg text-slate-700 mt-1 italic">
                        "{selectedEntity.data.description}"
                      </p>
                    </div>
                    {selectedEntity.data.photoUrl && (
                      <div>
                        <strong className="text-slate-800">Attached Photograph:</strong>
                        <img
                          src={selectedEntity.data.photoUrl}
                          alt="Report photo"
                          className="w-full h-32 object-cover rounded-xl mt-1 border border-slate-200"
                        />
                      </div>
                    )}
                  </div>

                  {selectedEntity.data.status === 'PENDING' && onPlanReport && (
                    <button
                      onClick={() => onPlanReport(selectedEntity.data.reportId)}
                      className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Plan Combined Trip For This</span>
                    </button>
                  )}
                </div>
              )}

              {/* BIN DETAILS */}
              {selectedEntity.type === 'BIN' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Dustbin {selectedEntity.data.binCode}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedEntity.data.areaName}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fill Level:</span>
                      <strong className="text-slate-900">{selectedEntity.data.fillPercentage}%</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          selectedEntity.data.fillPercentage >= 75
                            ? 'bg-red-500'
                            : selectedEntity.data.fillPercentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${selectedEntity.data.fillPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Current Waste:</span>
                      <strong>{selectedEntity.data.currentFillKg} kg</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Bin Capacity:</span>
                      <strong>{selectedEntity.data.binCapacityKg} kg</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Waste Category:</span>
                      <strong>{selectedEntity.data.wasteCategory}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Operational Status:</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                        {selectedEntity.data.operationalStatus}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Collection Status:</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-[10px]">
                        {selectedEntity.data.collectionStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TRUCK DETAILS */}
              {selectedEntity.type === 'TRUCK' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Truck {selectedEntity.data.truckCode}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedEntity.data.registrationNumber}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type:</span>
                      <strong className="text-slate-900">{selectedEntity.data.truckType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Capacity:</span>
                      <strong className="text-slate-900">{selectedEntity.data.totalCapacityKg} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Load:</span>
                      <strong className="text-amber-600">{selectedEntity.data.currentLoadKg} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remaining Payload:</span>
                      <strong className="text-emerald-700">{selectedEntity.data.remainingCapacityKg} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Operational Status:</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                        {selectedEntity.data.operationalStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Zone:</span>
                      <strong className="text-slate-900">{selectedEntity.data.assignedArea || 'Universal'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* FACILITY DETAILS */}
              {selectedEntity.type === 'FACILITY' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {selectedEntity.data.facilityName}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                      {selectedEntity.data.facilityType}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div>
                      <strong className="text-slate-700">Address:</strong> {selectedEntity.data.address}
                    </div>
                    <div>
                      <strong className="text-slate-700">Accepted Materials:</strong>{' '}
                      <span className="text-emerald-700 font-semibold">{selectedEntity.data.acceptedCategories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily Intake Capacity:</span>
                      <strong>{selectedEntity.data.dailyCapacityKg} kg/day</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Daily Intake:</span>
                      <strong>{selectedEntity.data.currentIntakeKg} kg</strong>
                    </div>
                    <div>
                      <strong className="text-slate-700">Contact:</strong> {selectedEntity.data.contactPerson} ({selectedEntity.data.contactPhone})
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
              <MapPin className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No Marker Selected</p>
              <p className="text-[11px] leading-relaxed">
                Click any report, dustbin, truck, or recycling facility marker on the map to inspect real parameters and trigger operations.
              </p>
            </div>
          )}

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 mt-auto">
            <span className="font-bold">GIS Coordinate Integrity:</span> Markers are rendered directly from stored geographic coordinates in MySQL. Distance calculations distinguish straight-line proximity from road routes.
          </div>
        </div>
      </div>
    </div>
  );
};
