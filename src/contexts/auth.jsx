import React from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { loginWithGoogle, loginWithPassword, logout } from '../services/firebase'

const AuthContext = React.createContext()

const AuthProvider = (props) => {
  const [user, setUser] = React.useState(null)

  const loginGoogle = async () => {
    const user = await loginWithGoogle()
    if (user) {
      setUser(user)
    }
  }

  const loginPassword = async (email, password) => {
    const user = await loginWithPassword(email, password)
    if (user) {
      setUser(user)
    }
    return user !== null
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

  const value = { user, loginGoogle, loginPassword, logout }

  return <AuthContext.Provider value={value} {...props} />
}

export { AuthContext, AuthProvider }
