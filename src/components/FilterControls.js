import React from 'react';

const FilterControls = ({ filters, onFilterChange }) => {
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    onFilterChange({
      ...filters,
      [name]: type === 'checkbox' ? checked : type === 'range' ? parseFloat(value) : value,
    });
  };

  return (
    <div className="mb-4 flex flex-wrap justify-between items-center">
      <div className="flex flex-wrap space-x-4 items-center">
        <p>Match based on compatibility for...</p>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="language"
            checked={filters.language}
            onChange={handleInputChange}
            className="form-checkbox h-5 w-5 text-teal-600"
          />
          <span className="ml-2 text-gray-700">Language</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="liveScan"
            checked={filters.liveScan}
            onChange={handleInputChange}
            className="form-checkbox h-5 w-5 text-teal-600"
          />
          <span className="ml-2 text-gray-700">Livescan</span>
        </label>
        <div className="flex items-center">
          <span className="mr-2 text-gray-700">Min Overlap:</span>
          <input
            type="range"
            name="minOverlapThreshold"
            min="1"
            max="5"
            value={filters.minOverlapThreshold}
            onChange={handleInputChange}
            className="w-32"
          />
          <span className="ml-2 text-gray-700">{filters.minOverlapThreshold}</span>
        </div>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="mr-2 text-gray-700">Waiting Time Weight:</span>
          <input
            type="range"
            name="waitingTimeWeight"
            min="0"
            max="1"
            step="0.01"
            value={filters.waitingTimeWeight}
            onChange={handleInputChange}
            className="w-32"
          />
          <span className="ml-2 text-gray-700">{(filters.waitingTimeWeight * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;