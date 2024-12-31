import React from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { loginWithGoogle, logout } from '../services/firebase'

const AuthContext = React.createContext()

const AuthProvider = (props) => {
  const [user, setUser] = React.useState(null)

  const login = async () => {
    const user = await loginWithGoogle()
    if (user) {
      setUser(user)
    }
    // No need to handle failed login - it's already handled in loginWithGoogle
  }

  React.useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        setUser(null)
      }
    })
    
    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const value = { user, login, logout }

  return <AuthContext.Provider value={value} {...props} />
}

export { AuthContext, AuthProvider }
