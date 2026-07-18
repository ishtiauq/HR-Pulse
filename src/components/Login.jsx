import { useState } from 'react'
import { Shield, Cloud, Zap, Activity, Lock, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { fetchUserProfile } from '../services/googleDrive.js'

export default function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showIntermediateModal, setShowIntermediateModal] = useState(false)
  const [showAccordion, setShowAccordion] = useState(false)

  const triggerOAuth = () => {
    setIsLoading(true)

    // Fallback if Google GIS is not loaded (e.g. offline, script blocked, etc.)
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

  return (
    <div className="welcome-screen-wrapper">
      {/* Top Left Brand Header */}
      <div className="welcome-brand">
        <div className="welcome-logo-box">
          <Activity size={24} color="#fff" />
        </div>
        <div>
          <span className="welcome-title">HR Pulse</span>
          <span className="welcome-tagline">DRIVE-BASED HRM</span>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="welcome-center-content">
        <h1 className="welcome-heading">
          Your HR Data Lives in <span className="gradient-text-blue">Your Google Drive</span>
        </h1>
        
        {/* Animated Value Proposition Cards Grid */}
        <div className="welcome-value-props">
          <div className="value-prop-card anim-delay-1">
            <span className="value-prop-badge badge-free">Zero Fees</span>
            <h3 className="value-prop-title">No Subscriptions</h3>
            <p className="value-prop-desc">100% free serverless hosting. Zero monthly bills, forever.</p>
          </div>
          
          <div className="value-prop-card anim-delay-2">
            <span className="value-prop-badge badge-open">Open Data</span>
            <h3 className="value-prop-title">No Vendor Lock-in</h3>
            <p className="value-prop-desc">Your employee records belong to you. Migrate or export at any time.</p>
          </div>
          
          <div className="value-prop-card card-highlighted anim-delay-3">
            <span className="value-prop-badge badge-secure">Safe Storage</span>
            <h3 className="value-prop-title">Your Own Cloud</h3>
            <p className="value-prop-desc">Files stay inside your personal Google account. We have zero database access.</p>
          </div>
        </div>

        {/* Feature Pills Row */}
        <div className="welcome-feature-pills">
          <div className="feature-pill">
            <div className="pill-icon-box pill-icon-shield">
              <Shield size={18} />
            </div>
            <span>Bank-grade privacy. We can't see your data.</span>
          </div>

          <div className="feature-pill">
            <div className="pill-icon-box pill-icon-cloud">
              <Cloud size={18} />
            </div>
            <span>Auto-sync across all your devices.</span>
          </div>

          <div className="feature-pill">
            <div className="pill-icon-box pill-icon-zap">
              <Zap size={18} />
            </div>
            <span>Works offline. Syncs when you're back.</span>
          </div>
        </div>

        {/* Connect Button Container with Tooltip */}
        <div className="connect-button-wrapper">
          <div className="connect-button-tooltip">
            We only create a private HR-Pulse-DB folder inside your Google Drive. We never access your personal files.
          </div>
          <button 
            onClick={handleConnectClick}
            className="connect-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="welcome-spinner" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.5-.143 2.5-.97 3.514v2.923h6.39c3.74-3.437 5.725-8.508 5.725-14.294z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.92l-6.39-2.923c-1.78 1.19-4.06 1.9-6.57 1.9-5.053 0-9.336-3.415-10.865-8.01H1.61v3.023C3.606 20.015 7.55 24 12 24z" />
                <path fill="#FBBC05" d="M1.135 12.077a14.364 14.364 0 0 1 0-4.154V4.9H1.61A23.953 23.953 0 0 0 0 12c0 2.502.39 4.903 1.135 7.177l6.388-3.023c-.382-1.144-.388-2.933 0-4.077z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.23 0 12 0 7.55 0 3.606 3.985 1.61 7.9H8.025C9.554 3.305 13.837 4.75 12 4.75z" />
              </svg>
            )}
            <span style={{ fontWeight: 600 }}>{isLoading ? 'Connecting Drive...' : 'Connect Google Drive'}</span>
          </button>
        </div>

        <p className="welcome-small-text">
          Free forever. No credit card required.
        </p>
      </div>

      {/* Footer Branding */}
      <div className="welcome-footer">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trusted by small teams worldwide</span>
        <div className="welcome-avatars">
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop" alt="User 1" />
          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop" alt="User 2" />
          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop" alt="User 3" />
        </div>
      </div>

      {/* Intermediate Trust Modal */}
      {showIntermediateModal && (
        <div className="trust-popup-overlay">
          <div className="modal-container welcome-modal" style={{ maxWidth: '520px', padding: '32px', background: '#ffffff' }}>
            <div className="modal-header" style={{ marginBottom: '16px', border: 'none', padding: 0 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Just one thing before we connect...
              </h2>
            </div>
            
            <div className="modal-body" style={{ padding: 0, overflow: 'visible' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                HR Pulse needs permission to create a private app folder in your Google Drive.
              </p>

              {/* Visual Illustration */}
              <div className="auth-illustration-container">
                <div className="drive-icon-wrapper">
                  <Cloud size={38} className="drive-illustration-cloud" />
                  <div className="locked-folder-icon">
                    <Lock size={12} style={{ color: 'var(--accent-success)' }} />
                    <span>HR-Pulse-DB</span>
                  </div>
                </div>
              </div>

              {/* Bullet list of EXACT permissions */}
              <ul className="auth-permissions-list">
                <li>
                  <span className="perm-status status-check">✅</span>
                  <span className="perm-text">"Create and manage files in a hidden app folder"</span>
                </li>
                <li>
                  <span className="perm-status status-cross">❌</span>
                  <span className="perm-text">We do NOT access your photos, documents, or spreadsheets</span>
                </li>
                <li>
                  <span className="perm-status status-cross">❌</span>
                  <span className="perm-text">We do NOT share your data with third parties</span>
                </li>
              </ul>

              {/* Action Buttons Row */}
              <div className="auth-modal-actions">
                <button 
                  onClick={handleConfirmAuthorize}
                  className="connect-btn modal-cta-btn"
                >
                  <span>Authorize Google Drive</span>
                  <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => setShowAccordion(prev => !prev)}
                  className="btn btn-outline learn-more-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                >
                  <HelpCircle size={16} />
                  <span>Learn More</span>
                  {showAccordion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Learn More Accordion Details */}
              {showAccordion && (
                <div className="auth-accordion-content">
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700 }}>What is drive.appdata scope?</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    It is a private, isolated storage area inside your Google Drive account designed only for specific apps. Files stored here are completely hidden from your main Drive directory and other applications. This ensures that only HR Pulse can read and modify the files, keeping your payroll and directories strictly private.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer welcome-modal-footer">
              You can disconnect anytime from Settings → Google Drive Sync.
            </div>
          </div>
        </div>
      )}

      {/* Embedded styles for styling elements cleanly */}
      <style>{`
        .welcome-screen-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
          font-family: var(--font-sans);
          position: relative;
          overflow: hidden;
        }

        .welcome-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 2;
        }

        .welcome-logo-box {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--accent-primary), #2563eb);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
        }

        .welcome-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          display: block;
          line-height: 1.1;
        }

        .welcome-tagline {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--accent-primary);
          letter-spacing: 0.1em;
          display: block;
        }

        .welcome-center-content {
          max-width: 900px;
          margin: auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          z-index: 2;
        }

        .welcome-heading {
          font-size: 3rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.15;
          letter-spacing: -0.02em;
          font-family: var(--font-display);
        }

        .gradient-text-blue {
          background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Value Proposition Grid styling */
        .welcome-value-props {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
          max-width: 900px;
          margin: 16px 0;
        }

        .value-prop-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 24px;
          text-align: left;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.02), inset 0 1px 0 #ffffff;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(24px);
          animation: welcome-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .anim-delay-1 { animation-delay: 0.1s; }
        .anim-delay-2 { animation-delay: 0.2s; }
        .anim-delay-3 { animation-delay: 0.3s; }

        .value-prop-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06), inset 0 1px 0 #ffffff;
          border-color: rgba(37, 99, 235, 0.2);
        }

        .card-highlighted {
          background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.04);
        }

        .card-highlighted:hover {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.08);
        }

        .value-prop-badge {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 100px;
          display: inline-block;
          margin-bottom: 12px;
        }

        .badge-free { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
        .badge-open { background: rgba(245, 158, 11, 0.1); color: #b45309; }
        .badge-secure { background: rgba(16, 185, 129, 0.1); color: #047857; }

        .value-prop-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .value-prop-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }

        /* Feature Pills Row styling */
        .welcome-feature-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          margin: 8px 0;
        }

        .feature-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 100px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .pill-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pill-icon-shield { background: rgba(59, 130, 246, 0.1); color: var(--accent-primary); }
        .pill-icon-cloud { background: rgba(16, 185, 129, 0.1); color: var(--accent-success); }
        .pill-icon-zap { background: rgba(245, 158, 11, 0.1); color: var(--accent-warning); }

        .connect-button-wrapper {
          position: relative;
          display: inline-block;
          margin-top: 12px;
        }

        .connect-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 16px 32px;
          border-radius: 14px;
          font-size: 1.05rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.35);
        }

        .connect-btn:hover {
          transform: scale(1.05);
          background: #1d4ed8;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.45);
        }

        .connect-button-tooltip {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: #ffffff;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          line-height: 1.4;
          width: 280px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
          transition: all 0.2s ease-out;
          z-index: 10;
          pointer-events: none;
        }

        .connect-button-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -6px;
          border-width: 6px;
          border-style: solid;
          border-color: #1e293b transparent transparent transparent;
        }

        .connect-button-wrapper:hover .connect-button-tooltip {
          visibility: visible;
          opacity: 1;
          bottom: 120%;
        }

        .welcome-small-text {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .welcome-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: welcome-spin 0.8s linear infinite;
        }

        .welcome-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 2;
        }

        .welcome-avatars {
          display: flex;
          align-items: center;
          gap: -8px;
        }

        .welcome-avatars img {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          object-fit: cover;
          margin-left: -8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .welcome-avatars img:first-child {
          margin-left: 0;
        }

        /* Welcome Trust Modal styling */
        .trust-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10005;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: overlayFadeIn 0.3s ease-out forwards;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .welcome-modal {
          animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .auth-illustration-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 20px 0;
          padding: 24px;
          background: var(--bg-primary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .drive-icon-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          background: rgba(37, 99, 235, 0.05);
          border: 2px dashed rgba(37, 99, 235, 0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: floatIllustration 3s ease-in-out infinite alternate;
        }

        .drive-illustration-cloud {
          color: var(--accent-primary);
          animation: pulseIcon 3s infinite alternate;
        }

        .locked-folder-icon {
          position: absolute;
          bottom: -4px;
          right: -8px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          padding: 4px 10px;
          border-radius: 20px;
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-success);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .auth-permissions-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .auth-permissions-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.9rem;
        }

        .perm-status {
          font-size: 1.1rem;
          line-height: 1;
        }

        .perm-text {
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .auth-modal-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .modal-cta-btn {
          width: 100%;
          justify-content: center;
          padding: 14px;
          font-size: 1rem;
        }

        .learn-more-btn {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .auth-accordion-content {
          margin-top: 16px;
          padding: 16px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          animation: expandDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          text-align: left;
        }

        .welcome-modal-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: center;
          width: 100%;
        }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes floatIllustration {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }

        @keyframes pulseIcon {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }

        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-8px); max-height: 0; overflow: hidden; }
          to { opacity: 1; transform: translateY(0); max-height: 200px; }
        }

        @keyframes welcome-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes welcome-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 850px) {
          .welcome-value-props {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .welcome-heading {
            font-size: 2.25rem;
          }
          .welcome-screen-wrapper {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  )
}
