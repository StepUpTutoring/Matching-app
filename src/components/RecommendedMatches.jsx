import React, { useState, useMemo } from 'react';
import PersonTable from './PersonTable';
import { calculateDetailedOverlap, calculateMatrixValue } from '../utils/matchingUtils';

const RecommendedMatches = ({ 
  selectedPerson, 
  otherPersons, 
  type, 
  onSelect, 
  waitingTimeWeight,
  tQualityWeight,
  MIN_OVERLAP_THRESHOLD
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Memoize recommended matches calculation to prevent unnecessary recalculations
  const recommendedMatches = useMemo(() => {
    if (!selectedPerson || !otherPersons?.length) {
      return [];
    }

    return otherPersons
      .filter(other => other != null)
      .map(other => {
        const { overlappingDays, totalOverlapHours, overlappingSlots } = calculateDetailedOverlap(selectedPerson, other);
        return {
          person: other,
          overlappingDays,
          totalOverlapHours,
          overlappingSlots,
          matrixValue: calculateMatrixValue(selectedPerson, other, waitingTimeWeight, tQualityWeight)
        };
      })
      .filter(match => match.overlappingDays >= MIN_OVERLAP_THRESHOLD)
      .sort((a, b) => b.matrixValue - a.matrixValue)
      .slice(0, 3);
  }, [selectedPerson, otherPersons, waitingTimeWeight, tQualityWeight, MIN_OVERLAP_THRESHOLD]);

  if (!selectedPerson || recommendedMatches.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border rounded-md">
      <button
        className="w-full px-4 py-2 text-left font-bold bg-gray-100 hover:bg-gray-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        Recommended Matches ({recommendedMatches.length})
        <span className="float-right">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && recommendedMatches && (
        <PersonTable
          people={recommendedMatches.map(match => match.person)}
          type={type === 'student' ? 'tutor' : 'student'}
          onSelect={onSelect}
          selectedPerson={selectedPerson}
          otherSelectedPerson={selectedPerson}
          calculateDetailedOverlap={calculateDetailedOverlap}
          isRecommendedMatches={true}
          key={isOpen ? 'open' : 'closed'} // Force re-render when opened
        />
      )}
    </div>
  );
};

export default RecommendedMatches;
