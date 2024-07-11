import React, { useState, useEffect } from 'react';
import { maxWeightAssign } from 'munkres-algorithm';
import { Navigate } from 'react-router-dom';
import PersonTable from './components/PersonTable';
import MatchesTable from './components/MatchesTable';
import DetailsBar from './components/DetailsBar';
import FilterControls from './components/FilterControls';
import RecommendedMatches from './components/RecommendedMatches';
import { calculateDetailedOverlap, calculateMatrixValue } from './utils/matchingUtils';
import { fetchTutors, fetchStudents, subscribeTutors, subscribeStudents, createMatch } from './services/firebase';
import { useAuth } from './hooks/useAuth';

const TutorStudentMatchingApp = () => {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" />
  }
  const [MIN_OVERLAP_THRESHOLD, setMIN_OVERLAP_THRESHOLD] = useState(2);
  const [waitingTimeWeight, setWaitingTimeWeight] = useState(0.2);
  const [unmatchedStudents, setUnmatchedStudents] = useState([]);
  const [unmatchedTutors, setUnmatchedTutors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    language: true,
    liveScan: true,
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);

  const addLog = (message) => {
    setLogs(prevLogs => [...prevLogs, message]);
    console.log(message);
  };

  const toggleFilter = (filterName) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: !prevFilters[filterName]
    }));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [fetchedTutors, fetchedStudents] = await Promise.all([
          fetchTutors(),
          fetchStudents()
        ]);
        setUnmatchedTutors(fetchedTutors);
        setUnmatchedStudents(fetchedStudents);
        addLog("Data fetched successfully");
      } catch (error) {
        addLog(`Error fetching data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time listeners
    const unsubscribeTutors = subscribeTutors(newTutors => {
      setUnmatchedTutors(prev => {
        const matchedTutorIds = new Set(matches.map(m => m.tutor.id));
        return newTutors.filter(t => !matchedTutorIds.has(t.id));
      });
    });
    const unsubscribeStudents = subscribeStudents(newStudents => {
      setUnmatchedStudents(prev => {
        const matchedStudentIds = new Set(matches.map(m => m.student.id));
        return newStudents.filter(s => !matchedStudentIds.has(s.id));
      });
    });

    // Clean up listeners on component unmount
    return () => {
      unsubscribeTutors();
      unsubscribeStudents();
    };
  }, [matches]);

  const handleMatch = async (match) => {
    try {
      const matchData = {
        tutorId: match.tutor.id,
        studentId: match.student.id,
        overlap: match.overlap,
        createdAt: new Date()
      };
      const matchId = await createMatch(matchData);
      addLog(`Match created with ID: ${matchId}`);
      
      // Update local state
      setMatches(prev => [...prev, { ...match, id: matchId }]);
      setUnmatchedTutors(prev => prev.filter(t => t.id !== match.tutor.id));
      setUnmatchedStudents(prev => prev.filter(s => s.id !== match.student.id));
    } catch (error) {
      addLog(`Error creating match: ${error.message}`);
    }
  };

  const handleRoll = () => {
    setIsLoading(true);
    setLogs([]);
    addLog("Generating new matches");
    
    try {
      const costMatrix = unmatchedStudents.map(student => 
        unmatchedTutors.map(tutor => {
          if ((filters.language && student.language !== tutor.language) ||
              (filters.liveScan && student.liveScan !== tutor.liveScan)) {
            return -Infinity;
          }
          return calculateMatrixValue(student, tutor, waitingTimeWeight);
        })
      );
      addLog("Cost matrix created");

      const { assignments } = maxWeightAssign(costMatrix);
      addLog("Assignments calculated");

      const newMatches = [];

      assignments.forEach((tutorIndex, studentIndex) => {
        if (tutorIndex !== null) {
          const student = unmatchedStudents[studentIndex];
          const tutor = unmatchedTutors[tutorIndex];
          const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(student, tutor);
          if (overlappingDays >= MIN_OVERLAP_THRESHOLD &&
              (!filters.language || student.language === tutor.language) &&
              (!filters.liveScan || student.liveScan === tutor.liveScan)) {
            newMatches.push({ student, tutor, overlap: overlappingDays, totalOverlapHours });
          } else {
            addLog(`Insufficient overlap or filter mismatch for student ${student.name} and tutor ${tutor.name}`);
          }
        } else {
          addLog(`No match found for student ${unmatchedStudents[studentIndex].name}`);
        }
      });

      setMatches(newMatches);
      addLog("Matching process completed");
    } catch (error) {
      addLog(`Error occurred: ${error.message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (selectedStudent && selectedTutor) {
      const overlap = calculateDetailedOverlap(selectedStudent, selectedTutor).overlappingDays;
      const newMatch = { student: selectedStudent, tutor: selectedTutor, overlap };
      await handleMatch(newMatch);
      setSelectedStudent(null);
      setSelectedTutor(null);
    }
  };

  const handleUnpair = (match) => {
    setMatches(prev => prev.filter(m => m !== match));
    setUnmatchedStudents(prev => [...prev, match.student]);
    setUnmatchedTutors(prev => [...prev, match.tutor]);
    addLog(`Unpaired ${match.student.name} from ${match.tutor.name}`);
  };

  const handlePersonSelect = (person, type) => {
    if (type === 'student') {
      setSelectedStudent(person);
      setSelectedTutor(null);
    } else {
      setSelectedTutor(person);
      setSelectedStudent(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-full sm:mx-auto">
        <div className="relative px-4 py-10 mx-8 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-full mx-auto">
            <h1 className="text-3xl font-weight-1000 text-teal-600 font-semibold mb-8">Tutor-Student Matching</h1>
            <FilterControls 
              filters={filters}
              toggleFilter={toggleFilter}
              minOverlapThreshold={MIN_OVERLAP_THRESHOLD}
              setMinOverlapThreshold={setMIN_OVERLAP_THRESHOLD}
              waitingTimeWeight={waitingTimeWeight}
              setWaitingTimeWeight={setWaitingTimeWeight}
              handleRoll={handleRoll}
              handleMatch={() => {}} // This should be updated to handle batch matching if needed
              isLoading={isLoading}
              matchesCount={matches.length}
            />

            <div className="mb-8">
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Tutors waiting</h2>
              <PersonTable 
                people={unmatchedTutors}
                type="tutor"
                onSelect={handlePersonSelect}
                selectedPerson={selectedTutor}
                calculateDetailedOverlap={calculateDetailedOverlap}
              />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Students waiting</h2>
              <PersonTable 
                people={unmatchedStudents}
                type="student"
                onSelect={handlePersonSelect}
                selectedPerson={selectedStudent}
                calculateDetailedOverlap={calculateDetailedOverlap}
              />
            </div>

            {matches.length > 0 && (
              <MatchesTable 
                matches={matches}
                onUnpair={handleUnpair}
                onOpenModal={setSelectedMatch}
              />
            )}

            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">Debug Logs</h2>
              <div className="mt-2 bg-gray-50 rounded-md max-w-full p-4 max-h-60 overflow-y-auto">
                {logs.map((log, index) => (
                  <pre key={index} className="text-xs text-gray-600">{log}</pre>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DetailsBar 
        student={selectedStudent} 
        tutor={selectedTutor} 
        handleManualMatch={handleManualMatch}
        onClose={() => {
          setSelectedStudent(null);
          setSelectedTutor(null);
        }}
        calculateDetailedOverlap={calculateDetailedOverlap}
      >
        {selectedStudent && (
          <RecommendedMatches
            selectedPerson={selectedStudent}
            otherPersons={unmatchedTutors}
            type="student"
            onSelect={handlePersonSelect}
            waitingTimeWeight={waitingTimeWeight}
            MIN_OVERLAP_THRESHOLD={MIN_OVERLAP_THRESHOLD}
          />
        )}
        {selectedTutor && (
          <RecommendedMatches
            selectedPerson={selectedTutor}
            otherPersons={unmatchedStudents}
            type="tutor"
            onSelect={handlePersonSelect}
            waitingTimeWeight={waitingTimeWeight}
            MIN_OVERLAP_THRESHOLD={MIN_OVERLAP_THRESHOLD}
          />
        )}
      </DetailsBar>
    </div>
  );
};

export default TutorStudentMatchingApp;