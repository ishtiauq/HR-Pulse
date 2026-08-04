import React, { useState, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useMotionValue, useMotionTemplate } from 'framer-motion'
import Icon from "@/components/ui/Icon.jsx"
import hrPulseLogo from '../Assets/Kormiis Logo.svg'
import heroCharacters from '../Assets/hero-characters.png'
import { fetchUserProfile } from '../services/googleDrive.js'
import { verifyPassword, hashPassword } from '../services/crypto.js'
import { loginWithGoogle, loginWithEmail, registerWithEmail, checkAndCreateUserDoc, updateProfileData, updateDriveConnectionStatus, setupRecaptcha, requestPhoneOtp, verifyPhoneOtp } from '../services/auth.js'
import Dashboard from './Dashboard.jsx'
import { allNavItems } from '../utils/helpers.js'

const ADMIN_ACCOUNTS_KEY = 'hr_pulse_admin_accounts'

const MARKETING_PILLARS = [
  {
    icon: 'groups',
    title: 'People & Pay',
    desc: 'Seamless Attendance tracking that flows directly into automated Payroll.'
  },
  {
    icon: 'account_balance_wallet',
    title: 'Finance & Assets',
    desc: 'Instant Asset tracking and Expense management for complete visibility.'
  },
  {
    icon: 'forum',
    title: 'Collaboration',
    desc: 'Company-wide Announcements, Calendars, and Task management for the whole squad.'
  }
]

const MOCK_DASHBOARD_DATA = {
  employees: [
    { id: '1', name: 'John Doe', role: 'Developer', status: 'Active' },
    { id: '2', name: 'Jane Smith', role: 'Designer', status: 'Active' },
    { id: '3', name: 'Mike Ross', role: 'Manager', status: 'Active' }
  ],
  attendance: {},
  payroll: {},
  announcements: [
    { id: 'a1', title: 'Welcome to HR Pulse', authorId: '1', date: new Date().toISOString(), priority: 'Important' }
  ],
  events: [],
  tasks: [{ id: 't1', title: 'Complete Onboarding', status: 'Pending' }],
  documents: [],
  assets: [{ id: 'as1', name: 'MacBook Pro', status: 'Assigned' }],
  driveConnected: true,
  hasPermission: () => true,
  simulatedRole: 'Admin',
  currentUser: { name: 'Admin', role: 'Admin' }
}

