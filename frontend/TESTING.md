# Frontend Testing Guide

## Overview

This project uses **Vitest** and **React Testing Library** for unit and integration testing.

## Stack

- **Vitest** - Fast unit test framework (Vite-native)
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **jsdom** - Browser environment simulation

## Setup

### Install Dependencies

```bash
npm install
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm test -- --watch
```

### Run tests with UI

```bash
npm run test:ui
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run specific test file

```bash
npm test -- Login.test.tsx
```

### Run tests matching a pattern

```bash
npm test -- --grep "Dashboard"
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Using Custom Test Utils

```typescript
import { renderWithRouter, userEvent } from '@/test/test-utils';
import { MyComponent } from './MyComponent';

it('should navigate on click', async () => {
  const user = userEvent.setup();
  renderWithRouter(<MyComponent />, { route: '/dashboard' });
  
  await user.click(screen.getByRole('button'));
  // assertions...
});
```

### Mocking Components

```typescript
vi.mock('../SomeComponent', () => ({
  SomeComponent: () => <div data-testid="some-component">Mocked</div>,
}));
```

### Mocking API Calls

```typescript
import { apiService } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiService: {
    getTicker: vi.fn(),
  },
}));

// In test
vi.mocked(apiService.getTicker).mockResolvedValue({ ticker: mockData });
```

### Testing Async Components

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Test Files Location

Tests are co-located with their components:

```
src/
  components/
    pages/
      Login.tsx
      Login.test.tsx       ← Test file
      Dashboard.tsx
      Dashboard.test.tsx   ← Test file
```

## Coverage

Coverage reports are generated in the `coverage/` directory.

View HTML coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

## Continuous Integration

Tests run automatically on:
- Pre-commit (if husky is configured)
- Pull requests
- CI/CD pipeline

## Best Practices

1. **Test user behavior, not implementation**
   - Use `screen.getByRole()` over `getByTestId()`
   - Test what users see and do

2. **Keep tests simple and focused**
   - One assertion per test when possible
   - Clear test names that describe behavior

3. **Mock external dependencies**
   - API calls
   - Third-party libraries
   - Complex child components

4. **Use Testing Library queries in order of priority**
   1. `getByRole`
   2. `getByLabelText`
   3. `getByPlaceholderText`
   4. `getByText`
   5. `getByTestId` (last resort)

5. **Clean up after tests**
   - Handled automatically by setup file
   - Mock cleanup happens in `beforeEach`/`afterEach`

## Common Patterns

### Testing Forms

```typescript
it('should submit form', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /login/i }));
  
  expect(mockLoginFn).toHaveBeenCalledWith({
    username: 'testuser',
    password: 'password123',
  });
});
```

### Testing Navigation

```typescript
it('should navigate to details page', async () => {
  const user = userEvent.setup();
  renderWithRouter(<TickerList />);
  
  await user.click(screen.getByText('AAPL'));
  
  expect(window.location.pathname).toBe('/ticker/AAPL');
});
```

### Testing Loading States

```typescript
it('should show loading spinner', () => {
  vi.mocked(apiService.getData).mockImplementation(
    () => new Promise(() => {}) // Never resolves
  );
  
  render(<DataComponent />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Tests timing out

Increase timeout in individual test:
```typescript
it('should load slowly', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mock not working

Ensure mock is before component import:
```typescript
vi.mock('./module'); // ← Must be at top level

import { Component } from './Component';
```

### Can't find element

Use `screen.debug()` to see current DOM:
```typescript
render(<Component />);
screen.debug(); // Prints current DOM
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

