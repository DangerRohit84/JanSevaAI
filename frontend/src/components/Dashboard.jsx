import React, { useState, useEffect } from 'react';
import { getDashboard, getRanking } from '../hooks/useApi';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashData, rankData] = await Promise.all([
        getDashboard(),
        getRanking(),
      ]);
      setStats(dashData);
      setRankings(rankData.rankings || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">MP Dashboard</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Total Submissions</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.total_submissions || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Priority Areas</div>
          <div className="text-3xl font-bold text-blue-600">{rankings.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Top Theme</div>
          <div className="text-3xl font-bold text-green-600">
            {stats?.top_themes?.[0]?.theme || 'N/A'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Active Wards</div>
          <div className="text-3xl font-bold text-purple-600">
            {stats?.ward_distribution?.length || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Queue</h2>
          <div className="space-y-3">
            {rankings.slice(0, 5).map((item) => (
              <Link
                key={item.category}
                to={`/evidence/${item.category}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <div className="font-medium text-gray-900 capitalize">{item.category}</div>
                  <div className="text-sm text-gray-500">{item.submission_count} requests</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.max_urgency === 'high' || item.max_urgency === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : item.max_urgency === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.max_urgency}
                  </span>
                  <span className="text-lg font-bold text-blue-600">{item.priority_score}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
          <div className="space-y-3">
            {stats?.recent_submissions?.slice(0, 5).map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Theme Distribution</h2>
        <div className="space-y-3">
          {stats?.top_themes?.map((item) => {
            const percentage = stats.total_submissions > 0
              ? (item.count / stats.total_submissions) * 100
              : 0;
            return (
              <div key={item.theme} className="flex items-center space-x-4">
                <span className="w-24 text-sm text-gray-700 capitalize">{item.theme}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-16 text-right text-sm font-medium text-gray-900">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
