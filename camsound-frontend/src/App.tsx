import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FanDashboard from './pages/FanDashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';
import Browse from './pages/Browse';
import ArtistPage from './pages/ArtistPage';
import LegalPage from './pages/LegalPage';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SettingsProvider>
          <AudioProvider>
            <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/artists/:id" element={<ArtistPage />} />
            {/* Legal stub pages */}
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/cookies" element={<LegalPage type="cookies" />} />
            {/* /dashboard redirects to canonical /fan URL */}
            <Route path="/dashboard" element={<Navigate to="/fan" replace />} />
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
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AudioProvider>
      </SettingsProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
