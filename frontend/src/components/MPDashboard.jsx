import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE = '/api/v1';

export default function MPDashboard() {
  const [data, setData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const mpData = JSON.parse(localStorage.getItem('mp_data') || '{}');
  const token = localStorage.getItem('mp_token');

  useEffect(() => {
    if (!token) {
      navigate('/mp/login');
      return;
    }
    loadDashboard();
  }, [token, activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mp/dashboard`);
      const dashData = await res.json();
      setData(dashData);

      const subRes = await fetch(
        activeTab === 'all'
          ? `${API_BASE}/mp/submissions`
          : `${API_BASE}/mp/submissions?status=${activeTab}`
      );
      const subData = await subRes.json();
      setSubmissions(subData.submissions || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (submissionId, action) => {
    try {
      const res = await fetch(`${API_BASE}/mp/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          action,
          notes: actionNote || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail);
      toast.success(`Submission marked as ${action}`);
      setSelected(null);
      setActionNote('');
      loadDashboard();
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
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">JS</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">JanSevaAI</h1>
              <p className="text-xs text-gray-500">MP Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{mpData.name || 'MP'}</p>
              <p className="text-xs text-gray-500">{mpData.constituency || 'Constituency'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 border rounded-lg hover:border-red-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
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

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {['all', 'pending', 'reviewed', 'in_progress', 'resolved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-800">
                  Submissions ({submissions.length})
                </h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {submissions.map((sub) => (
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
                          <span className="font-medium text-sm text-gray-900">
                            {sub.citizen_name || 'Anonymous'}
                          </span>
                          {sub.phone && (
                            <span className="text-xs text-gray-400">{sub.phone}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{sub.text || 'No text'}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{sub.ward}</span>
                          {sub.category && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {sub.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1 ml-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(sub.urgency)}`}>
                          {sub.urgency}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="px-4 py-12 text-center text-gray-400">
                    No submissions found
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
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Citizen</p>
                    <p className="text-sm font-medium">{selected.citizen_name || 'Anonymous'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{selected.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">
                      {selected.ward}, {selected.district}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {selected.category || 'other'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Urgency</p>
                    <span className={`text-sm px-2 py-1 rounded border ${getUrgencyColor(selected.urgency)}`}>
                      {selected.urgency}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-sm">{selected.text || 'No description'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Status</p>
                    <span className={`text-sm px-2 py-1 rounded ${getStatusColor(selected.status)}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Action Notes</label>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Add notes about this action..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAction(selected.id, 'reviewed')}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleAction(selected.id, 'in_progress')}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleAction(selected.id, 'resolved')}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                  >
                    ✓ Resolved
                  </button>
                  <button
                    onClick={() => handleAction(selected.id, 'rejected')}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
                <p>Select a submission to take action</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
