import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import toast from 'react-hot-toast';

const API_BASE = '/api/v1';

function exportCSV(data, filename) {
  if (!data.length) return toast.error('No data to export');
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => {
    let v = row[k];
    if (typeof v === 'object') v = JSON.stringify(v);
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = '"' + v.replace(/"/g, '""') + '"';
    return v ?? '';
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported ' + filename);
}

const CATEGORY_ICONS = {
  infrastructure: { emoji: '🏗️', color: '#ef4444', bg: '#fef2f2' },
  education: { emoji: '📚', color: '#3b82f6', bg: '#eff6ff' },
  health: { emoji: '🏥', color: '#10b981', bg: '#ecfdf5' },
  water: { emoji: '💧', color: '#06b6d4', bg: '#ecfeff' },
  sanitation: { emoji: '🗑️', color: '#8b5cf6', bg: '#f5f3ff' },
  transport: { emoji: '🚌', color: '#f59e0b', bg: '#fffbeb' },
  agriculture: { emoji: '🌾', color: '#84cc16', bg: '#f7fee7' },
  electricity: { emoji: '⚡', color: '#f97316', bg: '#fff7ed' },
  other: { emoji: '📋', color: '#6b7280', bg: '#f9fafb' },
};

export default function MPDashboard() {
  const [data, setData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [view, setView] = useState('overview');
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const navigate = useNavigate();

  const filteredSubmissions = useMemo(() => {
    let result = submissions;
    if (priorityFilter !== 'all') {
      result = result.filter(s => (s.analysis?.urgency || 'medium') === priorityFilter);
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(s =>
      (s.citizen_name || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.text || s.text_content || '').toLowerCase().includes(q) ||
      (s.ward || '').toLowerCase().includes(q) ||
      (s.district || '').toLowerCase().includes(q) ||
      (s.state || '').toLowerCase().includes(q) ||
      (s.analysis?.category || '').toLowerCase().includes(q)
    );
  }, [submissions, searchQuery, priorityFilter]);

  const mpData = JSON.parse(localStorage.getItem('mp_data') || '{}');
  const token = localStorage.getItem('mp_token');

  useEffect(() => {
    if (!token) {
      navigate('/mp/login');
      return;
    }
    loadAllData();
  }, [token]);

  useEffect(() => {
    if (view === 'map' && hotspots.length > 0 && mapRef.current && !mapObj.current) {
      const timer = setTimeout(() => {
        const map = L.map(mapRef.current, { center: [20.5937, 78.9629], zoom: 5, scrollWheelZoom: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        const maxCount = Math.max(...hotspots.map(h => h.submission_count), 1);
        hotspots.forEach(h => {
          const r = Math.max(5, Math.min(22, (h.submission_count / maxCount) * 22));
          const cat = CATEGORY_ICONS[h.dominant_theme] || CATEGORY_ICONS.other;
          L.circleMarker([h.centroid_lat, h.centroid_lon], {
            radius: r, fillColor: cat.color, color: '#fff', weight: 2, fillOpacity: 0.85,
          }).addTo(map).bindPopup('<b>' + h.dominant_theme + '</b><br/>' + h.submission_count + ' requests');
        });
        map.invalidateSize();
        mapObj.current = map;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [view, hotspots]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, rankRes, hotRes] = await Promise.all([
        fetch(`${API_BASE}/mp/dashboard`),
        fetch(`${API_BASE}/analysis/ranking`),
        fetch(`${API_BASE}/analysis/hotspots`),
      ]);
      setData(await dashRes.json());
      setRankings((await rankRes.json()).rankings || []);
      setHotspots((await hotRes.json()).hotspots || []);
      await loadSubmissions('all', 1, false);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadEvidence = async (category) => {
    setEvidenceLoading(true);
    try {
      const res = await fetch(`${API_BASE}/analysis/evidence/${category}`);
      const d = await res.json();
      setEvidence(prev => {
        const filtered = prev.filter(e => e.category !== category);
        return [...filtered, { category, ...d }];
      });
    } catch (err) {
      toast.error('Failed to load evidence');
    } finally {
      setEvidenceLoading(false);
    }
  };

  const loadSubmissions = async (tab, pageNum = 1, append = false, cat = categoryFilter) => {
    try {
      let url = `${API_BASE}/mp/submissions?page=${pageNum}&page_size=50`;
      if (tab !== 'all') url += `&status=${tab}`;
      if (cat && cat !== 'all') url += `&category=${cat}`;
      const res = await fetch(url);
      const data = await res.json();
      if (append) {
        setSubmissions(prev => [...prev, ...data.submissions]);
      } else {
        setSubmissions(data.submissions || []);
      }
      setTotalCount(data.total || 0);
      setHasMore(data.has_more);
    } catch (err) {
      toast.error('Failed to load submissions');
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await loadSubmissions(activeTab, nextPage, true, categoryFilter);
    setLoadingMore(false);
  };

  useEffect(() => {
    if (view !== 'submissions') return;
    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore) {
        loadMore();
      }
    };
    const el = document.getElementById('submissions-list');
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [view, hasMore, loadingMore, page, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setHasMore(true);
    loadSubmissions(tab, 1, false, categoryFilter);
  };

  const handleCategoryChange = (cat) => {
    setCategoryFilter(cat);
    setPage(1);
    setHasMore(true);
    loadSubmissions(activeTab, 1, false, cat);
  };

  const handleAction = async (submissionId, action) => {
    try {
      const res = await fetch(`${API_BASE}/mp/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, action, notes: actionNote || undefined }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail);
      toast.success(`Marked as ${action}`);
      setSelected(null);
      setActionNote('');
      loadAllData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_data');
    navigate('/');
  };

  const getUrgencyColor = (u) => {
    if (u === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (u === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (u === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getStatusColor = (s) => {
    if (s === 'resolved') return 'bg-green-100 text-green-700';
    if (s === 'in_progress') return 'bg-blue-100 text-blue-700';
    if (s === 'reviewed') return 'bg-purple-100 text-purple-700';
    if (s === 'rejected') return 'bg-gray-100 text-gray-500';
    return 'bg-yellow-100 text-yellow-700';
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="JanSevaAI" className="h-8 w-auto object-contain" />
            <div>
              <h1 className="font-bold text-gray-900">JanSevaAI</h1>
              <p className="text-xs text-gray-500">MP Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{mpData.name || 'MP'}</p>
              <p className="text-xs text-gray-500">{mpData.constituency || 'Constituency'}</p>
              <p className="text-xs text-blue-600 font-medium capitalize">{mpData.sector === 'all' ? 'All Sectors' : mpData.sector}</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 border rounded-lg hover:border-red-300 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* View Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'submissions', label: 'Submissions' },
            { id: 'priorities', label: 'Priorities' },
            { id: 'map', label: 'Hotspot Map' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                view === v.id ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW VIEW */}
        {view === 'overview' && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Requests', value: data?.stats?.total || 0, color: 'blue' },
                { label: 'Pending Review', value: data?.stats?.pending || 0, color: 'yellow' },
                { label: 'In Progress', value: data?.stats?.reviewed || 0, color: 'purple' },
                { label: 'Resolved', value: data?.stats?.resolved || 0, color: 'green' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 border">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className={`text-3xl font-bold text-${stat.color}-600 mt-1`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Priority Rankings */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">AI-Priority Rankings</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {rankings.slice(0, 8).map((r) => {
                  const cat = CATEGORY_ICONS[r.category] || CATEGORY_ICONS.other;
                  return (
                    <div key={r.category} className="p-3 rounded-xl border hover:shadow-md transition cursor-pointer" style={{ background: cat.bg }}>
                      <div className="text-2xl mb-1">{cat.emoji}</div>
                      <div className="text-sm font-bold capitalize">{r.category}</div>
                      <div className="text-xs text-gray-600">{r.submission_count} reports</div>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${getUrgencyColor(r.max_urgency)}`}>
                        {r.max_urgency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-800">Recent Submissions</h2>
              </div>
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {(data?.recent_submissions || []).map((sub, i) => (
                  <div key={sub.id || i} className="px-4 py-3 hover:bg-blue-50 cursor-pointer" onClick={() => { setView('submissions'); }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{sub.citizen_name}</span>
                        <p className="text-xs text-gray-500 truncate max-w-md">{sub.text}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sub.status)}`}>{sub.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown Chart */}
            {rankings.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Category Breakdown</h2>
                <div className="space-y-3">
                  {rankings.map((r) => {
                    const cat = CATEGORY_ICONS[r.category] || CATEGORY_ICONS.other;
                    const maxCount = Math.max(...rankings.map(r => r.submission_count), 1);
                    const pct = (r.submission_count / maxCount) * 100;
                    return (
                      <div key={r.category} className="flex items-center space-x-3">
                        <span className="text-lg w-8">{cat.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{r.category}</span>
                            <span className="text-xs text-gray-500">{r.submission_count} ({((r.submission_count / (data?.stats?.total || 1)) * 100).toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="h-2.5 rounded-full" style={{ width: pct + '%', background: cat.color }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* SUBMISSIONS VIEW */}
        {view === 'submissions' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
                {['all', 'pending', 'reviewed', 'in_progress', 'resolved', 'rejected'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
              <button
                onClick={() => exportCSV(filteredSubmissions.map(s => ({
                  id: s.id, citizen_name: s.citizen_name, phone: s.phone,
                  text: s.text || s.text_content, category: s.analysis?.category,
                  urgency: s.analysis?.urgency, status: s.status,
                  ward: s.ward, district: s.district, state: s.state,
                  created_at: s.created_at,
                })), 'submissions_export.csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                Export CSV
              </button>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-500 font-medium">Priority:</span>
              {[
                { id: 'all', label: 'All', color: 'bg-gray-100 text-gray-700' },
                { id: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
                { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
                { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                { id: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriorityFilter(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    priorityFilter === p.id
                      ? `${p.color} border-current shadow-sm`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Sector Filter */}
            {mpData.sector === 'all' && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-gray-500 font-medium">Sector:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sectors</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="water">Water Supply</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="transport">Transport</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="electricity">Electricity</option>
                </select>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, phone, location, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <p className="text-xs text-gray-500 mt-1">{filteredSubmissions.length} results for "{searchQuery}"</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-800">Submissions ({totalCount})</h2>
                  </div>
                  <div id="submissions-list" className="divide-y max-h-[600px] overflow-y-auto">
                    {filteredSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => setSelected(sub)}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${
                          selected?.id === sub.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">{sub.citizen_name || 'Anonymous'}</span>
                              {sub.phone && <span className="text-xs text-gray-400">{sub.phone}</span>}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{sub.text || sub.text_content || 'No text'}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">{sub.ward || sub.district}</span>
                              {sub.analysis?.category && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{sub.analysis.category}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1 ml-3">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(sub.analysis?.urgency || 'medium')}`}>
                              {sub.analysis?.urgency || 'medium'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sub.status)}`}>
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {loadingMore && (
                      <div className="px-4 py-3 text-center border-t">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    )}
                    {!hasMore && submissions.length > 0 && (
                      <div className="px-4 py-3 text-center border-t">
                        <p className="text-xs text-gray-400">All {submissions.length} submissions loaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {selected ? (
                  <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">Submission Detail</h3>
                      <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div><p className="text-xs text-gray-500">Citizen</p><p className="text-sm font-medium">{selected.citizen_name || 'Anonymous'}</p></div>
                      <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium">{selected.phone || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Location</p><p className="text-sm font-medium">{selected.ward || ''}, {selected.district || ''}, {selected.state || ''}</p></div>
                      <div><p className="text-xs text-gray-500">Category</p><span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{selected.analysis?.category || selected.category || 'other'}</span></div>
                      <div><p className="text-xs text-gray-500">Urgency</p><span className={`text-sm px-2 py-1 rounded border ${getUrgencyColor(selected.analysis?.urgency || 'medium')}`}>{selected.analysis?.urgency || 'medium'}</span></div>
                      <div><p className="text-xs text-gray-500">Description</p><p className="text-sm">{selected.text || selected.text_content || 'No description'}</p></div>
                      {selected.analysis?.themes && (
                        <div><p className="text-xs text-gray-500">Themes</p><div className="flex flex-wrap gap-1 mt-1">{selected.analysis.themes.map((t, i) => <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t}</span>)}</div></div>
                      )}
                      <div><p className="text-xs text-gray-500">Status</p><span className={`text-sm px-2 py-1 rounded ${getStatusColor(selected.status)}`}>{selected.status}</span></div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1">Action Notes</label>
                      <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Add notes about this action..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleAction(selected.id, 'reviewed')} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition">Mark Reviewed</button>
                      <button onClick={() => handleAction(selected.id, 'in_progress')} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition">In Progress</button>
                      <button onClick={() => handleAction(selected.id, 'resolved')} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition">✓ Resolved</button>
                      <button onClick={() => handleAction(selected.id, 'rejected')} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Reject</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
                    <p>Select a submission to take action</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* PRIORITIES VIEW */}
        {view === 'priorities' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-800 mb-4">AI-Powered Priority Rankings</h2>
            <p className="text-sm text-gray-500 mb-6">Ranked by urgency, volume, and recency using Gemini AI analysis</p>
            <div className="space-y-3">
              {rankings.map((r) => {
                const cat = CATEGORY_ICONS[r.category] || CATEGORY_ICONS.other;
                const maxScore = rankings[0]?.priority_score || 1;
                const width = (r.priority_score / maxScore) * 100;
                const ev = evidence.find(e => e.category === r.category);
                return (
                  <div key={r.category} className="p-4 rounded-xl border hover:shadow-md transition" style={{ borderLeft: `4px solid ${cat.color}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div>
                          <div className="text-sm font-bold capitalize">{r.category}</div>
                          <div className="text-xs text-gray-500">{r.submission_count} reports</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => loadEvidence(r.category)}
                          disabled={evidenceLoading}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition disabled:opacity-50"
                        >
                          {evidenceLoading ? 'Loading...' : 'AI Summary'}
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(r.max_urgency)}`}>{r.max_urgency}</span>
                        <div className="text-xs text-gray-500">Rank #{r.rank}</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full" style={{ width: width + '%', background: cat.color }}></div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {r.top_themes?.map((t, i) => <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t.theme} ({t.count})</span>)}
                    </div>
                    {ev && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-gray-700 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 mb-1">AI Analysis Summary</p>
                        {ev.summary || ev.evidence?.summary || 'No summary available'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MAP VIEW */}
        {view === 'map' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: '600px' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
        )}
      </main>
    </div>
  );
}
