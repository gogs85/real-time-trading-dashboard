import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components/pages/Dashboard';
import { Login } from './components/pages/Login';
import { TickerDetail } from './components/pages/TickerDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner' />
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to='/login' replace />;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner' />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path='/login' element={isAuthenticated ? <Navigate to='/dashboard' replace /> : <Login />} />
      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path='/ticker/:symbol'
        element={
          <ProtectedRoute>
            <TickerDetail />
          </ProtectedRoute>
        }
      />
      <Route path='/' element={<Navigate to='/dashboard' replace />} />
      <Route path='*' element={<Navigate to='/dashboard' replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
