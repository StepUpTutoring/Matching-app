import "preline/preline";
import React from 'react'
import { useLocation } from 'react-router-dom'
import TutorStudentMatchingApp from './TutorStudentMatchingApp.jsx'

function App() {
  const location = useLocation()

  console.log('Current path:', location.pathname)

  return (
    <div>
      <p>Current path: {location.pathname}</p>
      <TutorStudentMatchingApp />
    </div>
  )
}

export default App