import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "./hooks/useAuth";
import { maxWeightAssign } from "munkres-algorithm";
import { Navigate } from "react-router-dom";
import PersonTable from "./components/PersonTable";
import MatchesTable from "./components/MatchesTable";
import DetailsBar from "./components/DetailsBar";
import FilterControls from "./components/FilterControls";
import RecommendedMatches from "./components/RecommendedMatches";
import {
  calculateDetailedOverlap,
  calculateMatrixValue,
} from "./utils/matchingUtils";
import {
  fetchTutors,
  fetchStudents,
  subscribeTutors,
  subscribeStudents,
  createMatch,
} from "./services/firebase";

const TutorStudentMatchingApp = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  const [MIN_OVERLAP_THRESHOLD, setMIN_OVERLAP_THRESHOLD] = useState(2);
  const [waitingTimeWeight, setWaitingTimeWeight] = useState(0.2);
  const [tQualityWeight, setTQualityWeight] = useState(0);
  const [unmatchedStudents, setUnmatchedStudents] = useState([]);
  const [unmatchedTutors, setUnmatchedTutors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    language: true,
    liveScan: true,
  });
  const [tableFilters, setTableFilters] = useState({
    tutor: [],
    student: []
  });

  const applyTableFilters = React.useCallback((people, columnFilters) => {
    if (!columnFilters || columnFilters.length === 0) return people;

    return people.filter(person => {
      return columnFilters.every(filter => {
        const value = person[filter.id];
        if (!filter.value) return true;
        
        // Handle multi-select filters (like Status)
        if (Array.isArray(filter.value)) {
          return filter.value.includes(value);
        }
        
        // Handle text filters with case-insensitive contains
        if (typeof filter.value === 'string') {
          return value && String(value).toLowerCase().includes(filter.value.toLowerCase());
        }
        
        // Handle other filter types if needed
        return false;
      });
    });
  }, []);

  const handleTableFilterChange = React.useCallback((type, newFilters) => {
    setTableFilters(prev => ({
      ...prev,
      [type]: newFilters
    }));
  }, []);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatch, setLoadingMatch] = useState(null);

  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const toggleFilter = (filterName) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: !prevFilters[filterName],
    }));
  };

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
    });
  };

  // Effect for handling subscriptions and filtering
  useEffect(() => {
    let mounted = true;
    const tutorsRef = { current: [] };
    const studentsRef = { current: [] };
    
    const matchedTutorIds = new Set(matches.map((m) => m.tutor.id));
    const matchedStudentIds = new Set(matches.map((m) => m.student.id));

    const handleTutorUpdate = (newTutors) => {
      if (!mounted) return;
      try {
        tutorsRef.current = newTutors.filter((t) => !matchedTutorIds.has(t.id));
        const filtered = applyTableFilters(tutorsRef.current, tableFilters.tutor);
        setUnmatchedTutors(filtered);
      } catch (error) {
        console.error('Error updating tutors:', error);
      }
    };

    const handleStudentUpdate = (newStudents) => {
      if (!mounted) return;
      try {
        studentsRef.current = newStudents.filter((s) => !matchedStudentIds.has(s.id));
        const filtered = applyTableFilters(studentsRef.current, tableFilters.student);
        setUnmatchedStudents(filtered);
      } catch (error) {
        console.error('Error updating students:', error);
      }
    };

    let unsubscribeTutors;
    let unsubscribeStudents;

    const setupSubscriptions = async () => {
      try {
        unsubscribeTutors = subscribeTutors(handleTutorUpdate);
        unsubscribeStudents = subscribeStudents(handleStudentUpdate);
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
      }
    };

    setupSubscriptions();

    return () => {
      mounted = false;
      if (unsubscribeTutors) unsubscribeTutors();
      if (unsubscribeStudents) unsubscribeStudents();
    };
  }, [matches, tableFilters, applyTableFilters]);

  // Effect to reapply filters when they change
  useEffect(() => {
    if (tableFilters.tutor.length > 0) {
      const filtered = applyTableFilters(unmatchedTutors, tableFilters.tutor);
      setUnmatchedTutors(filtered);
    }
    if (tableFilters.student.length > 0) {
      const filtered = applyTableFilters(unmatchedStudents, tableFilters.student);
      setUnmatchedStudents(filtered);
    }
  }, [tableFilters, applyTableFilters]);

  const handleMatch = async (match) => {
    setLoadingMatch(`${match.student.id}-${match.tutor.id}`);
    try {
      console.log("Student Raw Record ID:", match.student.recordID);
      console.log("Tutor Raw Record ID:", match.tutor.recordID);
      
      if (!match.student.recordID || !match.tutor.recordID) {
        addLog("Error: Missing Raw Record ID for student or tutor");
        return;
      }

      const matchData = {
        tutorId: match.tutor.recordID,  // Use the tutor's Raw Record ID
        studentId: match.student.recordID,  // Use the student's Raw Record ID
        overlap: match.overlap,
        createdAt: new Date(),
        proposedTime: match.proposedTime || ''
      };
      
      console.log("Creating match with data:", JSON.stringify(matchData, null, 2));
      const matchId = await createMatch(matchData);
      addLog(`Match created with ID: ${matchId}`);

      // Remove from unmatched lists and matches array
      setUnmatchedTutors((prev) => prev.filter((t) => t.id !== match.tutor.id));
      setUnmatchedStudents((prev) => prev.filter((s) => s.id !== match.student.id));
      setMatches((prev) => prev.filter((m) => m !== match));
    } catch (error) {
      addLog(`Error creating match: ${error.message}`);
    } finally {
      setLoadingMatch(null);
    }
  };

  const handleRoll = () => {
    setIsLoading(true);
    setLogs([]);
    addLog("Generating new matches");

    try {
      console.log("\n=== Creating Cost Matrix ===");
      const costMatrix = unmatchedStudents.map((student) =>
        unmatchedTutors.map((tutor) => {
          if (!student || !tutor) return -Infinity;
          
          // Skip if either has empty availability
          if (!tutor.availability || tutor.availability.length === 0 || !student.availability || student.availability.length === 0) {
            return -Infinity;
          }

          if (
            (filters.language && student.language === 'Spanish' && tutor.language === 'English') ||
            (filters.liveScan && student.liveScan && !tutor.liveScan)
          ) {
            return -Infinity;
          }
          return calculateMatrixValue(
            student,
            tutor,
            waitingTimeWeight,
            tQualityWeight,
            MIN_OVERLAP_THRESHOLD
          );
        })
      );
      console.log("=== Cost Matrix Created ===\n");

      const { assignments } = maxWeightAssign(costMatrix);
      addLog("Assignments calculated");

      const newMatches = [];

      assignments.forEach((tutorIndex, studentIndex) => {
        if (tutorIndex !== null) {
          const student = unmatchedStudents[studentIndex];
          const tutor = unmatchedTutors[tutorIndex];
          if (!student || !tutor) {
            addLog(`Invalid match: student or tutor is undefined`);
            return;
          }
          const { overlappingDays, totalOverlapHours } =
            calculateDetailedOverlap(student, tutor);
          if (overlappingDays >= MIN_OVERLAP_THRESHOLD) {
            const { proposedMeetings } = calculateDetailedOverlap(student, tutor);
            const proposedTime = proposedMeetings.length > 0 
              ? `${proposedMeetings[0].day} ${proposedMeetings[0].time}, ${proposedMeetings[1].day} ${proposedMeetings[1].time}`
              : '';
            newMatches.push({
              student,
              tutor,
              overlap: overlappingDays,
              totalOverlapHours,
              proposedTime
            });
          } else {
            addLog(
              `Insufficient overlap or filter mismatch for student ${student.name} and tutor ${tutor.name}`
            );
          }
        } else {
          addLog(
            `No match found for student ${
              unmatchedStudents[studentIndex]?.name || "Unknown"
            }`
          );
        }
      });

      setMatches(newMatches);
      addLog("Matching process completed");
    } catch (error) {
      addLog(`Error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualMatch = () => {
    if (selectedStudent && selectedTutor) {
      // Check for empty availability
      if (!selectedTutor.availability || selectedTutor.availability.length === 0 || !selectedStudent.availability || selectedStudent.availability.length === 0) {
        addLog(`Cannot match: Empty availability - Student: ${selectedStudent.name}, Tutor: ${selectedTutor.name}`);
        return;
      }

      // Check Live Scan compatibility when filter is enabled
      if (filters.liveScan && !selectedTutor.liveScan && selectedStudent.liveScan) {
        addLog(`Cannot match: Tutor does not have Live Scan but student requires it`);
        return;
      }

      const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(
        selectedStudent,
        selectedTutor
      );

      const { proposedMeetings } = calculateDetailedOverlap(selectedStudent, selectedTutor);
      const proposedTime = proposedMeetings.length > 0 
        ? `${proposedMeetings[0].day} ${proposedMeetings[0].time}, ${proposedMeetings[1].day} ${proposedMeetings[1].time}`
        : '';

      const newMatch = {
        student: selectedStudent,
        tutor: selectedTutor,
        overlap: overlappingDays,
        totalOverlapHours,
        proposedTime
      };

      setMatches((prev) => [...prev, newMatch]);
      setUnmatchedStudents((prev) =>
        prev.filter((s) => s.id !== selectedStudent.id)
      );
      setUnmatchedTutors((prev) =>
        prev.filter((t) => t.id !== selectedTutor.id)
      );
      setSelectedStudent(null);
      setSelectedTutor(null);
    }
  };

  const handlePersonSelect = (person, type) => {
    if (type === "student") {
      setSelectedStudent(person);
    } else {
      setSelectedTutor(person);
    }
  };

  const handleUnpair = (match) => {
    setMatches((prev) => prev.filter((m) => m !== match));
    setUnmatchedStudents((prev) => [...prev, match.student]);
    setUnmatchedTutors((prev) => [...prev, match.tutor]);
    addLog(`Unpaired ${match.student.name} from ${match.tutor.name}`);
  };

  const handleMatchClick = (match) => {
    setSelectedStudent(match.student);
    setSelectedTutor(match.tutor);
    setSelectedProposedTime(match.proposedTime);
  };

  const [selectedProposedTime, setSelectedProposedTime] = useState(null);

  return (
    <div className="min-h-screen bg-teal-800 py-6 flex flex-col justify-center sm:py-6">
      <div className="relative py-2 sm:max-w-full sm:mx-auto">
        <div className="relative px-6 py-10 mx-8 bg-white shadow-lg sm:rounded-3xl sm:p-12">
          <div className="max-w-full mx-auto">
            <h1 className="text-2xl font-black text-gray-800 mb-10 text-left">
            Matchmaking Dashboard
            </h1>
            
            {/* Filters Card */}
            <div className="bg-gray-50 rounded-xl p-6 mb-10 shadow-sm">
              <FilterControls
              filters={filters}
              toggleFilter={toggleFilter}
              minOverlapThreshold={MIN_OVERLAP_THRESHOLD}
              setMinOverlapThreshold={setMIN_OVERLAP_THRESHOLD}
              waitingTimeWeight={waitingTimeWeight}
              setWaitingTimeWeight={setWaitingTimeWeight}
              tQualityWeight={tQualityWeight}
              setTQualityWeight={setTQualityWeight}
              handleRoll={handleRoll}
              handleMatch={() => {
                // Batch match all matches
                matches.forEach(match => handleMatch(match));
                // Clear matches array after all are processed
                setMatches([]);
              }}
              isLoading={isLoading}
              matchesCount={matches.length}
            />
            </div>

            {/* Students Card */}
            <div className="bg-white rounded-xl p-6 mb-10 shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-blue-100 text-blue-800 p-2 rounded-lg mr-3">Students</span>
              </h2>
              <PersonTable
                people={unmatchedStudents}
                type="student"
                onSelect={handlePersonSelect}
                selectedPerson={selectedStudent}
                otherSelectedPerson={selectedTutor}
                calculateDetailedOverlap={calculateDetailedOverlap}
                onFilterChange={handleTableFilterChange}
              />
            </div>
            {/* Tutors Card */}
            <div className="bg-white rounded-xl p-6 mb-10 shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-800 p-2 rounded-lg mr-3">Tutors</span>
              </h2>
              <PersonTable
                people={unmatchedTutors}
                type="tutor"
                onSelect={handlePersonSelect}
                selectedPerson={selectedTutor}
                otherSelectedPerson={selectedStudent}
                calculateDetailedOverlap={calculateDetailedOverlap}
                onFilterChange={handleTableFilterChange}
              />
            </div>

            {/* Matches Card */}
            {matches.length > 0 && (
              <div className="bg-white rounded-xl p-6 mb-10 shadow-md border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="bg-purple-100 text-purple-800 p-2 rounded-lg mr-3">Proposed Matches</span>
                </h2>
                <MatchesTable
                  matches={matches}
                  onUnpair={handleUnpair}
                  onOpenModal={handleMatchClick}
                  onMatch={handleMatch}
                  loadingMatch={loadingMatch}
                />
              </div>
            )}

            {/* Debug Logs Card */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Debug Logs</h2>
              <div className="bg-white rounded-lg border border-gray-200 max-w-full p-4 max-h-60 overflow-y-auto">
                {logs.map((log, index) => (
                  <pre key={index} className="text-xs text-gray-600">
                    {log}
                  </pre>
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
          setSelectedProposedTime(null);
        }}
        calculateDetailedOverlap={calculateDetailedOverlap}
        proposedTime={selectedProposedTime}
      >
        {selectedStudent && !selectedTutor && (
          <RecommendedMatches
            style={{ zIndex: 2000 }}
            selectedPerson={selectedStudent}
            otherPersons={selectedStudent.availability?.length > 0 ? 
              unmatchedTutors.filter(tutor => 
                tutor.availability?.length > 0 &&
                tutor.status !== "Matched"  &&
                !matches.some(match => match.tutor.id === tutor.id) &&
                !(filters.language && selectedStudent.language === 'Spanish' && tutor.language === 'English') &&
                !(filters.liveScan && selectedStudent.liveScan && !tutor.liveScan)
              ) : []
            }
            type="student"
            onSelect={handlePersonSelect}
            waitingTimeWeight={waitingTimeWeight}
            tQualityWeight={tQualityWeight}
            MIN_OVERLAP_THRESHOLD={MIN_OVERLAP_THRESHOLD}
          />
        )}
        {selectedTutor && !selectedStudent && (
          <RecommendedMatches
            style={{ zIndex: 10000 }}
            selectedPerson={selectedTutor}
            otherPersons={selectedTutor.availability?.length > 0 ? 
              unmatchedStudents.filter(student => 
                student.availability?.length > 0 &&
                !matches.some(match => match.student.id === student.id) &&
                !(filters.language && student.language === 'Spanish' && selectedTutor.language === 'English') &&
                !(filters.liveScan && student.liveScan && !selectedTutor.liveScan)
              ) : []
            }
            type="tutor"
            onSelect={handlePersonSelect}
            waitingTimeWeight={waitingTimeWeight}
            tQualityWeight={tQualityWeight}
            MIN_OVERLAP_THRESHOLD={MIN_OVERLAP_THRESHOLD}
          />
        )}
      </DetailsBar>
      {/* <button onClick={handleSignOut} className="absolute top-0 right-0 m-4 bg-red-500 text-white px-4 py-2 rounded-lg">Sign Out</button> */}
    </div>
  );
};

export default TutorStudentMatchingApp;
