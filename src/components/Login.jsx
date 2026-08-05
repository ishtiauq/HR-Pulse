import React, { useState, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useMotionValue, useMotionTemplate } from 'framer-motion'
import Icon from "@/components/ui/Icon.jsx"
import hrPulseLogo from '../Assets/Kormiis Logo Final.svg'
import heroCharacters from '../Assets/hero-characters.png'
import { fetchUserProfile } from '../services/googleDrive.js'
import { verifyPassword, hashPassword } from '../services/crypto.js'
import { loginWithGoogle, loginWithEmail, registerWithEmail, checkAndCreateUserDoc, updateProfileData, updateDriveConnectionStatus, setupRecaptcha, requestPhoneOtp, verifyPhoneOtp } from '../services/auth.js'
import Dashboard from './Dashboard.jsx'
import { allNavItems } from '../utils/helpers.js'
import painStripIllustration from '../Assets/pain-strip.png'
import threeStepsIllustration from '../Assets/three-steps.png'
import faqIllustration from '../Assets/faq-illustration.png'
import card1Illustration from '../Assets/card-1.png'
import card2Illustration from '../Assets/card-2.png'
import card3Illustration from '../Assets/card-3.png'

const ADMIN_ACCOUNTS_KEY = 'hr_pulse_admin_accounts'

