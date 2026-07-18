import { useState } from 'react'
import { Activity, Lock, Database, Heart } from 'lucide-react'
import AdSlot from './AdSlot.jsx'
import { fetchUserProfile } from '../services/googleDrive.js'

export default function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = () => {
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
        scope: 'https://www.googleapis.com/auth/drive.file email profile openid',
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

  return (
    <div className="login-wrapper">
      {/* Dynamic Background Blobs */}
      <div className="login-bg-blobs">
        <div className="login-blob login-blob-1"></div>
        <div className="login-blob login-blob-2"></div>
        <div className="login-blob login-blob-3"></div>
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className="login-card">
        {/* Brand Logo & Glowing Animation */}
        <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div className="brand-glow" style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)'
          }}>
            <Activity size={32} color="#fff" style={{ animation: 'pulse 2s infinite' }} />
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          fontFamily: 'var(--font-display)'
        }}>HR Pulse</h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          lineHeight: '1.5',
          marginBottom: '32px'
        }}>
          Secure, serverless Human Resource Management using your own Google Drive storage.
        </p>

        {/* Features Highlights */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          textAlign: 'left',
          marginBottom: '36px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Database size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Uses a private folder on your Google Drive.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Lock size={18} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              100% private data ownership and control.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Heart size={18} style={{ color: '#ec4899', flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              100% Free Forever (supported by non-intrusive ads).
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleGoogleSignIn}
          className="btn btn-google"
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          {isLoading ? (
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid rgba(0, 0, 0, 0.1)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.5-.143 2.5-.97 3.514v2.923h6.39c3.74-3.437 5.725-8.508 5.725-14.294z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.92l-6.39-2.923c-1.78 1.19-4.06 1.9-6.57 1.9-5.053 0-9.336-3.415-10.865-8.01H1.61v3.023C3.606 20.015 7.55 24 12 24z" />
              <path fill="#FBBC05" d="M1.135 12.077a14.364 14.364 0 0 1 0-4.154V4.9H1.61A23.953 23.953 0 0 0 0 12c0 2.502.39 4.903 1.135 7.177l6.388-3.023c-.382-1.144-.388-2.933 0-4.077z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.23 0 12 0 7.55 0 3.606 3.985 1.61 7.9H8.025C9.554 3.305 13.837 4.75 12 4.75z" />
            </svg>
          )}
          <span>{isLoading ? 'Connecting to Drive...' : 'Sign in with Google'}</span>
        </button>

        {/* Footer info */}
        <p style={{
          marginTop: '24px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          By signing in, you grant HR Pulse access to create its database files in your Google Drive App folder.
        </p>

        {/* AdSense Placement */}
        <AdSlot type="horizontal" style={{ marginTop: '24px' }} />
      </div>

      {/* Internal CSS for spin & pulse */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
