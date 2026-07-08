import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import CitizenForm from './components/CitizenForm'
import PriorityQueue from './components/PriorityQueue'
import HotspotMap from './components/HotspotMap'
import EvidenceView from './components/EvidenceView'
import Dashboard from './components/Dashboard'

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLanding && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JS</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">JanSevaAI</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link to="/submit" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Submit
                </Link>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/priorities" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Priorities
                </Link>
                <Link to="/map" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Map
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={isLanding ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<CitizenForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/priorities" element={<PriorityQueue />} />
          <Route path="/map" element={<HotspotMap />} />
          <Route path="/evidence/:category" element={<EvidenceView />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
