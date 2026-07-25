### Task 3: Add HR Manager tab content

**Files:**
- Modify: `src/components/Login.jsx` (HR Manager tab section inside the `display: block` div)

- [ ] **Step 1: Add HR Manager content block**

Inside the `<div style={{ display: authTab === 'manager' ? 'block' : 'none' }}>`, add:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
  <button onClick={handleConnectClick} className="login-drive-btn" disabled={isLoading}>
    {isLoading ? (
      <span>Connecting Drive...</span>
    ) : (
      <>
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.5-.143 2.5-.97 3.514v2.923h6.39c3.74-3.437 5.725-8.508 5.725-14.294z"/><path fill="currentColor" d="M12 24c3.24 0 5.97-1.08 7.96-2.92l-6.39-2.923c-1.78 1.19-4.06 1.9-6.57 1.9-5.053 0-9.336-3.415-10.865-8.01H1.61v3.023C3.606 20.015 7.55 24 12 24z"/><path fill="currentColor" d="M1.135 12.077a14.364 14.364 0 0 1 0-4.154V4.9H1.61A23.953 23.953 0 0 0 0 12c0 2.502.39 4.903 1.135 7.177l6.388-3.023c-.382-1.144-.388-2.933 0-4.077z"/><path fill="currentColor" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.23 0 12 0 7.55 0 3.606 3.985 1.61 7.9H8.025C9.554 3.305 13.837 4.75 12 4.75z"/></svg>
        <span style={{ fontWeight: 600 }}>Connect Google Drive</span>
      </>
    )}
  </button>

  <p className="login-trust-line">
    <Shield size={14} />
    We only create a private <strong>HR-Pulse-DB</strong> folder in your Drive. We never access your personal files.
  </p>
</div>
```

And add the associated CSS inside the `<style>` tag:

```css
.login-drive-btn {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  width: 100%; padding: 16px; border: none; border-radius: 14px;
  background: var(--color-accent, #e85d4a); color: #fff;
  font: 600 1rem var(--font-sans, 'Roboto', sans-serif); cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 4px 12px var(--color-accent-glow, rgba(232,93,74,0.25));
}
.login-drive-btn:hover { transform: translateY(-1px); background: var(--color-accent-hover, #d04a3a); }
.login-drive-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.login-trust-line {
  display: flex; align-items: center; gap: 8px; justify-content: center;
  font-size: 0.78rem; color: var(--md-bw-on-surface-variant, #888); margin: 0; text-align: center;
  line-height: 1.4;
}
.login-trust-line strong { color: var(--md-bw-on-surface, #222); }
```

- [ ] **Step 2: Build and verify**

Run: `node_modules\.bin\vite.cmd build 2>&1`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/Login.jsx
git commit -m "login: add HR Manager tab with Google Drive connect button"
```

