# GIT and GitHub Conventions for Recoflix

**IMPORTANT RULE:** All branch names, commit messages, and PR descriptions MUST be written in English.

## 1. Branch Naming
Always use the current developer's GitHub login as a prefix for the branch. 
Format: `<github-login>/<type>/<task-description>`

- New features: `login/feat/task-description` (e.g., `adpawel/feat/google-auth`)
- Bug fixes: `login/fix/bug-description` (e.g., `adpawel/fix/login-button-style`)

## 2. Commit Messages (Conventional Commits)
Format: `<type>(<module>): <short description in English>`
Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`
Example: `feat(backend): add google login endpoint`

## 3. Pull Requests (PR)
When the user asks you to create a Pull Request:
1. Push the current branch to origin: `git push -u origin <branch-name>`
2. Create the PR using GitHub CLI: `gh pr create --title "<title>" --body "What was changed: ..."`