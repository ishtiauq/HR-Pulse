import React, { useState, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import Icon from "@/components/ui/Icon.jsx"
import hrPulseLogo from '../Assets/Logo Banner.svg'
import { fetchUserProfile } from '../services/googleDrive.js'
import { verifyPassword, hashPassword } from '../services/crypto.js'

const ADMIN_ACCOUNTS_KEY = 'hr_pulse_admin_accounts'

// Subheading split into one dialog modal per line (Stage 2 stacked-deck reveal)
const SUB_LINES = [
  'Ditch the endless spreadsheets.',
  'Supercharge your HR with seamless attendance,',
  'automated payroll, and instant asset tracking',
  'in one incredibly slick, lightning-fast dashboard.',
  'Get started 100% free today.',
]

// Stage 2: each subheading line gets its OWN full-viewport section. When that
// section scrolls into view, the popup modal reveals sleekly and dynamically:
// the card blurs in with a spring, the accent bar draws in, a light sweeps
// across the glass, and the text words cascade up one by one.
function SubDialog({ line, index }) {
  const words = line.split(' ')
  return (
    <motion.div
      initial={{ opacity: 0, y: 44, scale: 0.9, filter: "blur(14px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 220, damping: 20, mass: 0.9 }}
      className="relative w-full max-w-lg flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/95 text-popover-foreground shadow-2xl backdrop-blur-xl"
    >
      {/* Top gradient accent bar — draws in from the left */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-primary z-10 origin-left"
      />

      {/* Light sweep that glides across the glass once */}
      <motion.div
        initial={{ x: "-130%" }}
        whileInView={{ x: "230%" }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ delay: 0.3, duration: 0.9, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 z-10 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      <div
        role="dialog"
        aria-label={`Feature ${index + 1}`}
        className="login-sub-dialog outline-none focus:outline-none flex flex-col w-full h-full p-6 sm:p-8"
      >
        <p className="login-sub-dialog-text font-bold text-foreground tracking-tight">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ delay: 0.3 + i * 0.055, type: "spring", stiffness: 300, damping: 24 }}
              className="inline-block will-change-transform"
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </p>
      </div>
    </motion.div>
  )
}

// FAQ content — each entry renders as its own split glass card
const FAQ_ITEMS = [
  {
    q: 'Is HR Pulse really free?',
    a: 'Yes — creating a workspace is 100% free. No credit card, no trial clock, no hidden fees. You stay in full control of everything.',
  },
  {
    q: 'Where is my company data stored?',
    a: 'Everything lives in an encrypted app-data folder inside your own Google Drive. Only you decide what is shared and who gets access.',
  },
  {
    q: 'How do teammates sign in?',
    a: 'Your dashboard creates teammate accounts with work emails. Each teammate signs in with their email and a secure password — no extra setup.',
  },
  {
    q: 'Can I use HR Pulse on any device?',
    a: 'Yes. The app is fully responsive, so attendance, payroll, and asset tracking work smoothly on desktop, tablet, and mobile browsers.',
  },
  {
    q: 'How does attendance tracking work?',
    a: 'Teammates check in and out with one tap. Timesheets and approvals are generated automatically, ready to flow straight into payroll.',
  },
]

// Final section: FAQ — each question is its own split glass card (no single modal)
function FaqSection() {
  const [open, setOpen] = useState(0)
  return (
    <section className="h-dvh w-full flex flex-col items-center justify-center px-4 sm:px-6 py-8 snap-start">
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight text-center mb-6 sm:mb-8"
      >
        Frequently asked questions
      </motion.h2>

      <div className="w-full max-w-4xl grid grid-cols-1 gap-3 sm:gap-4">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24, scale: 0.95, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
              className={`relative flex flex-col overflow-hidden rounded-2xl border bg-background/95 shadow-lg backdrop-blur-xl transition-colors ${isOpen ? 'border-primary/40' : 'border-border/50'}`}
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-sm sm:text-base font-semibold text-foreground leading-snug">{item.q}</span>
                <Icon
                  name="expand_more"
                  size={20}
                  className={`shrink-0 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed px-5 pb-5">{item.a}</p>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export default function Login({ onLogin, themeMode, toggleTheme, setThemeMode }) {
  const [role, setRole] = useState('admin') // 'admin' | 'employee'
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [isLoading, setIsLoading] = useState(false)
  const [showIntermediateModal, setShowIntermediateModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Auto-typing hero word: Employee -> Team -> Squad -> Crew -> People -> loop
  const ROTATING_WORDS = ['Employees', 'Team', 'Squad', 'Crew', 'People']
  const [typed, setTyped] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  useEffect(() => {
    const word = ROTATING_WORDS[wordIndex]
    let timeout

    if (isWaiting) {
      timeout = setTimeout(() => {
        setIsWaiting(false)
        setIsDeleting(true)
      }, 1600)
    } else if (!isDeleting) {
      timeout = setTimeout(() => {
        const next = word.slice(0, typed.length + 1)
        setTyped(next)
        if (next === word) setIsWaiting(true)
      }, 110)
    } else {
      timeout = setTimeout(() => {
        if (typed.length <= 1) {
          setIsDeleting(false)
          setTyped('')
          setWordIndex(i => (i + 1) % ROTATING_WORDS.length)
        } else {
          setTyped(word.slice(0, typed.length - 1))
        }
      }, 45)
    }

    return () => clearTimeout(timeout)
  }, [typed, isDeleting, isWaiting, wordIndex])

  // Keep the topbar fixed on desktop/tablet; only mobile uses hide/show-on-scroll
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Cinematic Scroll Sequence — one full-viewport section per step:
  //   Section 1: Hero heading
  //   Sections 2-6: one subheading popup per section
  //   Section 7: Auth modal
  //   Section 8: FAQ
  // With 8 viewport sections, scrollYProgress maps as section index / 7.
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  
  // Heading Parallax (Section 1 fades out as the first card section arrives)
  const headingOpacity = useTransform(scrollYProgress, [0, 0.05, 0.11], [1, 1, 0])
  const headingY = useTransform(scrollYProgress, [0, 0.05, 0.11], [0, 0, -80])

  // Scroll Indicator — fades out as you leave section 1, fades back in on return
  const scrollIndicatorRaw = useTransform(scrollYProgress, [0, 0.03, 0.12], [1, 1, 0])
  const scrollIndicatorOpacity = useSpring(scrollIndicatorRaw, { stiffness: 120, damping: 22, mass: 0.6 })
  
  // Ambient Orb Parallax (Cinematic Warp during transition)
  const orb1Scale = useTransform(scrollYProgress, [0, 0.15, 0.55], [1, 1, 1.8])
  const orb1X = useTransform(scrollYProgress, [0, 0.15, 0.55], ["0%", "0%", "40%"])
  const orb1Y = useTransform(scrollYProgress, [0, 0.15, 0.55], ["0%", "0%", "50%"])

  const orb2Scale = useTransform(scrollYProgress, [0, 0.15, 0.55], [1, 1, 2.2])
  const orb2X = useTransform(scrollYProgress, [0, 0.15, 0.55], ["0%", "0%", "-30%"])
  const orb2Y = useTransform(scrollYProgress, [0, 0.15, 0.55], ["0%", "0%", "-60%"])

  // Scroll-based Theme Switching
  useEffect(() => {
    setThemeMode('light') // Force light mode on initial load
  }, [])

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest >= 0.1) {
      setThemeMode(prev => prev !== 'dark' ? 'dark' : prev)
    } else {
      setThemeMode(prev => prev !== 'light' ? 'light' : prev)
    }
  })

  // Topbar visible only at the very top on mobile; fixed on desktop/tablet.
  // Hides the instant you start scrolling, shows again when back at the top.
  const [showTopbar, setShowTopbar] = useState(true)
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isMobile) {
      setShowTopbar(true)
      return
    }
    setShowTopbar(latest < 0.002)
  })

  // --- Employee state ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const getAdminAccounts = () => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_ACCOUNTS_KEY)) || []
    } catch {
      return []
    }
  }

  const adminSession = (account) => ({
    id: account.id,
    name: account.name,
    email: account.email,
    role: 'Admin',
    companyName: account.companyName,
    avatar: '',
    isWorkspaceOwner: true,
    adminAccountId: account.id,
    token: 'mock-token-' + Date.now()
  })

  // --- Admin signup (create workspace) ---
  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || !email.trim() || !companyName.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setIsLoading(true)
    try {
      const accounts = getAdminAccounts()
      if (accounts.some(a => a.email.toLowerCase() === email.trim().toLowerCase())) {
        setError('An account with this email already exists. Try signing in.')
        setIsLoading(false)
        return
      }
      const passwordHash = await hashPassword(password)
      const account = {
        id: `admin-${Date.now()}`,
        name: fullName.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        passwordHash,
        createdAt: new Date().toISOString()
      }
      accounts.push(account)
      localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts))
      onLogin(adminSession(account))
    } catch (err) {
      setError('Sign up failed: ' + err.message)
      setIsLoading(false)
    }
  }

  // --- Admin email/password login ---
  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const accounts = getAdminAccounts()
      const account = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase())
      if (!account) {
        setError('No admin account found with this email.')
        setIsLoading(false)
        return
      }
      const valid = await verifyPassword(password, account.passwordHash)
      if (!valid) {
        setError('Invalid email or password.')
        setIsLoading(false)
        return
      }
      onLogin(adminSession(account))
    } catch (err) {
      setError('Login failed: ' + err.message)
      setIsLoading(false)
    }
  }

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
    <div 
      ref={containerRef}
      className="h-dvh bg-background text-foreground relative overflow-y-auto overflow-x-hidden font-sans scroll-smooth snap-y snap-mandatory transition-colors duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      
      {/* Dynamic Warping Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          style={{ scale: orb1Scale, x: orb1X, y: orb1Y }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          style={{ scale: orb2Scale, x: orb2X, y: orb2Y }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/20 rounded-full blur-[150px]" 
        />
      </div>

      {/* Deep Void Tech Grid (Fades in on Dark Mode) */}
      <div 
        className={`fixed inset-0 z-0 pointer-events-none transition-all duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${themeMode === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Transparent Navbar */}
      <header
        className="fixed top-0 w-full z-50 pointer-events-none bg-transparent"
        style={{ transform: isMobile && !showTopbar ? 'translateY(-100%)' : 'translateY(0%)', transition: 'transform 300ms ease' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between pointer-events-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img 
              src={hrPulseLogo} 
              alt="HR Pulse Logo" 
              className={`block h-9 w-auto max-w-[160px] object-contain shrink-0 drop-shadow-sm ${themeMode === 'dark' ? 'invert' : ''}`} 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {/* Theme toggle removed from here as it is now scroll-driven */}
          </motion.div>
        </div>
      </header>

      {/* Scroll deck: one full-viewport section per step */}
      <div className="relative z-10">
        {/* Section 1: Hero Heading */}
        <section className="relative h-dvh w-full flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 snap-start">
          <motion.h1 
            initial={{ filter: "blur(20px)", opacity: 0, scale: 1.1 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ opacity: headingOpacity, y: headingY }}
            className="login-hero-title uppercase text-5xl sm:text-6xl lg:text-7xl xl:text-[96px] w-full font-black tracking-tight leading-[1.1] text-center"
          >
            When{' '}
            <span className="text-primary relative inline-block align-baseline">
              {typed}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                className="inline-block w-[3px] h-[0.85em] bg-primary align-baseline ml-0.5"
              />
            </span>
            <br className="sm:hidden" /> Win,<br />
            Business<br className="sm:hidden" /> Follows.
          </motion.h1>

        </section>

        {/* Sections 2-6: one subheading popup per section */}
        {SUB_LINES.map((line, i) => (
          <section key={i} className="h-dvh w-full flex flex-col items-center justify-center px-4 sm:px-6 snap-start">
            <SubDialog line={line} index={i} />
          </section>
        ))}
      </div>

      {/* Scroll Indicator — fixed, fades out as you scroll away and back in on return */}
      <motion.div
        style={{ opacity: scrollIndicatorOpacity }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2"
      >
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Scroll</span>
        <div className="w-5 h-8 rounded-full bg-primary/90 flex justify-center p-1 shadow-lg shadow-primary/40">
          <motion.div 
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-white"
          />
        </div>
      </motion.div>

      {/* Section 7: Auth Modal */}
      <section className="relative h-dvh w-full flex flex-col items-center justify-center px-4 pb-8 sm:pb-0 snap-start overflow-hidden">
              {/* Invisible box — holds card + ribbon as one unit and scales to fit every viewport */}
              <div className="login-modal-box relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 44, scale: 0.92, filter: "blur(12px)" }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ type: "spring", stiffness: 200, damping: 22, mass: 0.9 }}
                className="login-auth-card relative w-full max-w-[350px] mx-auto shrink-0"
              >
                {/* 1. Lanyard Back (Behind Card) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
                  <div className="absolute bottom-[calc(100%-23px)] left-1/2 -translate-x-1/2 w-[300px] h-[150px] sm:h-[200px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,transparent_30%,black_60%,black_100%)] sm:[mask-image:linear-gradient(to_bottom,transparent_0%,transparent_30%,black_70%,black_100%)]">
                    {/* Back strap (Left) */}
                    <div className="absolute -bottom-[20px] left-[139px] w-[32px] h-[600px] bg-[#d15200] origin-bottom -rotate-[14deg]" />
                  </div>
                </div>

                {/* 2. Lanyard Front (In front of Card) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-20">
                  {/* Slot Hole Base (Matches page background to simulate a real hole) */}
                  <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[56px] h-[12px] rounded-full bg-background" />

                  {/* Slot Hole Inner Shadow (Moved BEFORE Front Strap so Front Strap covers its top border) */}
                  <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[56px] h-[12px] rounded-full border border-border/50 shadow-[inset_0_4px_6px_rgba(0,0,0,0.4)] dark:shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] pointer-events-none" />

                  {/* Front strap (Right) - Pushed 1px down to overlap the hole lip and eliminate the gap */}
                  <div className="absolute bottom-[calc(100%-23px)] left-1/2 -translate-x-1/2 w-[300px] h-[150px] sm:h-[200px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,transparent_30%,black_60%,black_100%)] sm:[mask-image:linear-gradient(to_bottom,transparent_0%,transparent_30%,black_70%,black_100%)]">
                    <div className="absolute -bottom-[20px] right-[138px] w-[32px] h-[600px] bg-[#ff6a00] origin-bottom rotate-[12deg] shadow-[-6px_0_15px_rgba(0,0,0,0.4)]" />
                  </div>
                </div>

                 {/* Card Container */}
                <div className="bg-card backdrop-blur-2xl border border-border rounded-2xl sm:rounded-[28px] shadow-2xl relative z-10 overflow-hidden pt-12 pb-2">
              
              {/* Top Glow Effect */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="login-auth-card-inner relative z-10 p-5 pt-10 sm:p-6 sm:pt-11">
                {/* Title & Subtitle */}
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                  {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                </h2>

                {mode === 'signup' ? (
                  <>
                    {/* Sign Up Form */}
                    <form onSubmit={handleSignup} className="space-y-3.5 mt-5">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full border-input px-4 py-3 text-sm font-medium focus:outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          placeholder="Acme Inc."
                          className="w-full border-input px-4 py-3 text-sm font-medium focus:outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Work Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full border-input px-4 py-3 text-sm font-medium focus:outline-none transition-all"
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
                            className="w-full border-input px-4 py-3 pr-11 text-sm font-medium focus:outline-none transition-all"
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {showPassword ? <Icon name="visibility_off" size={18} /> : <Icon name="visibility" size={18} />}
                          </button>
                        </div>
                      </div>
                      {error && (
                        <div className="p-3.5 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          {error}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground mt-2 disabled:opacity-50"
                      >
                        {isLoading ? 'Creating Workspace...' : 'Create Workspace'} <Icon name="arrow_forward" size={18} />
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    {/* Role Selector Tabs */}
                    <div className="flex p-1.5 bg-muted/60 rounded-full mb-4 mt-4 border border-border">
                      <button
                        onClick={() => setRole('admin')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                          role === 'admin'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon name="shield" size={16} /> Admin
                      </button>
                      <button
                        onClick={() => setRole('employee')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                          role === 'employee'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon name="person" size={16} /> Teammate
                      </button>
                    </div>

                    <div className="min-h-[200px]">
                      {error && (
                        <div className="p-4 mb-6 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {error}
                        </div>
                      )}

                      {role === 'admin' ? (
                        <>
                          <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Work Email</label>
                              <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full border-input px-4 py-3 text-sm font-medium focus:outline-none transition-all"
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
                                  className="w-full border-input px-4 py-3 pr-11 text-sm font-medium focus:outline-none transition-all"
                                  required
                                />
                                <button 
                                  type="button" 
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                  {showPassword ? <Icon name="visibility_off" size={18} /> : <Icon name="visibility" size={18} />}
                                </button>
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground mt-2 disabled:opacity-50"
                            >
                              {isLoading ? 'Signing In...' : 'Sign In'} <Icon name="arrow_forward" size={18} />
                            </button>
                          </form>

                          {/* Divider */}
                          <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-border" />
                            <span className="px-3 text-xs text-muted-foreground uppercase tracking-widest">OR</span>
                            <div className="flex-grow border-t border-border" />
                          </div>

                          <button 
                            onClick={handleConnectClick} 
                            disabled={isLoading}
                            className="w-full flex items-center justify-between px-5 py-3 bg-muted/40 border border-border rounded-2xl text-sm font-semibold text-foreground hover:bg-muted transition disabled:opacity-50"
                          >
                            <span className="flex items-center gap-3">
                              <Icon name="cloud" size={18} />
                              Continue with Google
                            </span>
                            <Icon name="arrow_forward" size={16} />
                          </button>
                        </>
                      ) : (
                        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Work Email</label>
                            <input
                              type="text"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="name@company.com"
                              className="w-full border-input px-4 py-3 text-sm font-medium focus:outline-none transition-all"
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
                                className="w-full border-input px-4 py-3 pr-11 text-sm font-medium focus:outline-none transition-all"
                                required
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                              >
                                {showPassword ? <Icon name="visibility_off" size={18} /> : <Icon name="visibility" size={18} />}
                              </button>
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground mt-2 disabled:opacity-50"
                          >
                            {isLoading ? 'Signing In...' : 'Access Portal'} <Icon name="arrow_forward" size={18} />
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                )}

                {/* Footer toggle */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {mode === 'signup' ? (
                    <>Already have an account? <button onClick={() => { setMode('signin'); setError('') }} className="text-primary font-semibold hover:underline cursor-pointer">Sign in</button></>
                  ) : (
                    <>Don't have an account? <button onClick={() => { setMode('signup'); setError('') }} className="text-primary font-semibold hover:underline cursor-pointer">Sign up</button></>
                  )}
                </p>
              </div>
            </div>
            </motion.div>
              </div>
      </section>

      {/* Section 8: FAQ */}
      <FaqSection />

      {/* Intermediate Auth Modal */}
      {showIntermediateModal && (
        <div className="fixed inset-0 z-[100] flex overflow-y-auto p-4 bg-background/80 backdrop-blur-md">
          <div 
            role="dialog"
            className="m-auto p-8 max-w-sm w-full animate-fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <Icon name="shield" size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Connect Google Drive</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              HR Pulse requires access to your Google Drive to store company data securely. We only access the dedicated app-data folder.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirmAuthorize}
                className="w-full py-3 rounded-full text-sm font-bold bg-primary text-primary-foreground"
              >
                Authorize & Connect
              </button>
              <button 
                onClick={() => setShowIntermediateModal(false)}
                className="w-full py-3 rounded-full text-sm font-bold bg-muted text-foreground"
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
