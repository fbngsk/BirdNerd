import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Filter, X, ChevronDown, Loader2, Navigation, RefreshCw, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Types
interface Sighting {
  id: string;
  bird_id: string;
  bird_name: string;
  bird_rarity: string;
  lat: number;
  lng: number;
  sighted_at: string;
  sighting_count: number;
}

interface RadarMapProps {
  userLocation: { lat: number; lng: number } | null;
  onClose?: () => void;
}

// Rarity to color mapping
const getRarityColor = (rarity: string): string => {
  switch (rarity?.toLowerCase()) {
    case 'legendär':
      return '#EAB308'; // Gold
    case 'selten':
    case 'epic':
      return '#A855F7'; // Purple
    case 'gefährdet':
    case 'stark gefährdet':
      return '#EF4444'; // Red
    case 'urlaubsfund':
      return '#F97316'; // Orange
    default:
      return '#14B8A6'; // Teal (common)
  }
};

// Time filter options
const TIME_FILTERS = [
  { label: 'Heute', value: 1 },
  { label: '3 Tage', value: 3 },
  { label: '7 Tage', value: 7 },
];

export const RadarMap: React.FC<RadarMapProps> = ({ userLocation, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null);
  const [timeFilter, setTimeFilter] = useState(7);
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Default center (Germany)
  const defaultCenter = { lat: 51.1657, lng: 10.4515 };
  const center = userLocation || defaultCenter;

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    // Check if already loaded
    if (window.L) {
      setMapReady(true);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Initialize map when Leaflet is ready
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapRef.current) return;

    const L = window.L;
    
    // Create map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([center.lat, center.lng], userLocation ? 11 : 6);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background: #3B82F6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('Dein Standort');
    }

    mapRef.current = map;
  }, [mapReady, center.lat, center.lng, userLocation]);

  // Fetch sightings
  const fetchSightings = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_nearby_sightings', {
          user_lat: center.lat,
          user_lng: center.lng,
          radius_km: 100,
          days_back: timeFilter
        });

      if (fetchError) throw fetchError;
      setSightings(data || []);
    } catch (e) {
      console.error('Failed to fetch sightings:', e);
      setError('Konnte Sichtungen nicht laden');
      
      // Fallback: Direct query if RPC fails
      try {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - timeFilter);
        
        const { data: fallbackData } = await supabase
          .from('bird_sightings')
          .select('*')
          .eq('flagged', false)
          .gte('sighted_at', dateLimit.toISOString().split('T')[0])
          .limit(500);
        
        if (fallbackData) {
          setSightings(fallbackData);
          setError(null);
        }
      } catch {
        // Keep error
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSightings();
  }, [timeFilter, center.lat, center.lng]);

  // Update markers when sightings change
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    const L = window.L;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add sighting markers
    sightings.forEach(sighting => {
      const color = getRarityColor(sighting.bird_rarity);
      
      const icon = L.divIcon({
        className: 'sighting-marker',
        html: `<div style="
          width: ${sighting.sighting_count > 1 ? '32px' : '24px'};
          height: ${sighting.sighting_count > 1 ? '32px' : '24px'};
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">${sighting.sighting_count > 1 ? sighting.sighting_count : ''}</div>`,
        iconSize: [sighting.sighting_count > 1 ? 32 : 24, sighting.sighting_count > 1 ? 32 : 24],
        iconAnchor: [sighting.sighting_count > 1 ? 16 : 12, sighting.sighting_count > 1 ? 16 : 12],
      });

      const marker = L.marker([sighting.lat, sighting.lng], { icon })
        .addTo(mapRef.current)
        .on('click', () => setSelectedSighting(sighting));

      markersRef.current.push(marker);
    });
  }, [sightings]);

  // Center on user location
  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13, {
        animate: true
      });
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-2">
          <MapPin className="text-teal" size={24} />
          <div>
            <h1 className="font-bold text-teal text-lg leading-none">Radar</h1>
            <p className="text-xs text-gray-400">{sightings.length} Sichtungen</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
          >
            <Filter size={16} />
            {TIME_FILTERS.find(f => f.value === timeFilter)?.label}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Refresh */}
          <button
            onClick={fetchSightings}
            disabled={loading}
            className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="absolute top-16 right-4 z-20 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => {
                setTimeFilter(filter.value);
                setShowFilters(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 ${
                timeFilter === filter.value ? 'text-teal bg-teal/5' : 'text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-teal" size={32} />
              <span className="text-sm text-gray-500">Lade Sichtungen...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <Info size={20} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Center on User Button */}
        {userLocation && (
          <button
            onClick={centerOnUser}
            className="absolute bottom-24 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-teal hover:bg-gray-50 transition-colors"
          >
            <Navigation size={24} />
          </button>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-3 text-xs">
          <p className="font-bold text-gray-700 mb-2">Legende</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#14B8A6' }}></div>
              <span className="text-gray-600">Häufig</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#A855F7' }}></div>
              <span className="text-gray-600">Selten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#EAB308' }}></div>
              <span className="text-gray-600">Legendär</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }}></div>
              <span className="text-gray-600">Gefährdet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Sighting Panel */}
      {selectedSighting && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 animate-slide-up safe-area-bottom">
          <button
            onClick={() => setSelectedSighting(null)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
              style={{ background: getRarityColor(selectedSighting.bird_rarity) }}
            >
              🐦
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800">{selectedSighting.bird_name}</h3>
              <p className="text-sm text-gray-500">{selectedSighting.bird_rarity}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>📅 {formatDate(selectedSighting.sighted_at)}</span>
                {selectedSighting.sighting_count > 1 && (
                  <span>👥 {selectedSighting.sighting_count} Sichtungen</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedSighting.lat},${selectedSighting.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-teal text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors"
            >
              <Navigation size={18} />
              Route planen
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Add to global window type
declare global {
  interface Window {
    L: any;
  }
}