const MARKETING_PILLARS = [
  {
    icon: 'groups',
    title: 'Attendance that pays itself',
    desc: 'One-tap clock-in flows straight into automated payroll — no re-typing, no errors.'
  },
  {
    icon: 'account_balance_wallet',
    title: 'Every taka, tracked',
    desc: 'Salaries, expenses & company assets in real-time view, all in one place.'
  },
  {
    icon: 'forum',
    title: 'Teamwork without the chaos',
    desc: 'Announcements, events, tasks & documents — one home for the whole squad.'
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
      title: "Smart Attendance Tracking",
      subtitle: "Clock in effortlessly with a single tap. Live attendance data flows straight into automated payroll.",
      bgColor: "bg-white text-black",
      iconColor: "bg-black/5 text-black",
      iconName: "touch_app",
      content: (
        <ul className="flex flex-col gap-2 w-full mt-2">
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-[#FE4D01]" /> Quick tap to clock in & out</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-[#FE4D01]" /> Live location and time tracking</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-[#FE4D01]" /> No manual entry for payroll</li>
        </ul>
      )
    },
    {
      title: "Built-in Task Management",
      subtitle: "Assign tasks, track progress in real-time, and hit your deadlines without switching to another app.",
      bgColor: "bg-[#FE4D01] text-white",
      iconColor: "bg-black/10 text-white",
      iconName: "task_alt",
      content: (
        <ul className="flex flex-col gap-2 w-full mt-2">
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-90"><Icon name="check_circle" size={18} className="text-white/60" /> Assign tasks to team members instantly</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-90"><Icon name="check_circle" size={18} className="text-white/60" /> Track who is doing what in real-time</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-90"><Icon name="check_circle" size={18} className="text-white/60" /> Set clear deadlines & get reminders</li>
        </ul>
      )
    },
    {
      title: "Smart Leave Management",
      subtitle: "Request time off, get instant approvals, and track leave balances without the email chaos.",
      bgColor: "bg-black text-white",
      iconColor: "bg-white/10 text-white",
      iconName: "event_available",
      content: (
        <ul className="flex flex-col gap-2 w-full mt-2">
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-white/50" /> Request time off from your phone</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-white/50" /> Managers can approve with one click</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-white/50" /> Track your remaining leave balance</li>
        </ul>
      )
    },
    {
      title: "Works on any device",
      subtitle: "Desktop, tablet, or mobile — Kormiis adapts to wherever you work.",
      bgColor: "bg-white text-black",
      iconColor: "bg-black/5 text-black",
      iconName: "devices",
      content: (
        <ul className="flex flex-col gap-2 w-full mt-2">
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-[#FE4D01]" /> Perfect for remote and office teams</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-[#FE4D01]" /> Nothing to install, just open your browser</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-[#FE4D01]" /> Always synced across all your devices</li>
        </ul>
      )
    },
    {
      title: "Your drive, Your Rules",
      subtitle: "Everything is stored in your secure Google Drive. We don't lock you in.",
      bgColor: "bg-[#FE4D01] text-white",
      iconColor: "bg-black/10 text-white",
      iconName: "cloud_done",
      content: (
        <ul className="flex flex-col gap-2 w-full mt-2">
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-90"><Icon name="check_circle" size={18} className="text-white/60" /> Files are saved straight to your Google Drive</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-90"><Icon name="check_circle" size={18} className="text-white/60" /> You own your company data, not us</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-90"><Icon name="check_circle" size={18} className="text-white/60" /> Backed by bank-level Google security</li>
        </ul>
      )
    },
    {
      title: "Zero Fees",
      subtitle: "No per-seat licenses. Kormiis is completely free to use.",
      bgColor: "bg-black text-white",
      iconColor: "bg-white/10 text-white",
      iconName: "money_off",
      content: (
        <ul className="flex flex-col gap-2 w-full mt-2">
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-white/50" /> 100% free for your entire team</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-white/50" /> No sneaky per-user license fees</li>
          <li className="flex items-center gap-2 text-sm sm:text-base font-semibold opacity-80"><Icon name="check_circle" size={18} className="text-white/50" /> Premium features without the premium price</li>
        </ul>
      )
    }
  ]

  const card2Y = useTransform(scrollYProgress, [0, 0.33], [2000, 40])
  const card3Y = useTransform(scrollYProgress, [0.33, 0.66], [2000, 80])

  return (
    <section ref={sectionRef} className="relative w-full lg:h-[300vh] lg:snap-start py-12 lg:py-0">
      <div className="lg:sticky lg:top-0 lg:h-dvh w-full flex flex-col justify-center lg:overflow-hidden px-4 sm:px-8 snap-start lg:snap-align-none shrink-0">
        <div className="w-full text-left mb-8 sm:mb-10 z-20 pt-8 lg:pt-0">
          <h2 className="text-[clamp(2.5rem,6vw+0.5rem,6rem)] leading-[1.1] font-black tracking-tight mb-4 text-foreground">
            Why Choose <span className="text-[#FE4D01]">Kormiis?</span>
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground font-medium max-w-3xl mb-8">
            Everything a growing team needs — without the enterprise price tag or the setup headache.
          </p>

        </div>

        {/* DESKTOP GRID (Hidden on mobile) */}
        <div className="hidden lg:grid w-full h-[40vh] md:h-[45vh] min-h-[300px] grid-cols-2 gap-12 perspective-[2000px]">
          {/* Left Column Stack */}
          <div className="relative w-full h-full flex justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i}
                style={{ y: i === 0 ? "0px" : i === 1 ? card2Y : card3Y }}
                className={`absolute top-0 w-full h-full p-6 sm:p-8 rounded-[2rem] shadow-sm flex flex-col origin-top overflow-hidden ${cards[i].bgColor}`}
              >
                <div className="flex items-center gap-4 mb-4 sm:mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center ${cards[i].iconColor}`}>
                    <Icon name={cards[i].iconName} size={24} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">{cards[i].title}</h3>
                </div>
                <div className="flex flex-col gap-4 flex-1 w-full">
                  <div className="w-full">
                    <p className="text-base sm:text-lg opacity-90 leading-relaxed">{cards[i].subtitle}</p>
                  </div>
                  <div className="w-full flex items-start justify-start mt-2">
                    {cards[i].content}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column Stack */}
          <div className="relative w-full h-full flex justify-center">
            {[3, 4, 5].map((i) => (
              <motion.div 
                key={i}
                style={{ y: i === 3 ? "0px" : i === 4 ? card2Y : card3Y }}
                className={`absolute top-0 w-full h-full p-6 sm:p-8 rounded-[2rem] shadow-sm flex flex-col origin-top overflow-hidden ${cards[i].bgColor}`}
              >
                <div className="flex items-center gap-4 mb-4 sm:mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex shrink-0 items-center justify-center ${cards[i].iconColor}`}>
                    <Icon name={cards[i].iconName} size={24} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">{cards[i].title}</h3>
                </div>
                <div className="flex flex-col gap-4 flex-1 w-full">
                  <div className="w-full">
                    <p className="text-base sm:text-lg opacity-90 leading-relaxed">{cards[i].subtitle}</p>
                  </div>
                  <div className="w-full flex items-start justify-start mt-2">
                    {cards[i].content}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* MOBILE LIST (Hidden on desktop) */}
        <div className="flex lg:hidden w-full flex-col gap-6 mt-6 pb-12">
          {cards.map((card, i) => (
            <div 
              key={i} 
              className={`w-full p-6 sm:p-8 rounded-[1.5rem] shadow-sm border border-black/5 flex flex-col snap-center shrink-0 ${card.bgColor}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex shrink-0 items-center justify-center ${card.iconColor}`}>
                  <Icon name={card.iconName} size={24} />
                </div>
                <h3 className="text-xl font-black">{card.title}</h3>
              </div>
              <div className="flex flex-col gap-3 w-full flex-1">
                <p className="text-sm sm:text-base opacity-90 leading-relaxed">{card.subtitle}</p>
                <div className="w-full flex items-start justify-start flex-1 mt-2">
                  {card.content}
                </div>
              </div>
            </div>
          ))}
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
              Free for growing teams, no subscriptions or hidden fees. Your data stays securely encrypted in your own Google Drive.
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
    q: 'Can Kormiis read my company data?',
    a: 'No — encrypted in a private app-data folder in your own Google Drive; only you and your team decide access.',
  },
  {
    q: "What's the catch if it's free?",
    a: 'No catch — free for a limited time for growing teams; no subscriptions, no card.',
  },
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
    <section className="min-h-dvh w-full flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start bg-black">
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-center mb-12"
      >
        Frequently asked questions
      </motion.h2>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          className="w-full lg:w-1/3 max-w-sm mx-auto order-last lg:order-first"
        >
          <img src={faqIllustration} alt="FAQ" className="w-full h-auto object-contain rounded-2xl drop-shadow-sm transition-all duration-300" />
        </motion.div>

        <div className="w-full lg:w-2/3 grid grid-cols-1 gap-3 sm:gap-4">
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
      {/* Top Logo Section */}
      <div className="max-w-7xl mx-auto w-full flex justify-center sm:justify-start pb-8 border-b border-border mb-8">
        <img 
          src={logoSrc} 
          alt="Kormiis Logo" 
          className={`block h-16 sm:h-20 lg:h-24 w-auto object-contain object-left shrink-0 ${themeMode === 'dark' ? 'invert' : ''}`} 
        />
      </div>

      {/* Rest of Elements */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        <div className="flex flex-col gap-4 max-w-sm">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Kormiis is the free all-in-one HR, Payroll & team management platform that lives in your own Google Drive. Empowering teams to win.
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


  // Topbar visible only at the very top on all devices.
  // Hides the instant you start scrolling, shows again when back at the top.
  const [showTopbar, setShowTopbar] = useState(true)
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
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
        style={{ transform: !showTopbar ? 'translateY(-100%)' : 'translateY(0%)', transition: 'transform 300ms ease' }}
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

        {/* What is Kormiis - Merged Section (Grid) */}
        <section className="relative z-10 w-full min-h-[50vh] sm:min-h-[70vh] flex flex-col items-center justify-center bg-background px-4 py-12 sm:py-24 snap-start border-t border-border overflow-hidden">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-2 gap-4 sm:gap-8 lg:gap-12 items-stretch">
            
            {/* Left Column: Text Content */}
            <div className="flex flex-col justify-center gap-4 sm:gap-6 lg:gap-8 text-left w-full mx-0">
              <motion.h2 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl sm:text-4xl lg:text-7xl font-black text-foreground tracking-tight leading-tight mt-0"
              >
                What is <br className="hidden lg:block" /><span className="text-primary">Kormiis</span>?
              </motion.h2>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-base md:text-xl lg:text-2xl font-medium text-muted-foreground leading-snug sm:leading-relaxed space-y-2 sm:space-y-4 lg:space-y-6"
              >
                <p>
                  Kormiis is the <strong className="text-foreground">anti-enterprise</strong> HR Management Web App. Just everything your growing team needs.
                </p>
                <p>
                  No setup fees. No per-user licenses. No 3-month onboarding or subscription fee!
                </p>
                <p className="text-foreground font-semibold">
                  One central hub for your entire business. Secured automatically in your company Google Drive.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.8 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="pt-2"
              >
                <span className="text-white font-black tracking-wide uppercase text-[10px] sm:text-xs lg:text-base inline-block px-3 py-1.5 sm:px-6 sm:py-3 bg-[#FE4D01] rounded-full shadow-md whitespace-nowrap">
                  Free for limited time.
                </span>
              </motion.div>
            </div>

            {/* Right Column: Slot Machine */}
            <div className="relative w-full h-auto min-h-0">
              <div className="absolute inset-0 w-full h-full flex justify-center gap-2 sm:gap-4 lg:gap-8 overflow-hidden rounded-xl sm:rounded-3xl">
                {/* Gradient masks for smooth fade in/out at top and bottom */}
                <div className="absolute inset-x-0 top-0 h-12 sm:h-24 lg:h-32 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none"></div>
                <div className="absolute inset-x-0 bottom-0 h-12 sm:h-24 lg:h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none"></div>

                {/* Reel 1 (Scrolls Up, Always Visible) */}
                <div 
                  className="flex flex-col gap-2 sm:gap-4 lg:gap-6 pb-2 sm:pb-4 lg:pb-6 relative z-10 will-change-transform w-full sm:w-auto items-center animate-slot-up shrink-0 h-max"
                >
                  {[...Array(8)].flatMap(() => [
                    { label: "Attendance", icon: "schedule", color: "text-blue-500" },
                    { label: "Payroll", icon: "account_balance", color: "text-emerald-500" },
                    { label: "Expenses", icon: "wallet", color: "text-orange-500" },
                    { label: "Leave", icon: "calendar_month", color: "text-pink-500" },
                  ]).map((item, i) => (
                    <div key={`col1-${i}`} className="flex items-center justify-start gap-2 lg:gap-4 p-2 sm:p-3 lg:p-5 bg-card/50 backdrop-blur-md border border-border rounded-lg lg:rounded-2xl shadow-sm w-[130px] sm:w-32 lg:w-64 shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-md lg:rounded-xl bg-background border border-border flex items-center justify-center shadow-inner shrink-0">
                        <Icon name={item.icon} size={20} className={`${item.color} scale-75 sm:scale-100`} />
                      </div>
                      <span className="block font-bold text-foreground text-[11px] sm:text-xs lg:text-base whitespace-nowrap truncate">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Reel 2 (Scrolls Down, Hidden on Mobile) */}
                <div 
                  className="hidden sm:flex flex-col gap-2 sm:gap-4 lg:gap-6 pb-2 sm:pb-4 lg:pb-6 relative z-10 will-change-transform animate-slot-down shrink-0 h-max"
                >
                  {[...Array(8)].flatMap(() => [
                    { label: "Assets", icon: "monitor", color: "text-purple-500" },
                    { label: "Documents", icon: "folder_open", color: "text-amber-500" },
                    { label: "Tasks", icon: "check_box", color: "text-teal-500" },
                    { label: "Feed", icon: "rss_feed", color: "text-indigo-500" },
                  ]).map((item, i) => (
                    <div key={`col2-${i}`} className="flex items-center justify-center sm:justify-start gap-2 lg:gap-4 p-2 sm:p-3 lg:p-5 bg-card/50 backdrop-blur-md border border-border rounded-lg lg:rounded-2xl shadow-sm w-12 sm:w-32 lg:w-64 shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-md lg:rounded-xl bg-background border border-border flex items-center justify-center shadow-inner shrink-0">
                        <Icon name={item.icon} size={20} className={`${item.color} scale-75 sm:scale-100`} />
                      </div>
                      <span className="block font-bold text-foreground text-[11px] sm:text-xs lg:text-base whitespace-nowrap truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* New Comparison Section (Old Way vs Kormiis) */}
        <section className="relative z-10 w-full py-16 sm:py-24 bg-background border-y border-border snap-start flex flex-col items-center justify-center min-h-[50vh] overflow-hidden">
          <div className="w-full text-center mb-12 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Say Goodbye to <span className="text-red-500">Manual Work</span>.
            </h2>
            <p className="text-muted-foreground mt-4 text-lg sm:text-xl font-medium">
              See why growing teams are making the switch to Kormiis.
            </p>
          </div>

          {/* Chaos vs Control Comparison Table */}
          <div className="max-w-4xl mx-auto w-full px-4 relative z-20">
            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-2 border-b border-border">
                <div className="p-6 sm:p-8 bg-red-500/5 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 shadow-sm">
                    <Icon name="warning" size={24} />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-foreground">The Old Way</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">Chaos & scattered tools</p>
                </div>
                <div className="p-6 sm:p-8 bg-[#FE4D01] text-white text-center border-l border-[#FE4D01]/20 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 opacity-50"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white mb-4 shadow-sm">
                      <Icon name="check_circle" size={24} />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-white">The Kormiis Way</h3>
                    <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">Everything in one place</p>
                  </div>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
                {/* Row 1 */}
                <div className="grid grid-cols-2 group">
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-red-500/5 group-hover:bg-red-500/10 transition-colors">
                    <Icon name="close" size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium opacity-80 leading-snug">Buddy punching & tracking attendance in WhatsApp</span>
                  </div>
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-[#FE4D01] group-hover:brightness-95 transition-all border-l border-[#FE4D01]/20 relative">
                    <Icon name="check" size={20} className="text-white shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium text-white/95 leading-snug">One-tap smart attendance with live GPS locations</span>
                  </div>
                </div>
                
                {/* Row 2 */}
                <div className="grid grid-cols-2 group">
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-red-500/5 group-hover:bg-red-500/10 transition-colors">
                    <Icon name="close" size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium opacity-80 leading-snug">Weekends wasted re-typing paper sheets into Excel</span>
                  </div>
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-[#FE4D01] group-hover:brightness-95 transition-all border-l border-[#FE4D01]/20 relative">
                    <Icon name="check" size={20} className="text-white shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium text-white/95 leading-snug">Automated payroll math that exports instantly</span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 group">
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-red-500/5 group-hover:bg-red-500/10 transition-colors">
                    <Icon name="close" size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium opacity-80 leading-snug">Leave requests in emails & lost expense receipts</span>
                  </div>
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-[#FE4D01] group-hover:brightness-95 transition-all border-l border-[#FE4D01]/20 relative">
                    <Icon name="check" size={20} className="text-white shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium text-white/95 leading-snug">Everything secured directly in your company Google Drive</span>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-2 group">
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-red-500/5 group-hover:bg-red-500/10 transition-colors">
                    <Icon name="close" size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-medium opacity-80 leading-snug">Expensive $10/user monthly enterprise software fees</span>
                  </div>
                  <div className="p-5 sm:p-6 flex items-start gap-3 sm:gap-4 bg-[#FE4D01] group-hover:brightness-95 transition-all border-l border-[#FE4D01]/20 relative">
                    <Icon name="star" size={20} className="text-white shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base font-bold text-white leading-snug">100% Free forever. No sneaky per-seat fees.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 & 3: Marketing Highlights (Stacked with Blur Transition) */}
        <MarketingStackedSections containerRef={containerRef} />
      </div>



      {/* Section 7: Auth Modal */}
      <section id="auth-section" className="relative h-dvh w-full flex flex-col items-center justify-center px-4 pb-8 sm:pb-0 snap-start overflow-hidden bg-black text-white">
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
