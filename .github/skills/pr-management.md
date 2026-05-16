# Skill: Pull Request Creation

When the user asks to create a Pull Request:
1. Ensure all changes are committed according to the Conventional Commits format in English.
2. Provide the push command:
   ```bash
   git push -u origin HEAD
   ```
3. Provide the GitHub CLI command to create the PR, filling in the title and body automatically based on the commits:
   ```bash
   gh pr create --title "<type>: <clear english description>" --body "### What was changed:
   - <item 1>
   - <item 2>

   ### How to test:
   - <brief instructions>"
   ```
   