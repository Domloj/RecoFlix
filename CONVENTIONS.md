# GIT and GitHub Conventions for the Recoflix Project

**IMPORTANT RULE:** All branch names, commit messages, Pull Request titles, and descriptions MUST be written in English.

## 1. Branch Naming
Always use the current developer's login as a prefix for the branch. 
**AI RULE:** Before creating a branch, execute the command `gh api user -q ".login"` in the terminal to fetch the user's GitHub login, and then use it in the branch name. (If `gh` fails, use `git config user.name` and replace spaces with hyphens).

Format: `<github-login>/<type>/<task-description>`
- New features: `login/feat/task-description` (e.g., `adpawel/feat/google-auth`)
- Bug fixes: `login/fix/bug-description` (e.g., `jsmith/fix/login-button-style`)
- Refactor / Chores: `login/chore/what-was-done` or `login/refactor/what-was-changed`

## 2. Commit Messages (Conventional Commits)
Format: `<type>(<module>): <short description in English>`
Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`
Examples:
- `feat(backend): add google login endpoint`
- `fix(frontend): fix movie tiles display`

## 3. Pull Requests (PR)
- The PR title must be clear and match the task type, e.g., `feat: Implement recommendation system`
- The PR description must contain the following sections:
  - **What was changed:** (short list)
  - **How to test:** (brief info)
- Use the GitHub CLI (`gh pr create`) to create a PR if the user asks for it.