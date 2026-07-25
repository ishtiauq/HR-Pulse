import { useState } from 'react'
import { Activity, Shield, Cloud, Lock, ArrowRight, HelpCircle, ChevronDown, ChevronUp, LogIn, Eye, EyeOff, Users } from 'lucide-react'
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
          <p className="login-hero-sub">Private, offline-first HR management — powered by your Google Drive.</p>
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

          {/* Tab content rendered eagerly — conditionally visible */}
          <div style={{ display: authTab === 'manager' ? 'block' : 'none' }}>
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
          </div>
          <div style={{ display: authTab === 'employee' ? 'block' : 'none' }}>
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
      `}</style>
    </div>
  )
}
