### Task 5: Add trust modal

**Files:**
- Modify: `src/components/Login.jsx` (add modal before closing `</div>` of the component)

- [ ] **Step 1: Add trust modal JSX**

After the login-auth-card div and before `</div>` of login-auth, or at the root level of the returned JSX (before closing `</div>` of login-split), add:

```jsx
{showIntermediateModal && (
  <div className="login-modal-overlay">
    <div className="login-modal">
      <h2 className="login-modal-title">Just one thing before we connect...</h2>
      <p className="login-modal-desc">HR Pulse needs permission to create a private app folder in your Google Drive.</p>

      <div className="login-modal-illustration">
        <Cloud size={38} style={{ color: 'var(--accent-primary, #e85d4a)' }} />
      </div>

      <ul className="login-modal-perms">
        <li><span className="perm-check">âœ…</span> Create and manage files in a hidden app folder</li>
        <li><span className="perm-cross">âŒ</span> We do NOT access your photos, documents, or spreadsheets</li>
        <li><span className="perm-cross">âŒ</span> We do NOT share your data with third parties</li>
      </ul>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleConfirmAuthorize} className="login-drive-btn" style={{ justifyContent: 'center' }}>
          Authorize Google Drive <ArrowRight size={16} />
        </button>
        <button onClick={() => setShowAccordion(prev => !prev)} className="login-learn-btn">
          <HelpCircle size={16} /> Learn More {showAccordion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAccordion && (
        <div className="login-modal-accordion">
          <h4>What is drive.appdata scope?</h4>
          <p>It is a private, isolated storage area inside your Google Drive account designed only for specific apps. Files stored here are completely hidden from your main Drive directory and other applications. This ensures that only HR Pulse can read and modify the files, keeping your payroll and directories strictly private.</p>
        </div>
      )}

      <div className="login-modal-footer">You can disconnect anytime from Settings â†’ Google Drive Sync.</div>
    </div>
  </div>
)}
```

And add CSS:

```css
.login-modal-overlay {
  position: fixed; inset: 0; z-index: 10005;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: loginOverlayFadeIn 0.3s ease-out forwards;
}
.login-modal {
  max-width: 480px; width: 90%; padding: 32px; border-radius: 20px;
  background: var(--color-md-sys-surface, #fff);
  border: 1px solid var(--glass-border, rgba(255,255,255,0.55));
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  animation: loginModalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  display: flex; flex-direction: column; gap: 20px;
}
.login-modal-title {
  font-size: 1.4rem; font-weight: 800; color: var(--md-bw-on-surface, #222); margin: 0;
}
.login-modal-desc {
  font-size: 0.92rem; color: var(--md-bw-on-surface-variant, #666); margin: 0; line-height: 1.5;
}
.login-modal-illustration {
  display: flex; justify-content: center; align-items: center;
  padding: 24px; background: var(--bg-primary, #f5f5f7);
  border-radius: 12px; border: 1px solid var(--glass-border, rgba(255,255,255,0.55));
}
.login-modal-perms {
  list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;
}
.login-modal-perms li {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 0.88rem; color: var(--md-bw-on-surface-variant, #666); line-height: 1.4;
}
.perm-check { font-size: 1rem; }
.perm-cross { font-size: 1rem; }
.login-learn-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 12px; border-radius: 12px; cursor: pointer;
  background: transparent; border: 1px solid var(--glass-border, rgba(255,255,255,0.55));
  color: var(--md-bw-on-surface-variant, #666);
  font: 600 0.9rem var(--font-sans, 'Roboto', sans-serif); transition: background 0.2s;
}
.login-learn-btn:hover { background: var(--glass-bg, rgba(0,0,0,0.03)); }
.login-modal-accordion {
  padding: 16px; background: var(--bg-primary, #f5f5f7);
  border: 1px solid var(--glass-border, rgba(255,255,255,0.55)); border-radius: 12px;
  animation: loginExpandDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.login-modal-accordion h4 { margin: 0 0 6px; font-size: 0.85rem; font-weight: 700; color: var(--md-bw-on-surface, #222); }
.login-modal-accordion p { margin: 0; font-size: 0.8rem; color: var(--md-bw-on-surface-variant, #666); line-height: 1.45; }
.login-modal-footer {
  font-size: 0.72rem; color: var(--md-bw-on-surface-variant, #999); text-align: center;
  border-top: 1px solid var(--glass-border, rgba(255,255,255,0.55)); padding-top: 16px;
}

@keyframes loginOverlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes loginModalSlideIn { from { opacity: 0; transform: scale(0.95) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes loginExpandDown { from { opacity: 0; transform: translateY(-8px); max-height: 0; overflow: hidden; } to { opacity: 1; transform: translateY(0); max-height: 200px; } }
```

- [ ] **Step 2: Build and verify**

Run: `node_modules\.bin\vite.cmd build 2>&1`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/Login.jsx
git commit -m "login: add trust modal for Google Drive authorization"
```

