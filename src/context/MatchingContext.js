import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useStudents } from '../hooks/useStudents';
import { useTutors } from '../hooks/useTutors';
import { useMatchingAlgorithm } from '../hooks/useMatchingAlgorithm';

const MatchingContext = createContext();

export const useMatchingContext = () => useContext(MatchingContext);

export const MatchingProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    language: true,
    liveScan: true,
    waitingTimeWeight: 0.2,
    minOverlapThreshold: 2
  });

  const { students, isLoadingStudents, studentError, updateStudent } = useStudents();
  const { tutors, isLoadingTutors, tutorError, updateTutor } = useTutors();

  const [unmatchedStudents, setUnmatchedStudents] = useState([]);
  const [unmatchedTutors, setUnmatchedTutors] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    setUnmatchedStudents(students);
    setUnmatchedTutors(tutors);
  }, [students, tutors]);

  const { runMatching: algorithmRunMatching, addMatch: algorithmAddMatch, removeMatch: algorithmRemoveMatch } = useMatchingAlgorithm(students, tutors, filters);

  const runMatching = useCallback(() => {
    const { matches: newMatches, unmatchedStudents: newUnmatchedStudents, unmatchedTutors: newUnmatchedTutors } = algorithmRunMatching();
    setMatches(newMatches);
    setUnmatchedStudents(newUnmatchedStudents);
    setUnmatchedTutors(newUnmatchedTutors);
    console.log('newMatches', newMatches)
  }, [algorithmRunMatching]);

  const addMatch = useCallback((student, tutor) => {
    const newMatch = algorithmAddMatch(student, tutor);
    setMatches(prevMatches => [...prevMatches, newMatch]);
    setUnmatchedStudents(prevStudents => prevStudents.filter(s => s.id !== student.id));
    setUnmatchedTutors(prevTutors => prevTutors.filter(t => t.id !== tutor.id));
    return newMatch;
  }, [algorithmAddMatch]);

  const removeMatch = useCallback((match) => {
    algorithmRemoveMatch(match);
    setMatches(prevMatches => prevMatches.filter(m => m !== match));
    setUnmatchedStudents(prevStudents => [...prevStudents, match.student]);
    setUnmatchedTutors(prevTutors => [...prevTutors, match.tutor]);
  }, [algorithmRemoveMatch]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const value = {
    filters,
    handleFilterChange,
    students,
    tutors,
    matches,
    unmatchedStudents,
    unmatchedTutors,
    isLoadingStudents,
    isLoadingTutors,
    studentError,
    tutorError,
    updateStudent,
    updateTutor,
    runMatching,
    addMatch,
    removeMatch
  };

  return (
    <MatchingContext.Provider value={value}>
      {children}
    </MatchingContext.Provider>
  );
};