// Additional test setup that's specific to our organized test structure
// This can be imported by vitest.config.ts if needed

import { beforeEach, afterEach, vi } from 'vitest';

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Custom matchers can be added here
// expect.extend({
//   // custom matcher implementations
// });