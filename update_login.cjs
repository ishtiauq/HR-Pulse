const fs = require('fs');
let code = fs.readFileSync('src/components/Login.jsx', 'utf-8');

// 1. Imports
code = code.replace(
  /import \{ verifyPassword, hashPassword \} from '\.\.\/services\/crypto\.js'/,
  `import { verifyPassword, hashPassword } from '../services/crypto.js'
import { loginWithGoogle, loginWithEmail, registerWithEmail, checkAndCreateUserDoc, updateProfileData, updateDriveConnectionStatus, setupRecaptcha, requestPhoneOtp, verifyPhoneOtp } from '../services/auth.js'`
);

// 2. States
code = code.replace(
  /const \[mode, setMode\] = useState\('signin'\)/,
  `const [mode, setMode] = useState('signin')
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)`
);

// 3. Handlers
code = code.replace(
  /\/\/ --- Admin signup \(create workspace\) ---[\s\S]*?const handleEmployeeSubmit = async \(e\) => \{/m,
  `// --- Admin signup (Firebase) ---
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
  const handleEmployeeSubmit = async (e) => {`
);

// 4. UI update
code = code.replace(
  /\{mode === 'signup' \? \([\s\S]*?\{mode === 'signup' \? \(/m,
  `{onboardingStep === 1 && mode === 'signup' ? (
                  <>
                    <form onSubmit={handleSignup} className="space-y-3.5 mt-5">
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
                        {isLoading ? 'Creating Account...' : 'Continue'} <Icon name="arrow_forward" size={18} />
                      </button>
                    </form>
                  </>
                ) : onboardingStep === 1 && mode === 'signin' ? (
                  <>
                    <div className="flex p-1.5 bg-muted/60 rounded-full mb-4 mt-4 border border-border">
                      <button
                        onClick={() => setRole('admin')}
                        className={\`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 \${
                          role === 'admin'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }\`}
                      >
                        <Icon name="shield" size={16} /> Admin
                      </button>
                      <button
                        onClick={() => setRole('employee')}
                        className={\`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 \${
                          role === 'employee'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }\`}
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
                              <Icon name="cloud" size={18} /> Google
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
                      Kormiis requires access to your Google Drive to store company data securely.
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
                  {mode === 'signup' ? (`
);

fs.writeFileSync('src/components/Login.jsx', code);
