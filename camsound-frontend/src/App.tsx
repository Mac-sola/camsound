import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';

// ── Lazy-Loaded Page Components (Code-Splitting) ──────────────────────────────
// Instead of downloading all pages at once on initial visit, each page bundle
// is downloaded on-demand only when the user navigates to its URL.
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Browse = lazy(() => import('./pages/Browse'));
const ArtistPage = lazy(() => import('./pages/ArtistPage'));
const FanDashboard = lazy(() => import('./pages/FanDashboard'));
const ArtistDashboard = lazy(() => import('./pages/ArtistDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Subscription = lazy(() => import('./pages/Subscription'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SettingsProvider>
          <AudioProvider>
            <Router>
              <Suspense fallback={<PageLoader message="Loading CamSound..." />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/artists/:id" element={<ArtistPage />} />
                  
                  {/* Legal compliance routes */}
                  <Route path="/terms" element={<LegalPage type="terms" />} />
                  <Route path="/privacy" element={<LegalPage type="privacy" />} />
                  <Route path="/cookies" element={<LegalPage type="cookies" />} />
                  
                  {/* Canonical redirects */}
                  <Route path="/dashboard" element={<Navigate to="/fan" replace />} />
                  
                  {/* Protected Role-Based Routes */}
                  <Route 
                    path="/fan" 
                    element={
                      <ProtectedRoute requiredRole="fan">
                        <FanDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/artist" 
                    element={
                      <ProtectedRoute requiredRole="artist">
                        <ArtistDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/subscription" 
                    element={
                      <ProtectedRoute>
                        <Subscription />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </Suspense>
            </Router>
          </AudioProvider>
        </SettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
