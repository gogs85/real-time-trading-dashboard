import './App.css';
import { Dashboard } from './components/pages/Dashboard';

import { Login } from './components/pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';
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

  return isAuthenticated ? <Dashboard /> : <Login />;
};
const App: React.FC = () => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </AuthProvider>
  );
};

export default App;
