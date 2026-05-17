# Generate React Code Procedure

Use this skill whenever you are asked to create a new React component, feature, or page. This playbook ensures the codebase maintains strict separation of concerns.

## Step-by-Step Instructions

1. **Step 1: Define Interfaces (`interfaces/`)**
   - Identify all data structures, API responses, and Component Props needed for the feature.
   - Create or update a `.ts` file inside the `interfaces/` directory.
   - *Example:* `interfaces/User.ts` containing `export interface User { ... }` and `export interface UserProfileProps { ... }`.

2. **Step 2: Implement Services (`services/`)**
   - Identify any API calls (fetch/axios) or complex business logic.
   - Create a `.ts` file inside the `services/` directory.
   - Import the necessary types from `interfaces/`.
   - *Example:* `services/userService.ts` containing the `fetchUser` async function.

3. **Step 3: Create the Stylesheet (`.css`)**
   - Create a standard `.css` file (or `.module.css` if the project uses CSS Modules) in the component's folder.
   - Use class names that clearly describe their purpose and follow the BEM (Block Element Modifier) standard, such as `.user-profile` for the main block, `.user-profile__header` for the header section, and `.user-profile--active` for the active state modifier.
   - *Rule:* NO CSS-in-JS. NO inline styles.

4. **Step 4: Create the React Component (`.tsx`)**
   - Import the types from `interfaces/`.
   - Import the logic from `services/`.
   - Import the stylesheet (e.g., `import './MyComponent.css'`).
   - Write a clean, functional component using modern React hooks (e.g., useState, useEffect, etc.).
   - Keep the component focused on UI rendering and state bridging; delegate heavy lifting to the service.

## Example Output Structure:
If asked to build a UserProfile, you must generate/edit:
1. `src/interfaces/User.ts`
2. `src/services/userService.ts`
3. `src/components/UserProfile/UserProfile.css`
4. `src/components/UserProfile/UserProfile.tsx`

## Prioritization & Summary

To reduce cognitive load, follow these rules in order of priority:

1. Critical (must follow):
   - Maintain separation of concerns: interfaces -> services -> components.
   - Create or update the required files for types, services, styles, and the component.
   - Do not use CSS-in-JS or inline styles; use plain `.css` or `.module.css`.

2. High (follow unless project-specific reasons):
   - Use TypeScript interfaces for all props and API responses and import them where needed.
   - Keep components focused on UI/state; delegate business logic and API calls to services.
   - Use modern React hooks (useState, useEffect) and functional components.

3. Recommended (nice-to-have):
   - Follow BEM naming for CSS classes (e.g., `.block`, `.block__element`, `.block--modifier`).
   - Place files under `src/interfaces/`, `src/services/`, and `src/components/<Component>/` as shown in examples.

Quick Checklist (most important items only):
- Create/update interface file
- Create/update service file with business/API logic
- Create component folder with `.tsx` and `.css`
- Component imports interfaces, services, and stylesheet
