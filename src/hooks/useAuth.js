import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kormiis_user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (userInfo) => {
    setUser(userInfo)
    localStorage.setItem('kormiis_user', JSON.stringify(userInfo))
    if (!userInfo.isEmployee && userInfo.token) {
      localStorage.setItem('kormiis_hr_token', userInfo.token)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('kormiis_user')
    // Deliberately keep kormiis_hr_token in localStorage so employees can still log in on this device
    // even if the admin logs out, effectively turning the device into a kiosk.
  }

  return { user, setUser, handleLogin, handleLogout }
}
