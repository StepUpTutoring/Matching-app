import React, { useEffect } from 'react';
import TutorStudentMatchingApp from './TutorStudentMatchingApp';
import { useLocation } from 'react-router-dom';
import "preline/preline";

function App() {
  const location = useLocation();

  useEffect(() => {
    if (window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }, [location.pathname]);

  return (
    <div className="App">
      <TutorStudentMatchingApp />
    </div>
  );
}

export default App;