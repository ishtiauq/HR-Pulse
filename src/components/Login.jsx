import { useState } from 'react'
import { Shield, Cloud, ArrowRight, HelpCircle, ChevronDown, ChevronUp, LogIn, Eye, EyeOff, Users, Zap, Sun, Moon, Lock, Gift, Zap as Lightning } from 'lucide-react'
import { fetchUserProfile } from '../services/googleDrive.js'
import { verifyPassword } from '../services/crypto.js'

export default function Login({ onLogin, themeMode, toggleTheme }) {
  const [authTab, setAuthTab] = useState('manager') // 'manager' | 'employee'
  const [isLoading, setIsLoading] = useState(false)
  const [showIntermediateModal, setShowIntermediateModal] = useState(false)
  const [showAccordion, setShowAccordion] = useState(false)
  const [faqOpenIndex, setFaqOpenIndex] = useState(null)

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
          name: 'System Admin',
          email: 'admin@company.com',
          avatar: '',
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
              setError("Failed to fetch Google profile details: " + err.message)
            }
          } else {
            setIsLoading(false)
          }
        },
        error_callback: (err) => {
          setIsLoading(false)
          setError("Authorization error: " + err.message)
        }
      })
      client.requestAccessToken({ prompt: 'consent' })
    } catch (e) {
      setIsLoading(false)
      setError("Error initializing Google Login client: " + e.message)
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

  // --- Employee login logic ---
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
      const employee = employees.find(e => e.email === email)
      if (!employee) {
        setError('Invalid email or password.')
        setIsLoading(false)
        return
      }
      const valid = await verifyPassword(password, employee.passwordHash || employee.password)
      if (!valid) {
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
    <div className="login-page">
      {/* Topbar */}
      <header className="login-topbar">
        <div className="login-topbar-left">
          <div className="login-topbar-logo">
            <span className="login-topbar-logo-icon">HP</span>
          </div>
          <span className="login-topbar-brand">HR Pulse</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} title={`Theme: ${themeMode}`} aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-full hover:bg-muted/50 transition-colors text-foreground cursor-pointer">
            {themeMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="login-topbar-badge">
            <Zap size={14} />
            Free for limited time
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="login-hero relative min-h-[95vh] flex flex-col lg:flex-row items-center justify-center pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto gap-12 lg:gap-24 overflow-hidden">
        
        {/* Animated Mesh Gradient Background */}
        <div className="mesh-bg absolute inset-0 -z-10"></div>
        <div className="mesh-orb orb-1"></div>
        <div className="mesh-orb orb-2"></div>
        <div className="mesh-orb orb-3"></div>

        {/* Left: Marketing Copy */}
        <div className="flex-1 flex flex-col gap-6 z-10 text-center lg:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary w-fit mx-auto lg:mx-0 font-medium text-sm mb-4">
            <Zap size={14} />
            <span>Totally free for a limited time</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            HR Management. <br/>
            <span className="headline-gradient text-transparent bg-clip-text">Redefined.</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed mt-2">
            Experience lightning-fast, private, and modern HR management. Your data stays securely in your Google Drive. No hidden servers. No subscriptions.
          </p>
          <div className="flex items-center gap-4 mt-6 justify-center lg:justify-start">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} className="w-10 h-10 rounded-full border-2 border-background object-cover" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">Join 1,000+ modern teams</p>
          </div>
        </div>
        
        {/* Right: Auth Card */}
        <div className="w-full max-w-[440px] z-10 shrink-0">
          <div className="login-auth-card p-6 sm:p-8 lg:p-10">
            {/* Tabs */}
            <div className="login-tabs" role="tablist">
              <button role="tab" aria-selected={authTab === 'manager'} className={`login-tab ${authTab === 'manager' ? 'active' : ''}`} onClick={() => setAuthTab('manager')}>HR Manager</button>
              <button role="tab" aria-selected={authTab === 'employee'} className={`login-tab ${authTab === 'employee' ? 'active' : ''}`} onClick={() => setAuthTab('employee')}>Employee</button>
            </div>

            {/* Manager Login */}
            <div style={{ display: authTab === 'manager' ? 'block' : 'none' }}>
              <div className="flex flex-col gap-5">
                {error && <div className="login-error">{error}</div>}
                
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Cloud size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Welcome Back</h3>
                  <p className="text-sm text-center text-muted-foreground">Sign in with your Google Workspace to access your private HR dashboard.</p>
                </div>

                <button onClick={handleConnectClick} className="login-drive-btn px-5 py-3.5 sm:px-6 sm:py-4" disabled={isLoading}>
                  {isLoading ? (
                    <span>Connecting Drive...</span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="currentColor"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="currentColor"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l-12.85 22.2z" fill="currentColor"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="currentColor"/><path d="m59.8 53h-27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h24.5c1.6 0 3.15-.45 4.5-1.2z" fill="currentColor"/><path d="m73.4 26.5-12.2-21.1c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.4 28.4 11.6-19.6 1.35-2.35c.8-1.35 1.2-2.85 1.2-4.4 0-1.55-.4-3.05-1.2-4.45z" fill="currentColor"/></svg>
                      <span className="font-semibold text-[15px]">Connect Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Employee Login */}
            <div style={{ display: authTab === 'employee' ? 'block' : 'none' }}>
              <form onSubmit={handleEmployeeSubmit} aria-label="Employee login form" className="flex flex-col gap-5">
                {error && <div className="login-error">{error}</div>}

                <div>
                  <label className="login-label" htmlFor="login-email">Email Address</label>
                  <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required className="login-input px-3 sm:px-4 py-2.5 sm:py-3" />
                </div>

                <div>
                  <label className="login-label" htmlFor="login-password">Password</label>
                  <div className="relative">
                    <input id="login-password" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                      required className="login-input px-3 sm:px-4 py-2.5 sm:py-3 pr-11" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="login-eye-btn" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="login-drive-btn px-5 py-3 sm:px-6 sm:py-3.5 mt-2" aria-label="Log in">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  {!isLoading && <LogIn size={18} />}
                </button>

                <p className="login-trust-line mt-2">
                  <Users size={14} />
                  Sign in with credentials provided by your HR.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Box Features Section */}
      <section className="py-24 px-6 lg:px-12 max-w-[1200px] mx-auto z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">Powerful. Private. Free.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything you need to manage your team smoothly, wrapped in a beautiful interface that respects your privacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Privacy */}
          <div className="bento-card" style={{
            background: `linear-gradient(135deg, #4f46e5, #3730a3)`
          }}>
            <div className="bento-icon bg-white/20 backdrop-blur-md w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Lock size={24} className="text-white" />
            </div>
            <div className="bento-content">
              <h3 className="text-xl font-bold text-white mb-2">Total Privacy</h3>
              <p className="text-white/90 font-medium text-sm">Your data never leaves your Drive. HR Pulse uses a hidden app folder that only you can access. No external databases.</p>
            </div>
          </div>

          {/* Card 2: Speed */}
          <div className="bento-card" style={{
            background: `linear-gradient(135deg, #059669, #047857)`
          }}>
            <div className="bento-icon bg-white/20 backdrop-blur-md w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Lightning size={24} className="text-white" />
            </div>
            <div className="bento-content">
              <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-white/90 font-medium text-sm">Built on modern web tech. Instant local caching makes operations seamless.</p>
            </div>
          </div>

          {/* Card 3: Free */}
          <div className="bento-card" style={{
            background: `linear-gradient(135deg, #ea580c, #c2410c)`
          }}>
            <div className="bento-icon bg-white/20 backdrop-blur-md w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Gift size={24} className="text-white" />
            </div>
            <div className="bento-content">
              <h3 className="text-xl font-bold text-white mb-2">Totally Free For a Limited Time</h3>
              <p className="text-white/90 font-medium text-sm">Sign up now and lock in lifetime access. Zero hidden fees. Zero subscriptions. Enjoy all premium HR tools without spending a dime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Google Drive Auth Modal */}
      {showIntermediateModal && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <h2 className="login-modal-title">Just one thing before we connect...</h2>
            <p className="login-modal-desc">HR Pulse needs permission to create a private app folder in your Google Drive.</p>

            <div className="login-modal-illustration">
              <Cloud size={48} className="text-[#444] mb-2" />
            </div>

            <ul className="login-modal-perms">
              <li><span className="perm-check">✅</span> Create and manage files in a hidden app folder</li>
              <li><span className="perm-cross">❌</span> We do NOT access your photos, documents, or spreadsheets</li>
              <li><span className="perm-cross">❌</span> We do NOT share your data with third parties</li>
            </ul>

            <div className="flex flex-col gap-3 mt-2">
              <button onClick={handleConfirmAuthorize} className="login-drive-btn px-5 py-3.5 sm:px-6 sm:py-4 justify-center">
                Authorize Google Drive <ArrowRight size={18} />
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

            <div className="login-modal-footer">You can disconnect anytime from Settings → Google Drive Sync.</div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="login-faq">
        <h2 className="login-faq-title">Frequently Asked Questions</h2>
        <div className="login-faq-list">
          {[
            { q: 'What is HR Pulse?', a: 'HR Pulse is a private HR management system. Your employee data, payroll, and attendance records are stored exclusively in a hidden folder inside your own Google Drive.' },
            { q: 'How does Google Drive integration work?', a: 'When you connect your Google Drive, HR Pulse creates a private app folder (drive.appdata) that is hidden from your main Drive view. Only HR Pulse can read and write to this folder.' },
            { q: 'Is my data secure?', a: 'Yes. Your data never leaves your Google Drive storage. We have zero access to your files.' },
            { q: 'Is HR Pulse really free?', a: 'Yes. HR Pulse is totally free for a limited time with no credit card required. Claim your spot now!' },
          ].map((faq, i) => (
            <div key={i} className="login-faq-item">
              <button className="login-faq-question" onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}>
                {faq.q}
                {faqOpenIndex === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {faqOpenIndex === i && (
                <div className="login-faq-answer">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <div className="login-footer-inner">
          <div className="login-footer-logo">
            <span className="login-footer-logo-icon">HP</span>
            <span className="login-footer-logo-text">HR Pulse</span>
          </div>
          <p className="login-footer-desc">Private HR management. Your data stays in your Drive.</p>
          <div className="login-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
        <div className="login-footer-bottom">
          <span>&copy; {new Date().getFullYear()} HR Pulse. All rights reserved.</span>
        </div>
      </footer>

      <style>{`
        .login-page {
          height: 100vh; min-height: 100vh; display: flex; flex-direction: column;
          font-family: var(--font-sans, 'Inter', sans-serif);
          background: var(--background);
          overflow-x: hidden;
          overflow-y: auto;
        }

        /* Topbar styling */
        .login-topbar {
          height: 64px; min-height: 64px; display: flex; align-items: center;
          justify-content: space-between; padding: 0 24px; position: fixed;
          top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 100; margin: 0;
          width: calc(100% - 32px); max-width: 1200px; border-radius: 100px; box-sizing: border-box;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px) saturate(120%);
          -webkit-backdrop-filter: blur(24px) saturate(120%);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.5);
        }
        .dark .login-topbar {
          background: rgba(15, 15, 20, 0.7);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05);
        }
        .login-topbar-left {
          display: flex; align-items: center; gap: 12px;
        }
        .login-topbar-logo {
          width: 32px; height: 32px;
          background: var(--foreground);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }
        .login-topbar-logo-icon {
          color: var(--background);
          font-weight: 800; font-size: 14px;
        }
        .login-topbar-brand {
          font-weight: 700; font-size: 20px;
          color: var(--foreground);
          letter-spacing: -0.02em;
        }
        .login-topbar-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 100px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3);
        }

        /* Mesh Gradients & Orbs for Hero */
        .mesh-bg {
          background: var(--background);
        }
        .mesh-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          z-index: -10;
          animation: float 10s infinite ease-in-out alternate;
        }
        .orb-1 {
          width: 400px; height: 400px;
          background: rgba(234, 88, 12, 0.15); /* Orange tint */
          top: -10%; left: -5%;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: rgba(79, 70, 229, 0.12); /* Indigo tint */
          bottom: -20%; right: -10%;
          animation-delay: -3s;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: rgba(5, 150, 105, 0.1); /* Emerald tint */
          top: 30%; left: 50%;
          transform: translateX(-50%);
          animation-delay: -6s;
        }
        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(30px) scale(1.1); }
        }

        /* Auth Card specific styles matching standard app cards */
        .login-auth-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px) saturate(120%);
          -webkit-backdrop-filter: blur(24px) saturate(120%);
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          border-radius: 1.5rem;
        }
        .dark .login-auth-card {
          background: rgba(15, 15, 20, 0.85);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
        }

        .login-tabs {
          display: flex; background: var(--muted); border-radius: 12px; padding: 4px; margin-bottom: 24px;
        }
        .login-tab {
          flex: 1; padding: 12px; border: none; border-radius: 10px; cursor: pointer;
          font-weight: 600; font-size: 14px; transition: all 0.2s;
          background: transparent; color: var(--muted-foreground);
        }
        .login-tab.active {
          background: var(--background); color: var(--foreground);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* Buttons & Inputs */
        .login-drive-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; border: none; border-radius: 9999px;
          background: var(--primary); color: var(--primary-foreground);
          font-weight: 600; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 15px -3px rgba(240, 90, 20, 0.4);
        }
        .login-drive-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px -3px rgba(240, 90, 20, 0.6);
        }
        .login-drive-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .login-label {
          display: block; margin-bottom: 6px;
          font-weight: 600; font-size: 14px;
          color: var(--foreground);
        }
        .login-input {
          width: 100%; border-radius: 0.75rem; box-sizing: border-box;
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--foreground); outline: none;
          transition: all 0.2s;
        }
        .login-input:focus { 
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(240, 90, 20, 0.2);
        }
        .login-eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--muted-foreground); padding: 4px; display: flex;
        }

        .login-trust-line {
          display: flex; align-items: center; gap: 8px; justify-content: center;
          font-size: 12px; color: var(--muted-foreground); margin: 0; text-align: center;
        }

        /* Bento Box Cards */
        .bento-card {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 24px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
          transform: translateY(-6px);
        }
        .dark .bento-card {
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .bento-content {
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .bento-content { max-width: 100% !important; }
          .bento-card { padding: 24px; min-height: 220px; }
        }

        /* Modals & Accordions */
        .login-modal-overlay {
          position: fixed; inset: 0; z-index: 10005;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: fade 0.3s ease forwards;
        }
        .login-modal {
          max-width: 480px; width: 90%; padding: 32px; border-radius: 24px;
          background: var(--card); color: var(--card-foreground);
          border: 1px solid var(--border);
          box-shadow: 0 25px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex; flex-direction: column; gap: 20px;
        }
        .login-modal-title { font-size: 24px; font-weight: 800; margin: 0; }
        .login-modal-desc { font-size: 15px; color: var(--muted-foreground); margin: 0; line-height: 1.5; }
        .login-modal-illustration {
          display: flex; justify-content: center; align-items: center;
          padding: 24px; background: var(--muted);
          border-radius: 12px; border: 1px solid var(--border);
        }
        .login-modal-perms { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .login-modal-perms li { display: flex; align-items: flex-start; gap: 12px; font-size: 15px; color: var(--muted-foreground); line-height: 1.4; }
        .login-learn-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; padding: 12px; border-radius: 999px; cursor: pointer;
          background: transparent; border: 1px solid var(--border);
          color: var(--foreground);
          font-weight: 600; font-size: 14px; transition: background 0.2s;
        }
        .login-learn-btn:hover { background: var(--muted); }
        .login-modal-accordion {
          padding: 16px; background: var(--muted);
          border: 1px solid var(--border); border-radius: 12px;
          animation: expand 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-modal-accordion h4 { margin: 0 0 6px; font-size: 14px; font-weight: 700; }
        .login-modal-accordion p { margin: 0; font-size: 13px; color: var(--muted-foreground); line-height: 1.5; }
        .login-modal-footer { font-size: 13px; color: var(--muted-foreground); text-align: center; border-top: 1px solid var(--border); padding-top: 16px; }

        /* FAQ */
        .login-faq { width: 100%; max-width: 800px; margin: 0 auto; padding: 40px 24px 80px; box-sizing: border-box; }
        .login-faq-title { font-size: 32px; font-weight: 800; text-align: center; margin: 0 0 40px; color: var(--foreground); }
        .login-faq-list { display: flex; flex-direction: column; gap: 16px; }
        .login-faq-item {
          border: 1px solid var(--border); border-radius: 16px; overflow: hidden;
          background: var(--card); box-shadow: inset 0 1px 1px rgba(255,255,255,0.05), 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .login-faq-question {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; padding: 20px 24px; border: none; cursor: pointer;
          font-weight: 600; font-size: 16px; color: var(--foreground);
          background: transparent; transition: background 0.2s;
        }
        .login-faq-question:hover { background: var(--muted); }
        .login-faq-answer {
          padding: 0 24px 20px; font-size: 15px; color: var(--muted-foreground);
          line-height: 1.6; animation: expand 0.25s ease-out forwards;
        }

        /* Footer */
        .login-footer {
          background: var(--card);
          border-top: 1px solid var(--border);
          padding: 64px 24px 0; margin-top: auto;
        }
        .login-footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;
        }
        .login-footer-logo { display: flex; align-items: center; gap: 10px; }
        .login-footer-logo-icon {
          width: 32px; height: 32px; background: var(--foreground); border-radius: 8px;
          display: flex; align-items: center; justify-content: center; color: var(--background);
          font-weight: 800; font-size: 14px;
        }
        .login-footer-logo-text { font-weight: 800; font-size: 24px; color: var(--foreground); }
        .login-footer-desc { font-size: 15px; color: var(--muted-foreground); margin: 0; }
        .login-footer-links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
        .login-footer-links a { font-size: 14px; font-weight: 500; color: var(--muted-foreground); text-decoration: none; transition: color 0.2s; }
        .login-footer-links a:hover { color: var(--foreground); }
        .login-footer-bottom {
          max-width: 1200px; margin: 0 auto; padding: 24px 0; margin-top: 48px;
          border-top: 1px solid var(--border); font-size: 13px; color: var(--muted-foreground); text-align: center;
        }

        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: scale(0.96) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes expand { from { opacity: 0; transform: translateY(-8px); max-height: 0; overflow: hidden; } to { opacity: 1; transform: translateY(0); max-height: 400px; } }

        @media (max-width: 768px) {
          .login-topbar { top: 12px; height: 56px; min-height: 56px; padding: 0 16px; }
          .login-topbar-brand { font-size: 18px; }
          .login-topbar-badge { padding: 4px 10px; font-size: 11px; }
          .login-hero { pt-24; pb-16; }
          .orb-1, .orb-2, .orb-3 { transform: scale(0.6); }
        }
      `}</style>
    </div>
  )
}
