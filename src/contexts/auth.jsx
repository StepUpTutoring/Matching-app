import React from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { loginWithGoogle, logout } from '../services/firebase'

const AuthContext = React.createContext()

const AuthProvider = (props) => {
  const [user, setUser] = React.useState(null)

  const login = async () => {
    const user = await loginWithGoogle()
    if (!user) {
      // TODO: Handle failed login
    }

    setUser(user)
  }

  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setUser(user)
    } else {
      setUser(null)
    }
  })

  const value = { user, login, logout }

  return <AuthContext.Provider value={value} {...props} />
}

export { AuthContext, AuthProvider }