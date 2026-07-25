### Task 1: Update App.jsx â€” Remove EmployeeLogin routing

**Files:**
- Modify: `src/App.jsx:136, 1429-1433`

**Interfaces:**
- Consumes: none
- Produces: Login now receives only `onLogin` prop (no `onEmployeeLogin`)

- [ ] **Step 1: Remove `showEmployeeLogin` state**

```jsx
// Remove line 136:
// const [showEmployeeLogin, setShowEmployeeLogin] = useState(false)
```

- [ ] **Step 2: Replace the login rendering block**

Replace:
```jsx
  if (!user) {
    if (showEmployeeLogin) {
      return <EmployeeLogin onLogin={handleLogin} onBack={() => setShowEmployeeLogin(false)} />
    }
    return <Login onLogin={handleLogin} onEmployeeLogin={() => setShowEmployeeLogin(true)} />
  }
```

With:
```jsx
  if (!user) {
    return <Login onLogin={handleLogin} />
  }
```

- [ ] **Step 3: Build and verify**

Run: `node_modules\.bin\vite.cmd build 2>&1`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "login: remove EmployeeLogin routing, Login handles both auth paths"
```

