import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kormiis_user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (userInfo) => {
    setUser(userInfo)
    localStorage.setItem('kormiis_user', JSON.stringify(userInfo))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('kormiis_user')
  }

  return { user, setUser, handleLogin, handleLogout }
}
