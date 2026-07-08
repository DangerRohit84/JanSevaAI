import React, { useState, useEffect } from 'react';
import { getRanking } from '../hooks/useApi';
import { Link } from 'react-router-dom';

export default function PriorityQueue() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const data = await getRanking();
      setRankings(data.rankings || []);
    } catch (error) {
      console.error('Failed to load rankings:', error);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Priority Queue</h1>
        <button
          onClick={loadRankings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {rankings.map((item) => (
          <Link
            key={item.category}
            to={`/evidence/${item.category}`}
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl font-bold text-blue-600">#{item.rank}</span>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{item.category}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.max_urgency === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : item.max_urgency === 'high'
                      ? 'bg-orange-100 text-orange-800'
                      : item.max_urgency === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.max_urgency} urgency
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <span>{item.submission_count} citizen requests</span>
                  <span>Score: {item.priority_score}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.top_themes?.map((theme, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {theme.theme} ({theme.count})
                    </span>
                  ))}
                </div>
              </div>

              <div className="ml-6 text-right">
                <div className="text-3xl font-bold text-blue-600">{item.priority_score}</div>
                <div className="text-xs text-gray-500">Priority Score</div>
              </div>
            </div>
          </Link>
        ))}

        {rankings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No priorities yet</h3>
            <p className="text-gray-500">Submit citizen requests to see priorities</p>
          </div>
        )}
      </div>
    </div>
  );
}
