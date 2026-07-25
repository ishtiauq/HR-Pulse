### Task 6: Auth card footer + mobile breakpoints

**Files:**
- Modify: `src/components/Login.jsx`

- [ ] **Step 1: Add auth card footer with expandable accordion**

Inside the `.login-auth-card` div, after the closing `</div>` of the last tab content div, add:

```jsx
<div className="login-card-footer">
  <button className="login-footer-learn" onClick={() => setShowAccordion(prev => !prev)}>
    <HelpCircle size={14} />
    What is HR Pulse?
    {showAccordion ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
  </button>

  {showAccordion && (
    <div className="login-footer-accordion">
      HR Pulse is a private, offline-first HR management system. Your employee data, payroll, and attendance records are stored exclusively in a hidden folder inside <strong>your own Google Drive</strong> â€” we have zero access to your data.
    </div>
  )}

  <p className="login-footer-free">Free forever. No credit card required.</p>
</div>
```

And add CSS:

```css
.login-card-footer {
  margin-top: 28px; padding-top: 20px;
  border-top: 1px solid var(--glass-border, rgba(255,255,255,0.55));
  display: flex; flex-direction: column; gap: 12px; align-items: center;
}
.login-footer-learn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font: 500 0.82rem var(--font-sans, 'Roboto', sans-serif);
  color: var(--md-bw-on-surface-variant, #888); padding: 4px 8px;
  transition: color 0.2s;
}
.login-footer-learn:hover { color: var(--md-bw-on-surface, #222); }
.login-footer-accordion {
  padding: 14px 16px; background: var(--glass-bg, rgba(0,0,0,0.02));
  border: 1px solid var(--glass-border, rgba(255,255,255,0.55)); border-radius: 12px;
  font-size: 0.8rem; color: var(--md-bw-on-surface-variant, #666); line-height: 1.5;
  text-align: center;
  animation: loginExpandDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.login-footer-free {
  margin: 0; font-size: 0.75rem; color: var(--md-bw-on-surface-variant, #999);
  text-align: center;
}
```

- [ ] **Step 2: Add mobile breakpoint CSS**

Before the closing `</style>` tag, add:

```css
@media (max-width: 768px) {
  .login-split { flex-direction: column; }
  .login-brand { padding: 20px; min-height: auto; justify-content: flex-start; }
  .login-brand-header { position: static; margin-bottom: 16px; }
  .login-brand-center { display: none; }
  .login-brand-graphic { display: none; }
  .login-auth { padding: 24px; align-items: flex-start; }
  .login-auth-card { padding: 24px; }
}
```

- [ ] **Step 3: Build and verify**

Run: `node_modules\.bin\vite.cmd build 2>&1`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/Login.jsx
git commit -m "login: add auth card footer, expandable accordion, mobile breakpoints"
```

