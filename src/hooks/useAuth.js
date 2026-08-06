import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hr_pulse_user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (userInfo) => {
    setUser(userInfo)
    localStorage.setItem('hr_pulse_user', JSON.stringify(userInfo))
    if (!userInfo.isEmployee && userInfo.token) {
      localStorage.setItem('hr_pulse_hr_token', userInfo.token)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('hr_pulse_user')
    // Deliberately keep hr_pulse_hr_token in localStorage so employees can still log in on this device
    // even if the admin logs out, effectively turning the device into a kiosk.
  }

  return { user, setUser, handleLogin, handleLogout }
}
