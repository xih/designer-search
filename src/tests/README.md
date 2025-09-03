# Test Organization

This directory contains all test files organized by type and functionality.

## Folder Structure

```
tests/
├── unit/          # Unit tests for individual functions/methods
├── integration/   # Integration tests that test multiple components together
├── components/    # React component tests
├── lib/          # Library and utility function tests
├── utils/        # General utility tests
└── README.md     # This file
```

## Test Types

### Unit Tests (`unit/`)
- Test individual functions in isolation
- Fast execution
- Mock external dependencies
- Example: Testing a single utility function

### Integration Tests (`integration/`)
- Test multiple components working together
- May involve real API calls or database interactions
- Test user workflows and feature interactions
- Example: Testing a complete user registration flow

### Component Tests (`components/`)
- Test React components in isolation
- Test component rendering, props, and user interactions
- Use React Testing Library
- Example: Testing a Button component's onClick behavior

### Library Tests (`lib/`)
- Test core library functions and classes
- Business logic and algorithms
- Example: Testing authentication helpers, API clients

### Utility Tests (`utils/`)
- Test general utility functions
- Helper functions, formatters, validators
- Example: Testing date formatters, string utilities

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:components
pnpm test:lib

# Run specific test file
pnpm test textProcessor

# Run tests with UI
pnpm test:ui
```

## Test Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: Descriptive `describe()` blocks
- Test cases: Clear, descriptive `it()` statements that read like sentences

Example:
```typescript
describe('textProcessor', () => {
  describe('textCleaner', () => {
    it('should remove punctuation and normalize whitespace', () => {
      // test implementation
    });
  });
});
```

## Best Practices

1. **Arrange, Act, Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive test names**: Tests should read like documentation
4. **Mock external dependencies**: Keep unit tests isolated
5. **Test both happy path and edge cases**
6. **Clean up after tests**: Restore mocks, clear timers, etc.