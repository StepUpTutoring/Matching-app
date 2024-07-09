import "preline/preline";
import React from 'react';
import { MatchingProvider } from './context/MatchingContext';
import MatchingInterface from './components/MatchingInterface';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <MatchingProvider>
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
          <div className="relative py-3 sm:max-w-full sm:mx-auto">
            <div className="relative px-4 py-10 mx-8 bg-white shadow-lg sm:rounded-3xl sm:p-20">
              <h1 className="text-3xl font-weight-1000 text-teal-600 font-semibold mb-8">Tutor-Student Matching</h1>
              <MatchingInterface />
            </div>
          </div>
        </div>
      </MatchingProvider>
    </ErrorBoundary>
  );
};

export default App;