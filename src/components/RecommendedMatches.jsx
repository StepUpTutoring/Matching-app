// src/components/RecommendedMatches.js

import React, { useState, useEffect } from 'react';
import PersonTable from './PersonTable';
import { calculateDetailedOverlap, calculateMatrixValue } from '../utils/matchingUtils';

const RecommendedMatches = ({ 
  selectedPerson, 
  otherPersons, 
  type, 
  onSelect, 
  waitingTimeWeight,
  MIN_OVERLAP_THRESHOLD
}) => {
  const [recommendedMatches, setRecommendedMatches] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedPerson && otherPersons.length > 0) {
      calculateRecommendedMatches();
    } else {
      setRecommendedMatches([]);
    }
  }, [selectedPerson, otherPersons, waitingTimeWeight, MIN_OVERLAP_THRESHOLD]);

  const calculateRecommendedMatches = () => {
    console.log('Calculating recommended matches for:', selectedPerson.name, 'Type:', type);
    const sorted = otherPersons
      .map(other => {
        const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(selectedPerson, other);
        return {
          person: other,
          overlappingDays,
          totalOverlapHours,
          matrixValue: calculateMatrixValue(selectedPerson, other, waitingTimeWeight)
        };
      })
      .filter(match => match.overlappingDays >= MIN_OVERLAP_THRESHOLD)
      .sort((a, b) => b.matrixValue - a.matrixValue)
      .slice(0, 3);
    
    console.log('Recommended matches:', sorted);
    setRecommendedMatches(sorted);
    setIsOpen(true);
  };

  if (recommendedMatches.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border rounded-md">
      <button
        className="w-full px-4 py-2 text-left font-bold bg-gray-100 hover:bg-gray-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        Recommended Matches
        <span className="float-right">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <PersonTable
          people={recommendedMatches.map(match => match.person)}
          type={type === 'student' ? 'tutor' : 'student'}
          onSelect={onSelect}
          selectedPerson={null}
          calculateDetailedOverlap={calculateDetailedOverlap}
          extraInfo={recommendedMatches}
        />
      )}
    </div>
  );
};

export default RecommendedMatches;