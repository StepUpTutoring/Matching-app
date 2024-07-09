import React, { useState } from 'react';
import { useMatchingContext } from '../context/MatchingContext';
import FilterControls from './FilterControls';
import TutorTable from './TutorTable';
import StudentTable from './StudentTable';
import MatchesTable from './MatchesTable';
import DetailsBar from './DetailsBar';
import Notification from './Notification';
import LoadingSpinner from './LoadingSpinner';

const MatchingInterface = () => {
  const { 
    filters, 
    handleFilterChange, 
    unmatchedStudents, 
    unmatchedTutors, 
    matches, 
    runMatching, 
    addMatch, 
    removeMatch,
    isLoadingStudents,
    isLoadingTutors,
    studentError,
    tutorError
  } = useMatchingContext();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = async () => {
    setIsRolling(true);
    try {
      await runMatching();
      setNotification({ message: 'Matching algorithm executed', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Error executing matching algorithm', type: 'error' });
    } finally {
      setIsRolling(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSelectedMatch(null);
  };

  const handleSelectTutor = (tutor) => {
    setSelectedTutor(tutor);
    setSelectedMatch(null);
  };

  const handleViewMatchDetails = (match) => {
    setSelectedMatch(match);
    setSelectedStudent(null);
    setSelectedTutor(null);
  };

  const handleManualMatch = async () => {
    if (selectedStudent && selectedTutor) {
      try {
        await addMatch(selectedStudent, selectedTutor);
        setNotification({ message: 'Manual match created successfully', type: 'success' });
        setSelectedStudent(null);
        setSelectedTutor(null);
      } catch (error) {
        setNotification({ message: 'Error creating manual match', type: 'error' });
      }
    }
  };

  const handleUnpair = async (match) => {
    try {
      await removeMatch(match);
      setNotification({ message: 'Match removed successfully', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Error removing match', type: 'error' });
    }
  };

  const handleCloseDetailsBar = () => {
    setSelectedStudent(null);
    setSelectedTutor(null);
    setSelectedMatch(null);
  };

  if (isLoadingStudents || isLoadingTutors) {
    return <LoadingSpinner />;
  }

  if (studentError || tutorError) {
    return <div className="text-center py-4 text-red-500">Error: {studentError || tutorError}</div>;
  }

  return (
    <>
      <FilterControls filters={filters} onFilterChange={handleFilterChange} />
      <button 
        onClick={handleRoll} 
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4 disabled:opacity-50"
        disabled={isRolling}
      >
        {isRolling ? 'Rolling...' : 'Roll'}
      </button>
      {isRolling && <LoadingSpinner />}
      <TutorTable 
        tutors={unmatchedTutors} 
        selectedTutor={selectedTutor}
        onSelectTutor={handleSelectTutor}
      />
      <StudentTable 
        students={unmatchedStudents}
        selectedStudent={selectedStudent}
        onSelectStudent={handleSelectStudent}
      />
      <MatchesTable 
        matches={matches}
        onUnpair={handleUnpair}
        onViewDetails={handleViewMatchDetails}
      />
      {(selectedStudent || selectedTutor || selectedMatch) && (
        <DetailsBar 
          student={selectedStudent}
          tutor={selectedTutor}
          match={selectedMatch}
          onClose={handleCloseDetailsBar}
          handleManualMatch={handleManualMatch}
        />
      )}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </>
  );
};

export default MatchingInterface;