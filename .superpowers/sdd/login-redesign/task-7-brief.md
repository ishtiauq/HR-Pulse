### Task 7: Final build verification + polish

**Files:**
- Verify: `src/components/Login.jsx` (full file correctness)
- Verify: `src/App.jsx` (no leftover EmployeeLogin references)
- Verify: `node_modules\.bin\vite.cmd build 2>&1`

- [ ] **Step 1: Run production build**

```bash
node_modules\.bin\vite.cmd build 2>&1
```

Expected: builds successfully with no errors

- [ ] **Step 2: Check App.jsx for stale imports**

Run: `Select-String -Pattern "EmployeeLogin" src/App.jsx`
Expected: no matches (EmployeeLogin import and usage were removed)

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "login: final build verification and polish"
```
