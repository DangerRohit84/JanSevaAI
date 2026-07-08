import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvidence } from '../hooks/useApi';

export default function EvidenceView() {
  const { category } = useParams();
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvidence();
  }, [category]);

  const loadEvidence = async () => {
    try {
      const data = await getEvidence(category);
      setEvidence(data);
    } catch (error) {
      console.error('Failed to load evidence:', error);
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

  if (!evidence) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No evidence found</h2>
        <p className="text-gray-500 mb-4">No submissions found for this category</p>
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{category}</h1>
            <p className="text-gray-600">
              {evidence.submission_count} citizen requests analyzed
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {evidence.submission_count}
            </div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
        </div>

        {evidence.evidence && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Evidence Summary</h2>
              <p className="text-gray-700 leading-relaxed">{evidence.evidence.summary}</p>
            </div>

            {evidence.evidence.key_findings && evidence.evidence.key_findings.length > 0 && (
              <div className="bg-green-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Findings</h2>
                <ul className="space-y-2">
                  {evidence.evidence.key_findings.map((finding, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evidence.evidence.recommended_actions && evidence.evidence.recommended_actions.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h2>
                <ul className="space-y-2">
                  {evidence.evidence.recommended_actions.map((action, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evidence.evidence.estimated_beneficiaries && (
              <div className="bg-yellow-50 rounded-xl p-6 text-center">
                <div className="text-sm text-gray-600 mb-1">Estimated Beneficiaries</div>
                <div className="text-4xl font-bold text-yellow-600">
                  {evidence.evidence.estimated_beneficiaries.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">people could benefit</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
