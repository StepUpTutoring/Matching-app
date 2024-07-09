import { useCallback } from 'react';
import { calculateMatrixValue, calculateDetailedOverlap } from '../utils/overlapCalculations';
import { maxWeightAssign } from 'munkres-algorithm';

export const useMatchingAlgorithm = (students, tutors, filters) => {
  const runMatching = useCallback(() => {
    console.log("Running matching algorithm");
    console.log("Students:", students);
    console.log("Tutors:", tutors);
    console.log("Filters:", filters);

    const costMatrix = students.map(student => 
      tutors.map(tutor => {
        if ((filters.language && student.language !== tutor.language) ||
            (filters.liveScan && student.liveScan !== tutor.liveScan)) {
          return -Infinity;
        }
        return calculateMatrixValue(student, tutor, filters.waitingTimeWeight);
      })
    );

    console.log("Cost matrix:", costMatrix);

    const { assignments } = maxWeightAssign(costMatrix);

    console.log("Assignments:", assignments);

    const matches = [];
    const unmatchedStudents = [];
    const unmatchedTutors = new Set(tutors);

    assignments.forEach((tutorIndex, studentIndex) => {
      if (tutorIndex !== null) {
        const student = students[studentIndex];
        const tutor = tutors[tutorIndex];
        const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(student, tutor);
        console.log(`Checking match: ${student.name} - ${tutor.name}, Overlapping Days: ${overlappingDays}, Total Overlap Hours: ${totalOverlapHours}`);
        if (overlappingDays >= filters.minOverlapThreshold &&
            (!filters.language || student.language === tutor.language) &&
            (!filters.liveScan || student.liveScan === tutor.liveScan)) {
          matches.push({ student, tutor, overlap: overlappingDays, totalOverlapHours });
          unmatchedTutors.delete(tutor);
          console.log(`Match added: ${student.name} - ${tutor.name}`);
        } else {
          unmatchedStudents.push(student);
          console.log(`Insufficient overlap or filter mismatch for student ${student.name} and tutor ${tutor.name}`);
        }
      } else {
        unmatchedStudents.push(students[studentIndex]);
        console.log(`No match found for student ${students[studentIndex].name}`);
      }
    });

    console.log("Matches:", matches);
    console.log("Unmatched Students:", unmatchedStudents);
    console.log("Unmatched Tutors:", Array.from(unmatchedTutors));

    return {
      matches,
      unmatchedStudents,
      unmatchedTutors: Array.from(unmatchedTutors)
    };
  }, [students, tutors, filters]);

  const addMatch = useCallback((student, tutor) => {
    const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(student, tutor);
    console.log('Adding match:', { student, tutor, overlap: overlappingDays, totalOverlapHours });
    return { student, tutor, overlap: overlappingDays, totalOverlapHours };
  }, []);

  const removeMatch = useCallback((match) => {
    console.log('Removing match:', match);
  }, []);

  return { runMatching, addMatch, removeMatch };
};