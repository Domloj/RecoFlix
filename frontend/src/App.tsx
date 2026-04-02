import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
// import { HomePage } from './pages/home/HomePage';

function App() {
  return (
    // AuthProvider musi otaczać Routes, by cała aplikacja wiedziała o logowaniu
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Publiczne ścieżki - dostępne dla każdego */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Chroniona ścieżka - tylko dla zalogowanych (dowolna rola) */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Przykład na przyszłość - strona tylko dla admina */}
          {/* <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          /> */}

          {/* <Route 
            path="/reco" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          /> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;