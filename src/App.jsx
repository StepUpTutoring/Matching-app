import "preline/preline";
import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/auth.jsx'
import TutorStudentMatchingApp from './TutorStudentMatchingApp.jsx'
import Login from "./Login.jsx";

function App() {
  const location = useLocation()

  return (
    <AuthProvider>
      <div>
        <p>Current path: {location.pathname}</p>
        <Routes>
          <Route exact path="/login" name="Login Page" element={<Login />} />
          <Route path="*" name="Home" element={<TutorStudentMatchingApp />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App