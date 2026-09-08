import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FanDashboard from './pages/FanDashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';
import Browse from './pages/Browse';

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse" element={<Browse />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
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
            <Route path="/fan" element={<ProtectedRoute requiredRole="fan"><FanDashboard /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
