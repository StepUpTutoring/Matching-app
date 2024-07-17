import React from 'react';

const FilterControls = ({ 
  filters, 
  toggleFilter, 
  minOverlapThreshold, 
  setMinOverlapThreshold, 
  waitingTimeWeight, 
  setWaitingTimeWeight, 
  handleRoll, 
  handleMatch, 
  isLoading, 
  matchesCount 
}) => {
  return (
    <div className="mb-4 flex flex-wrap justify-between items-center">
      <div className="flex flex-wrap space-x-4 items-center">
        <p>Match based on compatibility for...</p>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.language}
            onChange={() => toggleFilter('language')}
            className="form-checkbox h-5 w-5 text-teal-600"
          />
          <span className="ml-2 text-gray-700">Language</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.liveScan}
            onChange={() => toggleFilter('liveScan')}
            className="form-checkbox h-5 w-5 text-teal-600"
          />
          <span className="ml-2 text-gray-700">Livescan</span>
        </label>
        <div className="flex items-center">
          <span className="mr-2 text-gray-700">Min Days Overlap:</span>
          <input
            type="range"
            min="1"
            max="5"
            value={minOverlapThreshold}
            onChange={(e) => setMinOverlapThreshold(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="ml-2 text-gray-700">{minOverlapThreshold}</span>
        </div>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="mr-2 text-gray-700">Waiting Time Weight:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={waitingTimeWeight * 100}
            onChange={(e) => setWaitingTimeWeight(parseInt(e.target.value) / 100)}
            className="w-32"
          />
          <span className="ml-2 text-gray-700">{(waitingTimeWeight * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="flex space-x-4 mt-2 sm:mt-0">
        <button 
          onClick={handleRoll}
          className="px-4 py-2 text-white rounded bg-blue-600 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Rolling...' : 'Roll'}
        </button>
        <button 
          onClick={handleMatch}
          className={`px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors ${matchesCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={matchesCount === 0}
        >
          {matchesCount > 0 ? `Match (${matchesCount})` : 'Match'}
        </button>
      </div>
    </div>
  );
};

export default FilterControls;