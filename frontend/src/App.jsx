import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import CitizenForm from './components/CitizenForm'
import PriorityQueue from './components/PriorityQueue'
import HotspotMap from './components/HotspotMap'
import EvidenceView from './components/EvidenceView'
import MPLogin from './components/MPLogin'
import MPDashboard from './components/MPDashboard'

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isMPPage = location.pathname.startsWith('/mp');

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLanding && !isMPPage && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <img src="/logo.png" alt="JanSevaAI" className="h-9 w-auto object-contain" />
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link to="/submit" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Submit
                </Link>
                <Link to="/priorities" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Priorities
                </Link>
                <Link to="/map" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Map
                </Link>
                <Link to="/mp/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  MP Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={isLanding || isMPPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<CitizenForm />} />
          <Route path="/priorities" element={<PriorityQueue />} />
          <Route path="/map" element={<HotspotMap />} />
          <Route path="/evidence/:category" element={<EvidenceView />} />
          <Route path="/mp/login" element={<MPLogin />} />
          <Route path="/mp/dashboard" element={<MPDashboard />} />
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
