import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicDashboard, getRanking } from '../hooks/useApi';

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

const URGENT_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

export default function LandingPage() {
  const [stats, setStats] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashData, rankData] = await Promise.all([
        getPublicDashboard(),
        getRanking(),
      ]);
      setStats(dashData);
      setRankings(rankData.rankings || []);
      setRecentIssues(dashData.recent_submissions || []);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
        padding: '80px 24px 60px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <img src="/logo.png" alt="JanSevaAI" style={{ height: '160px', display: 'inline-block' }} />
          </div>
          <p style={{ fontSize: '24px', color: '#1e3a5f', marginBottom: '8px', fontWeight: 600, marginTop: '24px' }}>
            जनसेवाAI — Your Voice, Your Development
          </p>
          <p style={{ fontSize: '16px', color: '#475569', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            AI-powered platform that consolidates citizen development requests into priority-ranked recommendations for MPs. Speak in any language — we listen.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/submit" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', background: '#2563eb', color: '#fff',
              borderRadius: '12px', fontSize: '16px', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
            }}>
              Submit Your Request
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link to="/priorities" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', background: '#0d9488', color: '#fff',
              borderRadius: '12px', fontSize: '16px', fontWeight: 600,
              textDecoration: 'none', border: 'none',
              transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(13,148,136,0.4)',
            }}>
              View Priorities
            </Link>
          </div>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e40af' }}>{stats?.total_submissions || 0}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Reports</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#dc2626' }}>{rankings.filter(r => r.max_urgency === 'critical' || r.max_urgency === 'high').length}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Critical Areas</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669' }}>{stats?.top_themes?.length || 0}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Problem Categories</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#7c3aed' }}>12</div>
              <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Languages Supported</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Categories */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>What People Are Reporting</h2>
          <p style={{ fontSize: '15px', color: '#6b7280' }}>Real-time citizen issues across India, analyzed by AI</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {stats?.top_themes?.map((theme) => {
            const cat = CATEGORY_ICONS[theme.theme] || CATEGORY_ICONS.other;
            return (
              <Link to={`/evidence/${theme.theme}`} key={theme.theme} style={{
                display: 'block', padding: '24px', background: cat.bg, borderRadius: '16px',
                border: '1px solid transparent', textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{cat.emoji}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', textTransform: 'capitalize', marginBottom: '4px' }}>{theme.theme}</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: cat.color }}>{theme.count} reports</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Live Feed */}
      <div style={{ background: '#f8fafc', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Live Issue Feed</h2>
            <p style={{ fontSize: '15px', color: '#6b7280' }}>Latest citizen submissions in real-time</p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {recentIssues.map((issue, i) => {
              const cat = CATEGORY_ICONS[issue.category] || CATEGORY_ICONS.other;
              return (
                <div key={issue.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px 20px', background: '#fff', borderRadius: '12px',
                  border: '1px solid #e5e7eb', transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', flexShrink: 0,
                  }}>
                    {cat.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {issue.text}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', textTransform: 'capitalize' }}>
                      {issue.category}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>
                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          {[
            { step: '1', title: 'Submit', desc: 'Report your issue in any language — text, voice, or photo', color: '#2563eb' },
            { step: '2', title: 'AI Analyzes', desc: 'Gemini AI categorizes, prioritizes, and extracts key themes', color: '#7c3aed' },
            { step: '3', title: 'Ranked Output', desc: 'Issues are ranked by urgency, volume, and recency', color: '#dc2626' },
            { step: '4', title: 'MP Action', desc: 'MPs review ranked priorities and take action', color: '#059669' },
          ].map((item) => (
            <div key={item.step} style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: item.color, color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                fontSize: '20px', fontWeight: 700,
              }}>{item.step}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1e293b', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>JanSevaAI</div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Built for Google Cloud Build with AI: Code for Communities</div>
        <Link to="/mp/login" style={{ fontSize: '13px', color: '#60a5fa', textDecoration: 'none' }}>MP Login →</Link>
      </div>
    </div>
  );
}
