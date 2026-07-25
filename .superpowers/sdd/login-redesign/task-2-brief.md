### Task 2: Rewrite Login.jsx â€” Split-panel layout + Brand panel

**Files:**
- Modify: `src/components/Login.jsx` (complete rewrite)

**Interfaces:**
- Consumes: `onLogin` prop from App.jsx
- Produces: rendered split-panel layout with brand panel (left) and auth card placeholder (right)

- [ ] **Step 1: Write the new Login component shell**

Replace the entire `Login.jsx` with:

```jsx
import { useState } from 'react'
import { Activity, Shield, Cloud, Lock, ArrowRight, HelpCircle, ChevronDown, ChevronUp, LogIn, Eye, EyeOff } from 'lucide-react'
import { fetchUserProfile } from '../services/googleDrive.js'

export default function Login({ onLogin }) {
  const [authTab, setAuthTab] = useState('manager') // 'manager' | 'employee'
  const [isLoading, setIsLoading] = useState(false)
  const [showIntermediateModal, setShowIntermediateModal] = useState(false)
  const [showAccordion, setShowAccordion] = useState(false)

  // --- Employee state ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // --- Existing OAuth logic (preserved verbatim) ---
  const triggerOAuth = () => {
    setIsLoading(true)
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      console.warn("Google Client Library not detected. Falling back to simulated login.");
      setTimeout(() => {
        setIsLoading(false)
        const simulatedUser = {
          name: 'Ishtiauq Ahmed (Simulated)',
          email: 'ishtiauq@gmail.com',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          role: 'HR Manager',
          isSimulated: true,
          token: 'mock-token-12345'
        }
        onLogin(simulatedUser)
      }, 1200)
      return
    }
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.appdata email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const profile = await fetchUserProfile(tokenResponse.access_token)
              const googleUser = {
                name: profile.name,
                email: profile.email,
                avatar: profile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                role: 'HR Manager',
                token: tokenResponse.access_token
              }
              setIsLoading(false)
              onLogin(googleUser)
            } catch (err) {
              setIsLoading(false)
              alert("Failed to fetch Google profile details: " + err.message)
            }
          } else {
            setIsLoading(false)
          }
        },
        error_callback: (err) => {
          setIsLoading(false)
          alert("Authorization error: " + err.message)
        }
      })
      client.requestAccessToken({ prompt: 'consent' })
    } catch (e) {
      setIsLoading(false)
      alert("Error initializing Google Login client: " + e.message)
    }
  }

  const handleConnectClick = () => {
    const shown = localStorage.getItem('hr_pulse_auth_modal_shown')
    if (shown === 'true') {
      triggerOAuth()
    } else {
      setShowIntermediateModal(true)
    }
  }

  const handleConfirmAuthorize = () => {
    localStorage.setItem('hr_pulse_auth_modal_shown', 'true')
    setShowIntermediateModal(false)
    triggerOAuth()
  }

  // --- Employee login logic (moved from EmployeeLogin.jsx) ---
  const handleEmployeeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const storedEmployees = localStorage.getItem('hr_pulse_employees_plain')
      if (!storedEmployees) {
        setError('No employee data found. Please contact your HR department.')
        setIsLoading(false)
        return
      }
      const employees = JSON.parse(storedEmployees)
      const employee = employees.find(e => e.email === email && e.password === password)
      if (!employee) {
        setError('Invalid email or password.')
        setIsLoading(false)
        return
      }
      const hrToken = localStorage.getItem('hr_pulse_hr_token')
      const employeeUser = {
        name: employee.name,
        email: employee.email,
        role: employee.role || 'Employee',
        department: employee.department,
        avatar: employee.avatar || '',
        isEmployee: true,
        employeeId: employee.id,
        token: hrToken || ''
      }
      onLogin(employeeUser)
    } catch (err) {
      setError('Login failed: ' + err.message)
      setIsLoading(false)
    }
  }

  // --- Render ---
  return (
    <div className="login-split">
      {/* Brand Panel */}
      <div className="login-brand">
        <div className="login-brand-header">
          <div className="login-logo-box">
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <span className="login-brand-title">HR Pulse</span>
            <span className="login-brand-tagline">DRIVE-BASED HRM</span>
          </div>
        </div>
        <div className="login-brand-center">
          <h1 className="login-hero">Your HR Data,<br />Your Drive</h1>
          <p className="login-hero-sub">Private, offline-first HR management â€” powered by your Google Drive.</p>
        </div>
        <div className="login-brand-graphic">
          <div className="brand-shape brand-shape-1" />
          <div className="brand-shape brand-shape-2" />
          <div className="brand-shape brand-shape-3" />
        </div>
      </div>

      {/* Auth Panel */}
      <div className="login-auth">
        <div className="login-auth-card">
          {/* Tabs */}
          <div className="login-tabs">
            <button className={`login-tab ${authTab === 'manager' ? 'active' : ''}`} onClick={() => setAuthTab('manager')}>HR Manager</button>
            <button className={`login-tab ${authTab === 'employee' ? 'active' : ''}`} onClick={() => setAuthTab('employee')}>Employee</button>
          </div>

          {/* Tab content rendered eagerly â€” conditionally visible */}
          <div style={{ display: authTab === 'manager' ? 'block' : 'none' }}>
            {/* HR Manager content will be added in Task 3 */}
          </div>
          <div style={{ display: authTab === 'employee' ? 'block' : 'none' }}>
            {/* Employee content will be added in Task 4 */}
          </div>
        </div>
      </div>

      <style>{`
        .login-split {
          display: flex; height: 100vh; width: 100%; font-family: var(--font-sans, 'Roboto', sans-serif);
          background: var(--bg-primary);
        }
        .login-brand {
          flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
          padding: 48px; position: relative; overflow: hidden;
          background: linear-gradient(-45deg, #0f0f1a, #1a1a2e, #16213e, #0f3460);
        }
        .login-brand-header {
          position: absolute; top: 32px; left: 48px; display: flex; align-items: center; gap: 10px; z-index: 2;
        }
        .login-logo-box {
          width: 40px; height: 40px; background: var(--accent-primary, #e85d4a);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(232, 93, 74, 0.35);
        }
        .login-brand-title {
          font-size: 1.15rem; font-weight: 800; color: #fff; display: block; line-height: 1.1;
        }
        .login-brand-tagline {
          font-size: 0.6rem; font-weight: 700; color: var(--accent-primary, #e85d4a);
          letter-spacing: 0.1em; display: block;
        }
        .login-brand-center {
          text-align: center; z-index: 2; position: relative;
        }
        .login-hero {
          font-size: 2.8rem; font-weight: 800; color: #fff; line-height: 1.15;
          letter-spacing: -0.02em; margin: 0 0 16px;
          font-family: var(--font-display, 'Roboto', sans-serif);
        }
        .login-hero-sub {
          font-size: 1rem; color: rgba(255,255,255,0.6); margin: 0; max-width: 320px; line-height: 1.5;
        }
        .login-brand-graphic {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
        }
        .brand-shape {
          position: absolute; border-radius: 50%; opacity: 0.07;
        }
        .brand-shape-1 {
          width: 400px; height: 400px; background: #4a9eff; top: -100px; right: -100px;
        }
        .brand-shape-2 {
          width: 300px; height: 300px; background: #7c3aed; bottom: -80px; left: -80px;
        }
        .brand-shape-3 {
          width: 200px; height: 200px; background: #06b6d4; top: 50%; left: 50%; transform: translate(-50%, -50%);
        }

        .login-auth {
          flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px;
          background: var(--bg-primary, #f5f5f7); position: relative;
        }
        .login-auth-card {
          width: 100%; max-width: 420px;
          background: var(--glass-bg, rgba(255,255,255,0.45));
          backdrop-filter: var(--glass-blur, blur(24px) saturate(180%));
          -webkit-backdrop-filter: var(--glass-blur, blur(24px) saturate(180%));
          border: 1px solid var(--glass-border, rgba(255,255,255,0.55));
          border-radius: 20px; padding: 32px;
          box-shadow: var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.04));
        }
        .login-tabs {
          display: flex; background: var(--glass-bg, rgba(0,0,0,0.04)); border-radius: 12px; padding: 4px; margin-bottom: 28px;
        }
        .login-tab {
          flex: 1; padding: 10px 16px; border: none; border-radius: 10px; cursor: pointer;
          font: 600 14px var(--font-sans, 'Roboto', sans-serif); transition: all 0.2s;
          background: transparent; color: var(--md-bw-on-surface-variant, #666);
        }
        .login-tab.active {
          background: var(--color-accent, #e85d4a); color: #fff;
          box-shadow: 0 2px 8px rgba(232, 93, 74, 0.3);
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Build and verify**

Run: `node_modules\.bin\vite.cmd build 2>&1`
Expected: build succeeds (may see chunk size warning, that's OK)

- [ ] **Step 3: Commit**

```bash
git add src/components/Login.jsx
git commit -m "login: split-panel layout with brand panel and auth card shell"
```

