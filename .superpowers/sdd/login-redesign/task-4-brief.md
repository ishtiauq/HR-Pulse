### Task 4: Add Employee tab content

**Files:**
- Modify: `src/components/Login.jsx` (Employee tab section)

- [ ] **Step 1: Add Employee login form**

Inside the `<div style={{ display: authTab === 'employee' ? 'block' : 'none' }}>`, add:

```jsx
<form onSubmit={handleEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
  {error && (
    <div className="login-error">{error}</div>
  )}

  <div>
    <label className="login-label">Email Address</label>
    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
      placeholder="you@company.com" required className="login-input" />
  </div>

  <div>
    <label className="login-label">Password</label>
    <div style={{ position: 'relative' }}>
      <input type={showPassword ? 'text' : 'password'} value={password}
        onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
        required className="login-input" style={{ paddingRight: '44px' }} />
      <button type="button" onClick={() => setShowPassword(!showPassword)}
        className="login-eye-btn">
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>

  <button type="submit" disabled={isLoading} className="login-drive-btn" style={{ marginTop: '8px' }}>
    {isLoading ? 'Signing in...' : 'Sign In'}
    {!isLoading && <LogIn size={16} />}
  </button>

  <p className="login-trust-line" style={{ marginTop: 0 }}>
    <Users size={14} />
    Sign in with the credentials provided by your HR department.
  </p>
</form>
```

And add CSS:

```css
.login-label {
  display: block; margin-bottom: 6px;
  font: 500 13px var(--font-sans, 'Roboto', sans-serif);
  color: var(--md-bw-on-surface-variant, #666);
}
.login-input {
  width: 100%; padding: 12px 16px; border-radius: 10px; box-sizing: border-box;
  border: 1px solid var(--glass-border, rgba(255,255,255,0.55));
  background: var(--color-md-sys-surface, #fff);
  color: var(--md-bw-on-surface, #222);
  font: 400 14px var(--font-sans, 'Roboto', sans-serif); outline: none;
  transition: border-color 0.2s;
}
.login-input:focus { border-color: var(--color-accent, #e85d4a); }
.login-eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--md-bw-on-surface-variant, #888); padding: 4px; display: flex;
}
.login-error {
  padding: 12px 16px; border-radius: 8px;
  background: rgba(224, 32, 20, 0.08); border: 1px solid rgba(224, 32, 20, 0.2);
  color: #E02014; font-size: 0.88rem;
}
```

Also import `Users` at the top of Login.jsx (add to the lucide-react import line).

- [ ] **Step 2: Build and verify**

Run: `node_modules\.bin\vite.cmd build 2>&1`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/Login.jsx
git commit -m "login: add Employee tab with email/password form"
```

