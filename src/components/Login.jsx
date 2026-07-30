import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, User, ArrowRight, Cloud, 
  Eye, EyeOff, Activity, Moon, Sun
} from 'lucide-react'
import { fetchUserProfile } from '../services/googleDrive.js'
import { verifyPassword } from '../services/crypto.js'

export default function Login({ onLogin, themeMode, toggleTheme }) {
  const [role, setRole] = useState('admin') // 'admin' | 'employee'
  const [isLoading, setIsLoading] = useState(false)
  const [showIntermediateModal, setShowIntermediateModal] = useState(false)

  // --- Employee state ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // --- Existing OAuth logic ---
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
          role: 'Admin',
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
                role: 'Admin',
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
        role: employee.role || 'Teammate',
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



  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      
      {/* Static Ambient Background (Smooth, no JS animation lag) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/20 rounded-full blur-[150px]" />
      </div>

      {/* Glassmorphism Navbar */}
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-lg">
              <Activity size={24} />
            </div>
            <span className="font-extrabold text-xl tracking-tight">HR Pulse</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-md shadow-sm text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-blink" />
              System Operational
            </div>
            <button 
              onClick={toggleTheme} 
              className="w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card/50 backdrop-blur-md shadow-sm hover:bg-muted transition-colors"
            >
              {themeMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 py-24">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[460px] flex flex-col gap-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Welcome Back</h1>
            <p className="text-base text-muted-foreground">Sign in to your intelligent workspace.</p>
          </div>

          <div className="bg-card backdrop-blur-2xl border border-border p-8 rounded-2xl shadow-sm relative overflow-hidden">
            
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              {/* Role Selector Tabs */}
              <div className="flex p-1.5 bg-muted/60 rounded-full mb-8 border border-border">
                <button
                  onClick={() => setRole('admin')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                    role === 'admin'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Shield size={16} /> Workspace Admin
                </button>
                <button
                  onClick={() => setRole('employee')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                    role === 'employee'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User size={16} /> Teammate
                </button>
              </div>

              <div className="min-h-[220px]">
                  {error && (
                    <div className="p-4 mb-6 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {error}
                    </div>
                  )}

                  {role === 'admin' ? (
                    <div className="flex flex-col gap-5">
                      <div className="text-center mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                          <Shield size={32} className="text-primary" />
                        </div>
                        <h3 className="font-bold text-lg">Admin Access</h3>
                        <p className="text-xs text-muted-foreground mt-1">Manage payroll, attendance, and organization settings securely via Google Drive.</p>
                      </div>
                      <button 
                        onClick={handleConnectClick} 
                        disabled={isLoading}
                        className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-3 bg-primary text-primary-foreground disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Cloud size={18} className="animate-pulse" />
                            Connecting Workspace...
                          </div>
                        ) : (
                          <>
                            <Cloud size={20} /> Secure Drive Connect
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleEmployeeSubmit} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Work Email</label>
                        <input
                          type="text"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full border-input px-4 py-3.5 text-sm font-medium focus:outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border-input px-4 py-3.5 pr-11 text-sm font-medium focus:outline-none transition-all"
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground mt-2 disabled:opacity-50"
                      >
                        {isLoading ? 'Signing In...' : 'Access Portal'} <ArrowRight size={18} />
                      </button>
                    </form>
                  )}
              </div>
            </div>
          </div>



        </motion.div>
      </main>

      {/* Intermediate Auth Modal */}
      {showIntermediateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div 
            role="dialog"
            className="p-8 max-w-sm w-full animate-fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Shield size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Connect Google Drive</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              HR Pulse requires access to your Google Drive to store company data securely. We only access the dedicated app-data folder.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirmAuthorize}
                className="w-full py-3.5 rounded-full text-sm font-bold bg-primary text-primary-foreground"
              >
                Authorize & Connect
              </button>
              <button 
                onClick={() => setShowIntermediateModal(false)}
                className="w-full py-3.5 rounded-full text-sm font-bold bg-muted text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
