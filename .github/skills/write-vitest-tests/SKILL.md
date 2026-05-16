# Write Vitest Tests Procedure

Use this skill for writing tests for React components or services. The project uses `vitest`, `@testing-library/react`, and `@testing-library/jest-dom/vitest`.

## Prioritization Hierarchy & Overview
Explicitly label and organize the output into the following sections: imports/setup, mocking, component testing, and structure. When generating tests, balance constraints using this strict priority order:
1. **Structure:** Strict adherence to the AAA (Arrange, Act, Assert) pattern.
2. **Accessibility:** Queries must be accessibility-first (e.g., `getByRole`).
3. **Resilience:** Comprehensive edge case and async error testing.
4. **Modularity:** Keep test setups reusable and clean.

## Setup & Imports
- Import commonly used utilities: `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` from `vitest`.
- Import `render`, `screen` from `@testing-library/react` and `userEvent` from `@testing-library/user-event`.
- Import `@testing-library/jest-dom/vitest` for DOM matchers.
- **Import Validation:** Ensure all imports (components, types, services) are correctly resolved. If a specific type or path is missing from your context, provide a fallback (e.g., `// TODO: update import path`) rather than generating incorrect or non-existent paths.

## Mocking Services
- Never make real API calls in tests.
- Mock services under `services/` with `vi.mock()` (e.g., `vi.mock('../../services/userService')`).
- Reset mocks in `beforeEach` with `vi.clearAllMocks()`.

## Component Testing Best Practices (Step-by-Step)

1. **Prepare Props and Types**
   - Render components with required props. Always import strict types from `interfaces/` when defining mock data.

2. **Prefer Accessible Queries**
   - Use `getByRole`, `findByRole`, `getByLabelText` instead of fragile selectors or `testId`s.

3. **Async UI & Error Handling**
   - For successful async UI, use `findBy...` and `waitFor`.
   - **Handling Async Errors:** When testing rejected promises, use `vi.mocked(service).mockRejectedValue(new Error('...'))` and explicitly verify that the error message or fallback UI is rendered correctly to the user.

4. **User Interactions**
   - Use `userEvent.setup()` for interactions (clicks, typing) rather than `fireEvent`.

5. **Edge Cases**
   - Test the following edge cases: null values, empty arrays, unexpected data types, missing optional props, and error boundaries. If additional edge cases are relevant, include them explicitly.

6. **Providers & Wrappers**
   - Wrap components with required providers (Theme, Router, custom contexts) using small test wrappers or helper render functions.

## Structure (AAA Pattern)
Follow these minimal steps inside every `it` block:

1. **Arrange:** Set up props, mock resolved/rejected values, and render the component.
2. **Act:** Perform user interactions or trigger effects.
3. **Assert:** Verify expected UI states, service calls, and side effects.

## Example Code Pattern
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

import { UserProfile } from './UserProfile';
import { User } from '../../interfaces/User';
import { fetchUser } from '../../services/userService';
vi.mock('../../services/userService');

describe('UserProfile Component', () => {
   const mockUser: User = { id: 1, name: 'John Doe' };

   beforeEach(() => {
      vi.clearAllMocks();
   });

   // Priority 1 & 2: AAA Pattern and Accessible Queries
   it('renders loading then user data on successful fetch', async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(fetchUser).mockResolvedValue(mockUser);

      // Act
      render(<UserProfile userId="{1}"/>);

      // Assert (Loading State)
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Assert (Resolved State)
      const heading = await screen.findByRole('heading', { name: /john doe/i });
      expect(heading).toBeInTheDocument();
   });

   // Priority 3: Async Error Handling and Edge Cases
   it('displays an error message when the API call fails', async () => {
      // Arrange
      vi.mocked(fetchUser).mockRejectedValue(new Error('Network Error'));

      // Act
      render(<UserProfile userId="{1}"/>);

      // Assert
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent(/failed to load user/i);
   });
});
```