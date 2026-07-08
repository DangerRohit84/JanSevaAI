import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { getHotspots } from '../hooks/useApi';

const CATEGORY_COLORS = {
  infrastructure: '#ef4444',
  education: '#3b82f6',
  health: '#10b981',
  water: '#06b6d4',
  sanitation: '#8b5cf6',
  transport: '#f59e0b',
  agriculture: '#84cc16',
  electricity: '#f97316',
  other: '#6b7280',
};

export default function HotspotMap() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const mapDivRef = useRef(null);
  const mapObjRef = useRef(null);
  const markersArrRef = useRef([]);

  const loadHotspots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHotspots();
      setHotspots(data.hotspots || []);
    } catch (e) {
      console.error('Failed to load hotspots:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  useEffect(() => {
    if (loading) return;
    const el = mapDivRef.current;
    if (!el || mapObjRef.current) return;

    const timer = setTimeout(() => {
      const map = L.map(el, { center: [20.5937, 78.9629], zoom: 5, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);
      mapObjRef.current = map;
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || hotspots.length === 0) return;

    markersArrRef.current.forEach((m) => m.remove());
    markersArrRef.current = [];

    const maxCount = Math.max(...hotspots.map((h) => h.submission_count), 1);
    const b = [];

    hotspots.forEach((h) => {
      const r = Math.max(5, Math.min(22, (h.submission_count / maxCount) * 22));
      const c = CATEGORY_COLORS[h.dominant_theme] || '#6b7280';
      const m = L.circleMarker([h.centroid_lat, h.centroid_lon], {
        radius: r, fillColor: c, color: '#fff', weight: 2, fillOpacity: 0.85,
      }).addTo(map);
      m.bindPopup('<b style="text-transform:capitalize">' + h.dominant_theme + '</b><br/>' + h.submission_count + ' requests');
      markersArrRef.current.push(m);
      b.push([h.centroid_lat, h.centroid_lon]);
    });

    if (b.length > 0) map.fitBounds(b, { padding: [40, 40] });
    setTimeout(() => map.invalidateSize(), 100);
  }, [hotspots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demand Hotspots</h1>
        <button onClick={loadHotspots} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div style={{ flex: '0 0 66.666%' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div ref={mapDivRef} style={{ width: '100%', height: '500px' }}></div>
          </div>
        </div>
        <div style={{ flex: '0 0 33.333%' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Hotspot List</h2>
            <div style={{ maxHeight: '440px', overflowY: 'auto' }}>
              {hotspots.map((h) => (
                <div
                  key={h.cluster_id}
                  onClick={() => { setSelectedHotspot(h); if (mapObjRef.current) mapObjRef.current.setView([h.centroid_lat, h.centroid_lon], 12); }}
                  style={{
                    padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
                    background: selectedHotspot?.cluster_id === h.cluster_id ? '#eff6ff' : '#f9fafb',
                    border: selectedHotspot?.cluster_id === h.cluster_id ? '1px solid #bfdbfe' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, color: '#fff', background: CATEGORY_COLORS[h.dominant_theme] || '#6b7280' }}>
                      {h.dominant_theme}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{h.submission_count} req</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {h.centroid_lat?.toFixed(4)}, {h.centroid_lon?.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Legend</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }}></div>
              <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
