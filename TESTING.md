# Testing Guide

This project uses **Vitest** for testing with an organized folder structure for different types of tests.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

## Test Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `pnpm test` | Run all tests once | CI/CD, quick check |
| `pnpm test:watch` | Run tests in watch mode | Development |
| `pnpm test:ui` | Run tests with Vitest UI | Interactive testing |
| `pnpm test:coverage` | Run tests with coverage | Quality assurance |
| `pnpm test:all` | Run all tests with verbose output | Detailed results |
| `pnpm test:silent` | Run tests with minimal output | Clean CI logs |

## Test by Category

| Script | Description | Example |
|--------|-------------|---------|
| `pnpm test:unit` | Unit tests only | `pnpm test:unit` |
| `pnpm test:integration` | Integration tests only | `pnpm test:integration` |
| `pnpm test:components` | Component tests only | `pnpm test:components` |
| `pnpm test:lib` | Library tests only | `pnpm test:lib` |
| `pnpm test:utils` | Utility tests only | `pnpm test:utils` |

## Test by Specific File

```bash
# Run specific test file
pnpm test textProcessor

# Run specific test file with watch mode
pnpm test:watch textProcessor

# Run test file with pattern matching
pnpm test "text*"
```

## Folder Structure

```
src/tests/
├── unit/              # Unit tests - individual functions
├── integration/       # Integration tests - multiple components
├── components/        # React component tests
├── lib/              # Core library tests
├── utils/            # Utility function tests
├── helpers/          # Test helper utilities
└── setup.ts          # Test setup configuration
```

## Test Organization Examples

### Unit Tests (`src/tests/unit/`)
```typescript
// src/tests/unit/math-utils.test.ts
describe('mathUtils', () => {
  describe('add', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
    });
  });
});
```

### Component Tests (`src/tests/components/`)
```typescript
// src/tests/components/Button.test.tsx
describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### Integration Tests (`src/tests/integration/`)
```typescript
// src/tests/integration/user-flow.test.ts
describe('User Registration Flow', () => {
  it('should complete full registration process', async () => {
    // Test multiple components working together
  });
});
```

### Library Tests (`src/tests/lib/`)
```typescript
// src/tests/lib/api-client.test.ts
describe('API Client', () => {
  it('should handle API responses correctly', () => {
    // Test core business logic
  });
});
```

## Writing Tests

### Test Structure
Use the **Arrange, Act, Assert** pattern:

```typescript
it('should format user name correctly', () => {
  // Arrange
  const user = { firstName: 'John', lastName: 'Doe' };
  
  // Act
  const result = formatUserName(user);
  
  // Assert
  expect(result).toBe('John Doe');
});
```

### Test Helpers
Use the provided test utilities:

```typescript
import { render, createMockUser, mockNavigator } from '~/tests/helpers/test-utils';

it('should render user profile', () => {
  const user = createMockUser({ name: 'Test User' });
  render(<UserProfile user={user} />);
  expect(screen.getByText('Test User')).toBeInTheDocument();
});
```

### Mocking
Mock external dependencies:

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('~/lib/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test' })
}));

// Mock browser APIs
mockNavigator({ userAgent: 'Test Browser' });
```

## Coverage Reports

Generate coverage reports to ensure code quality:

```bash
# Generate coverage report
pnpm test:coverage

# Coverage files are generated in:
# - coverage/index.html (HTML report)
# - coverage/coverage.json (JSON data)
```

## Best Practices

1. **Organize by purpose**: Put tests in the appropriate category folder
2. **Descriptive names**: Test names should clearly describe what is being tested
3. **One assertion per test**: Keep tests focused and specific
4. **Mock external dependencies**: Isolate the code under test
5. **Test both success and error cases**: Cover happy path and edge cases
6. **Use test helpers**: Leverage shared utilities for common setup
7. **Keep tests fast**: Unit tests should run quickly
8. **Regular testing**: Run tests frequently during development

## Continuous Integration

Add this to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    pnpm install
    pnpm test:coverage
    pnpm lint
    pnpm typecheck
```

## Troubleshooting

### Common Issues

1. **Tests not found**: Check file naming (`*.test.ts` or `*.test.tsx`)
2. **Import errors**: Ensure paths are correct and dependencies are installed
3. **Async test failures**: Use `await` with async operations
4. **Mock not working**: Verify mock setup is in correct location

### Debug Tests

```bash
# Run with debug output
pnpm test --reporter=verbose

# Run single test file with debug
pnpm test:watch specific-test.test.ts
```

## Examples in Codebase

- **textProcessor tests**: `src/tests/lib/textProcessor.test.ts`
  - iOS detection logic
  - Phonemizer fallback behavior
  - Text cleaning functionality
  
- **Component tests**: `src/tests/components/example-component.test.tsx`
  - React component rendering
  - Props handling
  - User interactions

- **Unit tests**: `src/tests/unit/example-unit.test.ts`
  - Pure function testing
  - Edge case handling
  - Error conditions