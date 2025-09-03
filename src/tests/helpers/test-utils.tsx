import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

// Custom render function that includes common providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* Add your app providers here, e.g.:
      <ThemeProvider>
        <QueryClient>
          {children}
        </QueryClient>
      </ThemeProvider>
      */}
      {children}
    </>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Common test utilities
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

export const createMockProfile = (overrides = {}) => ({
  id: '1',
  name: 'Test Profile',
  role: 'Developer',
  company: 'Test Company',
  ...overrides,
});

// Mock implementations for common dependencies
export const mockNavigator = (overrides: Partial<Navigator> = {}) => {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
      platform: 'Win32',
      vendor: 'Google Inc.',
      language: 'en-US',
      ...overrides,
    },
    writable: true,
    configurable: true,
  });
};

export const mockWindow = (overrides: Partial<Window> = {}) => {
  Object.defineProperty(global, 'window', {
    value: {
      screen: { width: 1920, height: 1080 },
      devicePixelRatio: 1,
      location: { href: 'https://localhost:3000' },
      ...overrides,
    },
    writable: true,
    configurable: true,
  });
};