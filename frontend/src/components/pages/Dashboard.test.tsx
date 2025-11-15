import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';

// Mock child components
vi.mock('../app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">App Sidebar</div>,
}));

vi.mock('../site-header', () => ({
  SiteHeader: () => <div data-testid="site-header">Site Header</div>,
}));

vi.mock('../chart-area-interactive', () => ({
  ChartAreaInteractive: () => <div data-testid="chart-area">Chart Area</div>,
}));

vi.mock('../section-cards', () => ({
  SectionCards: () => <div data-testid="section-cards">Section Cards</div>,
}));

// Mock Sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-inset">{children}</div>
  ),
}));

describe('Dashboard Page', () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('should render without crashing', () => {
    renderDashboard();
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
  });

  it('should render the AppSidebar component', () => {
    renderDashboard();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });

  it('should render the SiteHeader component', () => {
    renderDashboard();
    expect(screen.getByTestId('site-header')).toBeInTheDocument();
  });

  it('should render the SectionCards component', () => {
    renderDashboard();
    expect(screen.getByTestId('section-cards')).toBeInTheDocument();
  });

  it('should render the ChartAreaInteractive component', () => {
    renderDashboard();
    expect(screen.getByTestId('chart-area')).toBeInTheDocument();
  });

  it('should render SidebarInset', () => {
    renderDashboard();
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument();
  });

  it('should have all main components present', () => {
    renderDashboard();
    
    // Check all main components are rendered
    expect(screen.getByTestId('app-sidebar')).toHaveTextContent('App Sidebar');
    expect(screen.getByTestId('site-header')).toHaveTextContent('Site Header');
    expect(screen.getByTestId('section-cards')).toHaveTextContent('Section Cards');
    expect(screen.getByTestId('chart-area')).toHaveTextContent('Chart Area');
  });
});