function MarketingSectionOne({ containerRef }) {
  const sectionRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: containerRef,
    offset: ["start start", "end end"]
  })

  const cards = [
    {
      title: "People & Pay",
      subtitle: "Seamless Attendance tracking that flows directly into automated Payroll.",
      bgColor: "bg-white text-black",
      iconColor: "bg-black/5 text-black",
      content: (
        <div className="flex flex-col gap-3 w-full max-w-sm ml-auto">
           <div className="bg-black/5 p-4 rounded-xl backdrop-blur-sm border border-black/10 shadow-sm">
             <div className="text-sm font-semibold">Clocked In: 09:00 AM</div>
             <div className="text-xs text-black/70">On time</div>
           </div>
           <div className="bg-black/5 p-4 rounded-xl backdrop-blur-sm border border-black/10 ml-8">
             <div className="text-sm font-semibold">Payroll processed</div>
             <div className="text-xs text-black/70">Payslip generated</div>
           </div>
        </div>
      )
    },
    {
      title: "Finance & Assets",
      subtitle: "Instant Asset tracking and Expense management for complete visibility.",
      bgColor: "bg-[#FE4D01] text-white",
      iconColor: "bg-black/10 text-white",
      content: (
        <div className="flex flex-col gap-3 w-full max-w-sm ml-auto">
           <div className="bg-black/10 p-4 rounded-xl backdrop-blur-sm border border-black/10 shadow-sm">
             <div className="text-sm font-semibold">Expense Request: Lunch</div>
             <div className="text-xs text-white/70">$15.00</div>
           </div>
           <div className="bg-black/5 p-4 rounded-xl backdrop-blur-sm border border-black/10 ml-8">
             <div className="text-sm font-semibold">Approved</div>
             <div className="text-xs text-white/70">Funds transferred</div>
           </div>
        </div>
      )
    },
    {
      title: "Collaboration",
      subtitle: "Company-wide Announcements, Calendars, and Task management for the whole squad.",
      bgColor: "bg-white text-black",
      iconColor: "bg-black/5 text-black",
      content: (
        <div className="flex flex-col gap-3 w-full max-w-sm ml-auto">
           <div className="bg-black/5 p-4 rounded-xl backdrop-blur-sm border border-black/10 shadow-sm">
             <div className="text-sm font-semibold">New Announcement</div>
             <div className="text-xs text-black/70">Townhall meeting at 3 PM</div>
           </div>
           <div className="bg-black/5 p-4 rounded-xl backdrop-blur-sm border border-black/10 ml-8">
             <div className="text-sm font-semibold">Task Assigned</div>
             <div className="text-xs text-black/70">Prepare slides</div>
           </div>
        </div>
      )
    }
  ]

  const card2Y = useTransform(scrollYProgress, [0, 0.33], [2000, 85])
  const card3Y = useTransform(scrollYProgress, [0.33, 0.66], [2000, 170])

  return (
    <section ref={sectionRef} className="relative w-full h-[300vh] snap-start">
      <div className="sticky top-0 h-dvh w-full flex flex-col items-center justify-center overflow-hidden px-4 sm:px-8">
        <div className="w-full text-left mb-6 sm:mb-10 z-20">
          <h2 className="text-[clamp(2.5rem,6vw+0.5rem,6rem)] leading-[1.1] font-black tracking-tight mb-4 text-foreground">
            Why Choose <span className="text-[#FE4D01]">Kormiis?</span>
          </h2>
        </div>

        <div className="relative w-full h-[40vh] md:h-[45vh] min-h-[300px] flex justify-center perspective-[2000px]">
          {/* Card 1 */}
          <motion.div 
            style={{ y: "0px" }}
            className={`absolute top-0 w-full h-full p-8 sm:p-12 rounded-[2.5rem] shadow-sm flex flex-col origin-top ${cards[0].bgColor}`}
          >
            <div className="flex items-center gap-5 mb-6 sm:mb-10">
              <div className={`w-14 h-14 rounded-2xl flex shrink-0 items-center justify-center ${cards[0].iconColor}`}>
                <Icon name="groups" size={28} />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black">{cards[0].title}</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 flex-1 w-full items-center">
              <div className="flex-1">
                <p className="text-lg sm:text-xl opacity-90 leading-relaxed">{cards[0].subtitle}</p>
              </div>
              <div className="flex-1 w-full flex items-center justify-end">
                {cards[0].content}
              </div>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            style={{ y: card2Y }}
            className={`absolute top-0 w-full h-full p-8 sm:p-12 rounded-[2.5rem] shadow-sm flex flex-col origin-top ${cards[1].bgColor}`}
          >
            <div className="flex items-center gap-5 mb-6 sm:mb-10">
              <div className={`w-14 h-14 rounded-2xl flex shrink-0 items-center justify-center ${cards[1].iconColor}`}>
                <Icon name="account_balance_wallet" size={28} />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black">{cards[1].title}</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 flex-1 w-full items-center">
              <div className="flex-1">
                <p className="text-lg sm:text-xl opacity-90 leading-relaxed">{cards[1].subtitle}</p>
              </div>
              <div className="flex-1 w-full flex items-center justify-end">
                {cards[1].content}
              </div>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            style={{ y: card3Y }}
            className={`absolute top-0 w-full h-full p-8 sm:p-12 rounded-[2.5rem] shadow-sm flex flex-col origin-top ${cards[2].bgColor}`}
          >
            <div className="flex items-center gap-5 mb-6 sm:mb-10">
              <div className={`w-14 h-14 rounded-2xl flex shrink-0 items-center justify-center ${cards[2].iconColor}`}>
                <Icon name="forum" size={28} />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black">{cards[2].title}</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 flex-1 w-full items-center">
              <div className="flex-1">
                <p className="text-lg sm:text-xl opacity-90 leading-relaxed">{cards[2].subtitle}</p>
              </div>
              <div className="flex-1 w-full flex items-center justify-end">
                {cards[2].content}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MarketingSectionTwo() {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  
  // Apply spring physics to the mouse coordinates for buttery smooth movement
  const springConfig = { damping: 40, stiffness: 300, mass: 0.5 }
  const smoothX = useSpring(x, springConfig)
  const smoothY = useSpring(y, springConfig)
  
  const rotateX = useTransform(smoothY, [0, 1], [10, -10])
  const rotateY = useTransform(smoothX, [0, 1], [-10, 10])
  
  // Dynamic smooth gradient position
  const glareX = useTransform(smoothX, [0, 1], [0, 100])
  const glareY = useTransform(smoothY, [0, 1], [0, 100])
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2) 0%, transparent 70%)`

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    x.set(mouseX / rect.width)
    y.set(mouseY / rect.height)
  }

  const handleMouseLeave = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center justify-center" style={{ perspective: '2000px' }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, filter: "blur(15px)" }}
        whileInView={{ opacity: 1, filter: "blur(0px)" }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 1, type: "spring", stiffness: 150, damping: 25 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          borderColor: 'rgba(255,255,255,0.1)'
        }}
        className="relative w-full max-w-4xl mx-auto flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border !border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)] text-white group hover:shadow-[0_40px_100px_rgba(254,77,1,0.3)] transition-shadow duration-700 p-8 sm:p-14 aspect-auto md:aspect-[1.65/1] outline-none ring-0"
      >
        {/* Sleek Orange Blob for ambient glow */}
        <div className="absolute top-[-5%] right-[5%] w-[30%] h-[40%] bg-primary/40 rounded-full blur-[70px] pointer-events-none" />

        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/50 opacity-40 pointer-events-none" />
        
        {/* Overlay Effects (Glare & Shimmer) placed at highest Z to cover all 3D elements */}
        <div className="absolute inset-0 z-50 pointer-events-none rounded-[2.5rem] overflow-hidden" style={{ transform: "translateZ(60px)" }}>
        </div>

        {/* Top section: 100% FREE & Logo */}
        <div className="relative z-10 flex items-center justify-between w-full mb-8 sm:mb-12" style={{ transform: "translateZ(30px)" }}>
          <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-gray-100 via-gray-300 to-gray-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-mono uppercase">
            100% FREE
          </span>
          {/* Logo / Brand mark */}
          <div className="flex items-center gap-1 opacity-90">
            <div className="w-10 h-10 rounded-full bg-primary mix-blend-screen shadow-[0_0_15px_rgba(254,77,1,0.5)]" />
            <div className="w-10 h-10 rounded-full bg-white/30 mix-blend-screen -ml-5 backdrop-blur-sm border border-white/20" />
          </div>
        </div>

        {/* Middle section: Main Text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center" style={{ transform: "translateZ(50px)" }}>
          <div className="max-w-2xl w-full flex flex-col">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[0.1em] font-sans uppercase mb-6 sm:mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] block w-full">
                MEMBERSHIP
              </span>
            </h2>
            <p className="text-sm sm:text-base text-white/80 font-medium leading-relaxed text-justify drop-shadow-md">
              No cap—we're giving it away for free for a limited time. Go absolutely crazy, use all the features, and pay literally nothing right now. No subscriptions, no hidden fees. Plus, everything lives securely encrypted in your own Google Drive. Immaculate HR vibes.
            </p>
          </div>
        </div>

        {/* Bottom section: Card Details */}
        <div className="relative z-10 flex items-end justify-between w-full mt-10 sm:mt-12" style={{ transform: "translateZ(40px)" }}>
          <div className="flex flex-col items-start">
            <span className="text-[10px] sm:text-xs text-white/40 tracking-[0.2em] uppercase mb-1">Status</span>
            <span className="text-base sm:text-xl font-bold tracking-widest text-white font-mono drop-shadow-md uppercase">LIMITED TIME</span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs text-white/40 tracking-[0.2em] uppercase mb-1">Tier</span>
            <span className="text-base sm:text-xl font-bold tracking-widest text-primary font-mono drop-shadow-md uppercase">ENTERPRISE</span>
          </div>
        </div>
      </motion.div>
    </section>
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
              className={`relative flex flex-col overflow-hidden rounded-2xl border bg-background/95 shadow-sm backdrop-blur-xl transition-colors ${isOpen ? 'border-primary/40' : 'border-border/50'}`}
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

function MarketingStackedSections({ containerRef }) {
  const section2Ref = useRef(null)
  
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: section2Ref,
    offset: ["start end", "start 10%"]
  })

  // When Section 3 (MarketingSectionTwo) scrolls up, blur and fade Section 2 (MarketingSectionOne)
  const blurValue = useTransform(scrollYProgress, [0, 1], [0, 30])
  const opacityValue = useTransform(scrollYProgress, [0, 1], [1, 0])
  const filter = useMotionTemplate`blur(${blurValue}px)`

  return (
    <div className="relative w-full z-0">
      <motion.div style={{ filter, opacity: opacityValue }}>
        <MarketingSectionOne containerRef={containerRef} />
      </motion.div>

      {/* Section 3 (Scrolls on top) */}
      <div 
        ref={section2Ref} 
        className="relative z-10 w-full min-h-dvh flex flex-col items-center justify-center snap-start bg-black text-white"
      >
        <MarketingSectionTwo />
      </div>
    </div>
  )
}

function FooterSection({ themeMode, logoSrc }) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-background border-t border-border py-12 px-6 sm:px-10 lg:px-16 mt-auto shrink-0 snap-start">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        <div className="flex flex-col gap-4 max-w-sm">
          <img 
            src={logoSrc} 
            alt="HR Pulse Logo" 
            className={`block h-8 w-auto object-contain object-left self-start shrink-0 ${themeMode === 'dark' ? 'invert' : ''}`} 
          />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kormiis is the all-in-one platform for modern HR, Payroll, and Team Management. Empowering teams to win.
          </p>
        </div>
        
        <div className="flex gap-16 sm:gap-24">
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-foreground">Product</h4>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#FE4D01] transition-colors">Features</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#FE4D01] transition-colors">Pricing</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#FE4D01] transition-colors">Integrations</a>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-foreground">Company</h4>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#FE4D01] transition-colors">About Us</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#FE4D01] transition-colors">Careers</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#FE4D01] transition-colors">Contact</a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Kormiis. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}

export default function Login({ onLogin, themeMode, toggleTheme, setThemeMode }) {
  const [role, setRole] = useState('admin') // 'admin' | 'employee'
  const [mode, setMode] = useState('signin')
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null) // 'signin' | 'signup'
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

  // --- Admin signup (Firebase) ---
  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please fill in email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setIsLoading(true)
    try {
      const user = await registerWithEmail(email.trim(), password)
      setFirebaseUser(user)
      await checkAndCreateUserDoc(user)
      setIsLoading(false)
      setOnboardingStep(2)
    } catch (err) {
      setError('Sign up failed: ' + err.message)
      setIsLoading(false)
    }
  }

  // --- Admin login (Firebase) ---
  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const user = await loginWithEmail(email.trim(), password)
      setFirebaseUser(user)
      const { data } = await checkAndCreateUserDoc(user)
      setIsLoading(false)
      if (!data?.fullName || !data?.companyName) {
        setOnboardingStep(2)
      } else {
        setFullName(data.fullName)
        setCompanyName(data.companyName)
        setOnboardingStep(3)
      }
    } catch (err) {
      setError('Login failed: ' + err.message)
      setIsLoading(false)
    }
  }

  // --- Google SSO (Firebase) ---
  const handleFirebaseGoogleLogin = async () => {
    setError('')
    setIsLoading(true)
    try {
      const user = await loginWithGoogle()
      setFirebaseUser(user)
      const { data } = await checkAndCreateUserDoc(user)
      setIsLoading(false)
      if (!data?.fullName || !data?.companyName) {
        setOnboardingStep(2)
      } else {
        setFullName(data.fullName)
        setCompanyName(data.companyName)
        setOnboardingStep(3)
      }
    } catch (err) {
      setError('Google Login failed: ' + err.message)
      setIsLoading(false)
    }
  }

  // --- Phone Auth (Firebase) ---
  const handleSendPhoneOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number.')
      return
    }
    setIsLoading(true)
    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container')
      const confirmation = await requestPhoneOtp(phoneNumber, recaptchaVerifier)
      setConfirmationResult(confirmation)
      setIsLoading(false)
    } catch (err) {
      setError('Failed to send SMS: ' + err.message)
      setIsLoading(false)
    }
  }

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!otpCode.trim()) {
      setError('Please enter the verification code.')
      return
    }
    setIsLoading(true)
    try {
      const user = await verifyPhoneOtp(confirmationResult, otpCode)
      setFirebaseUser(user)
      const { data } = await checkAndCreateUserDoc(user)
      setIsLoading(false)
      if (!data?.fullName || !data?.companyName) {
        setOnboardingStep(2)
      } else {
        setFullName(data.fullName)
        setCompanyName(data.companyName)
        setOnboardingStep(3)
      }
    } catch (err) {
      setError('Failed to verify code: ' + err.message)
      setIsLoading(false)
    }
  }

  // --- Google Drive Connection ---
  const triggerDriveOAuth = () => {
    setIsLoading(true)
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      console.warn("Google Client Library not detected. Falling back to simulated login.");
      setTimeout(() => {
        setIsLoading(false)
        onLogin(adminSession({ id: firebaseUser?.uid || 'local', name: fullName || 'System Admin', email: firebaseUser?.email || 'admin@company.com', companyName: companyName || 'Acme' }))
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
              if (firebaseUser) {
                await updateDriveConnectionStatus(firebaseUser.uid, true)
              }
              const adminUser = {
                name: fullName || 'Admin',
                email: firebaseUser?.email || '',
                companyName: companyName,
                role: 'Admin',
                token: tokenResponse.access_token,
                uid: firebaseUser?.uid
              }
              setIsLoading(false)
              onLogin(adminUser)
            } catch (err) {
              setIsLoading(false)
              setError("Failed during Drive connection: " + err.message)
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

      {/* Dark Mode Subtle Grid Background */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ease-in-out z-0 ${themeMode === 'dark' ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
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
        <section className="relative h-dvh w-full flex flex-col items-center pt-[80px] pb-[100px] px-4 sm:px-10 lg:px-16 snap-start overflow-hidden">
          <motion.div
            style={{ opacity: headingOpacity, y: headingY }}
            className="flex flex-col items-center justify-center w-full h-full gap-6 sm:gap-8 lg:gap-10"
          >
            {/* Headline */}
            <motion.h1 
              initial={{ filter: "blur(20px)", opacity: 0, scale: 1.1 }}
              animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="login-hero-title uppercase text-[clamp(2.5rem,6vw+0.5rem,6rem)] leading-[1.1] w-full font-black tracking-tight text-center shrink-0"
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

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
              className="w-full max-w-7xl flex justify-center mix-blend-multiply dark:mix-blend-screen overflow-hidden"
              style={{ flexShrink: 1, minHeight: 0 }}
            >
              <img src={heroCharacters} alt="Team" className="w-full h-full object-contain max-h-[40vh] sm:max-h-[50vh] lg:max-h-[65vh]" />
            </motion.div>
          </motion.div>
            
          {/* Scroll Indicator (Absolute bottom edge of viewport) */}
          <motion.div
            style={{ opacity: scrollIndicatorOpacity }}
            className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#FE4D01]">Scroll</span>
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full bg-[#FE4D01] flex items-center justify-center text-white shadow-[0_0_15px_rgba(254,77,1,0.4)]"
            >
              <Icon name="arrow_downward" size={24} />
            </motion.div>
          </motion.div>
        </section>

        {/* Section 2 & 3: Marketing Highlights (Stacked with Blur Transition) */}
        <MarketingStackedSections containerRef={containerRef} />
      </div>



      {/* Section 7: Auth Modal */}
      <section className="relative h-dvh w-full flex flex-col items-center justify-center px-4 pb-8 sm:pb-0 snap-start overflow-hidden bg-black text-white">
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
                    <div className="absolute -bottom-[20px] left-[139px] w-[32px] h-[600px] bg-[#CC3E01] origin-bottom -rotate-[14deg]" />
                  </div>
                </div>

                {/* 2. Lanyard Front (In front of Card) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-20">
                  {/* Slot Hole Base (Matches page background to simulate a real hole) */}
                  <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[56px] h-[12px] rounded-full bg-black" />

                  {/* Slot Hole Inner Shadow (Moved BEFORE Front Strap so Front Strap covers its top border) */}
                  <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[56px] h-[12px] rounded-full border border-border/50 shadow-[inset_0_4px_6px_rgba(0,0,0,0.4)] dark:shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] pointer-events-none" />

                  {/* Front strap (Right) - Pushed 1px down to overlap the hole lip and eliminate the gap */}
                  <div className="absolute bottom-[calc(100%-23px)] left-1/2 -translate-x-1/2 w-[300px] h-[150px] sm:h-[200px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,transparent_30%,black_60%,black_100%)] sm:[mask-image:linear-gradient(to_bottom,transparent_0%,transparent_30%,black_70%,black_100%)]">
                    <div className="absolute -bottom-[20px] right-[138px] w-[32px] h-[600px] bg-[#FE4D01] origin-bottom rotate-[12deg] shadow-[-6px_0_15px_rgba(0,0,0,0.4)]" />
                  </div>
                </div>

                 {/* Card Container */}
                <div className="bg-[#F0F8FF] backdrop-blur-2xl border border-border rounded-2xl sm:rounded-[28px] shadow-2xl relative z-10 overflow-hidden pt-12 pb-2">
              
              {/* Top Glow Effect */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="login-auth-card-inner relative z-10 p-5 pt-10 sm:p-6 sm:pt-11">
                {/* Title & Subtitle */}
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                  {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                </h2>

                {onboardingStep === 1 && mode === 'signup' ? (
                  <>
                    <form onSubmit={handleSignup} className="space-y-3.5 mt-5">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Work Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full border-input bg-gray-100 text-gray-900 px-4 py-3 text-sm font-medium focus:outline-none transition-all"
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
                            className="w-full border-input bg-gray-100 text-gray-900 px-4 py-3 pr-11 text-sm font-medium focus:outline-none transition-all"
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
                        {isLoading ? 'Creating Account...' : 'Continue'} <Icon name="arrow_forward" size={18} />
                      </button>
                    </form>
                  </>
                ) : onboardingStep === 1 && mode === 'signin' ? (
                  <>
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
                                className="w-full border-input bg-gray-100 text-gray-900 px-4 py-3 text-sm font-medium focus:outline-none transition-all"
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
                                  className="w-full border-input bg-gray-100 text-gray-900 px-4 py-3 pr-11 text-sm font-medium focus:outline-none transition-all"
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

                          <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-border" />
                            <span className="px-3 text-xs text-muted-foreground uppercase tracking-widest">OR</span>
                            <div className="flex-grow border-t border-border" />
                          </div>

                          <div className="flex gap-3">
                            <button 
                              onClick={handleFirebaseGoogleLogin} 
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted/40 border border-border rounded-2xl text-sm font-semibold text-foreground hover:bg-muted transition disabled:opacity-50"
                            >
                              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Google
                            </button>
                            <button 
                              onClick={() => setMode('phone')} 
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted/40 border border-border rounded-2xl text-sm font-semibold text-foreground hover:bg-muted transition disabled:opacity-50"
                            >
                              <Icon name="smartphone" size={18} /> Phone
                            </button>
                          </div>
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
                              className="w-full border-input bg-gray-100 text-gray-900 px-4 py-3 text-sm font-medium focus:outline-none transition-all"
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
                                className="w-full border-input bg-gray-100 text-gray-900 px-4 py-3 pr-11 text-sm font-medium focus:outline-none transition-all"
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
                ) : onboardingStep === 1 && mode === 'phone' ? (
                  <div className="mt-5">
                    {!confirmationResult ? (
                      <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            placeholder="+1 555-555-5555"
                            className="w-full border-input px-4 py-3 text-sm font-medium focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div id="recaptcha-container"></div>
                        {error && (
                          <div className="p-3.5 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground mt-2 disabled:opacity-50"
                        >
                          {isLoading ? 'Sending SMS...' : 'Send SMS Code'} <Icon name="arrow_forward" size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('signin')}
                          className="w-full py-3 mt-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
                        >
                          Back to Email Login
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">6-Digit Code</label>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            placeholder="123456"
                            className="w-full border-input px-4 py-3 text-sm font-medium focus:outline-none transition-all tracking-widest text-center"
                            maxLength={6}
                            required
                          />
                        </div>
                        {error && (
                          <div className="p-3.5 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground mt-2 disabled:opacity-50"
                        >
                          {isLoading ? 'Verifying...' : 'Verify & Continue'} <Icon name="check" size={18} />
                        </button>
                      </form>
                    )}
                  </div>
                ) : onboardingStep === 2 ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    await updateProfileData(firebaseUser.uid, fullName, companyName);
                    setIsLoading(false);
                    setOnboardingStep(3);
                  }} className="space-y-3.5 mt-5">
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
                      {isLoading ? 'Saving...' : 'Complete Profile'} <Icon name="arrow_forward" size={18} />
                    </button>
                  </form>
                ) : onboardingStep === 3 ? (
                  <div className="mt-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Icon name="shield" size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">Connect Google Drive</h3>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      HR Pulse requires access to your Google Drive to store company data securely.
                    </p>
                    {error && (
                      <div className="p-3.5 mb-4 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {error}
                      </div>
                    )}
                    <button 
                      onClick={triggerDriveOAuth} 
                      disabled={isLoading} 
                      className="w-full py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 bg-primary text-primary-foreground mt-2 disabled:opacity-50"
                    >
                      {isLoading ? 'Connecting...' : 'Authorize & Connect'} <Icon name="cloud" size={18} />
                    </button>
                  </div>
                ) : null}

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

      {/* Footer */}
      <FooterSection themeMode={themeMode} logoSrc={hrPulseLogo} />

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
