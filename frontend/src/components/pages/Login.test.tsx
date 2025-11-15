import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';

// Mock the LoginForm component
vi.mock('../login-form', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

describe('Login Page', () => {
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('should render without crashing', () => {
    renderLogin();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should render the LoginForm component', () => {
    renderLogin();
    expect(screen.getByTestId('login-form')).toHaveTextContent('Login Form');
  });

  it('should have proper layout classes', () => {
    const { container } = renderLogin();
    const wrapper = container.querySelector('.flex.min-h-svh');
    expect(wrapper).toBeInTheDocument();
  });

  it('should center the login form', () => {
    const { container } = renderLogin();
    const wrapper = container.querySelector('.items-center.justify-center');
    expect(wrapper).toBeInTheDocument();
  });

  it('should constrain form width on larger screens', () => {
    const { container } = renderLogin();
    const formContainer = container.querySelector('.max-w-sm');
    expect(formContainer).toBeInTheDocument();
  });
});

