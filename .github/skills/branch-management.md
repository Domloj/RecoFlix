# Skill: Branch Creation

When the user asks you to create a branch, you must dynamically fetch their GitHub login to format the branch name correctly.

**Procedure:**
1. Instruct the user to run the following command to get their current GitHub login (or provide it in a runnable bash block):
   ```bash
   gh api user -q ".login"
   ```
2. Once you know the login (e.g., `adpawel`), format the branch name as: `<login>/<type>/<description>`. 
   - Types allowed: `feat`, `fix`, `chore`, `refactor`
3. Provide the user with the final branch creation command:
   ```bash
   git checkout -b <login>/<type>/<description>
   ```