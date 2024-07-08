import React, { useState, useEffect } from 'react';
import { maxWeightAssign } from 'munkres-algorithm';

const Dropdown = ({ placeholder, options, onSelect, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(placeholder);

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {type === 'hiddenFields' ? "Hidden Fields" : "Filter By"}
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {options.map((option, index) => (
              type === 'hiddenFields' ? (
                <ToggleSwitch
                  key={index}
                  label={option}
                  isChecked={selected.includes(option)}
                  onToggle={() => handleSelect(option)}
                />
              ) : (
                <a
                  key={index}
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  role="menuitem"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleSwitch = ({ label, isChecked, onToggle }) => (
  <label className="flex items-center cursor-pointer">
    <div className="relative">
      <input type="checkbox" className="hidden" checked={isChecked} onChange={onToggle} />
      <div className={`toggle__line w-10 h-4 rounded-full shadow-inner ${isChecked ? 'bg-teal-600' : 'bg-gray-400'}`}></div>
      <div className={`toggle__dot absolute w-6 h-6 bg-white rounded-full shadow inset-y-[-4px] ${isChecked ? 'right-0' : 'left-0'}`}></div>
    </div>
    <div className="ml-3 text-gray-700 font-medium">
      {label}
    </div>
  </label>
);

const TutorStudentMatchingApp = () => {
  const generateMockData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const languages = ['English', 'Spanish'];
    
    const generateTimeRange = () => {
      const startHour = Math.floor(Math.random() * 12) + 8; // 8 AM to 7 PM
      const duration = Math.floor(Math.random() * 3) + 2; // 2 to 4 hours
      const endHour = Math.min(startHour + duration, 20); // Cap at 8 PM
      const minutes = Math.random() > 0.5? '30' : '00'
      return `${startHour}:${minutes}-${endHour}:${minutes}`;
    };
  
    const generateAvailability = () => {
      const availability = new Set();
      while (availability.size < AVAILABILITY_SLOTS) {
        const day = days[Math.floor(Math.random() * days.length)];
        const timeRange = generateTimeRange();
        availability.add(`${day} ${timeRange}`);
      }
      return Array.from(availability);
    };
  
    const generatePerson = (name) => ({
      id: `${name.toLowerCase().replace(' ', '_')}`,
      name: name,
      availability: generateAvailability(),
      language: languages[Math.floor(Math.random() * languages.length)],
      liveScan: Math.random() < 0.9,
      waitingDays: Math.floor(Math.random() * 30) // Random number of waiting days (0-29)
    });
    
    const studentNames = ["Daniel", "Alex", "Emma", "Olivia", "Ethan", "Sophia", "Liam", "Ava", "Joe", "Justin"];
    const tutorNames = ["Jack", "Sarah", "Michael", "Emily", "David", "Jessica", "Justice", "George", "Jane", "Haripriya"];
  
    return {
      students: studentNames.map(name => generatePerson(name)),
      tutors: tutorNames.map(name => generatePerson(name)),
    };
  };

  const [AVAILABILITY_SLOTS] = useState(5);
  const [MIN_OVERLAP_THRESHOLD, setMIN_OVERLAP_THRESHOLD] = useState(2);
  const [tutorFilterOptions] = useState(['All Tutors', 'Waiting 14+ days', 'Waiting 21+ days', 'Never been matched']);
  const [tutorHiddenFieldsOptions] = useState(['Email', 'Phone', 'Availability', 'Subjects', 'Rating']);
  const [studentFilterOptions] = useState(['All Students', 'Waiting 14+ days', 'Waiting 21+ days', 'Never been matched']);
  const [studentHiddenFieldsOptions] = useState(['Email', 'Grade Level', 'Subjects Needed', 'Parent Contact']);
  const [selectedTutorFilter, setSelectedTutorFilter] = useState('All Tutors');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('All Students');
  const [tutorVisibleFields, setTutorVisibleFields] = useState([]);
  const [studentVisibleFields, setStudentVisibleFields] = useState([]);
  const [mockData, setMockData] = useState(() => generateMockData());
  const [matches, setMatches] = useState([]);
  const [unmatchedStudents, setUnmatchedStudents] = useState(mockData.students);
  const [unmatchedTutors, setUnmatchedTutors] = useState(mockData.tutors);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    language: true,
    liveScan: true,
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isRecommendedMatchesOpen, setIsRecommendedMatchesOpen] = useState(false);
  

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

 // 4. Update the handleRoll function to use the new matrix calculation
const handleRoll = () => {
  setIsLoading(true);
  setLogs([]);
  addLog("Generating new mock data and matches");
  
  try {
    const costMatrix = mockData.students.map(student => 
      mockData.tutors.map(tutor => {
        if ((filters.language && student.language !== tutor.language) ||
            (filters.liveScan && student.liveScan !== tutor.liveScan)) {
          return -Infinity;
        }
        return calculateMatrixValue(student, tutor);
      })
    );
    addLog("Cost matrix created: " + JSON.stringify(costMatrix));

    const { assignments } = maxWeightAssign(costMatrix);
    addLog("Assignments calculated: " + JSON.stringify(assignments));

    const newMatches = [];
    const newUnmatchedStudents = [];
    const newUnmatchedTutors = new Set(mockData.tutors);

    assignments.forEach((tutorIndex, studentIndex) => {
      if (tutorIndex !== null) {
        const student = mockData.students[studentIndex];
        const tutor = mockData.tutors[tutorIndex];
        const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(student, tutor);
        if (overlappingDays >= MIN_OVERLAP_THRESHOLD &&
            (!filters.language || student.language === tutor.language) &&
            (!filters.liveScan || student.liveScan === tutor.liveScan)) {
          newMatches.push({ student, tutor, overlap: overlappingDays, totalOverlapHours });
          newUnmatchedTutors.delete(tutor);
        } else {
          newUnmatchedStudents.push(student);
          addLog(`Insufficient overlap or filter mismatch for student ${student.name} and tutor ${tutor.name}`);
        }
      } else {
        newUnmatchedStudents.push(mockData.students[studentIndex]);
        addLog(`No match found for student ${mockData.students[studentIndex].name}`);
      }
    });

    setMatches(newMatches);
    setUnmatchedStudents(newUnmatchedStudents);
    setUnmatchedTutors(Array.from(newUnmatchedTutors));

    addLog("Matching process completed");
    addLog("Matches: " + JSON.stringify(newMatches, null, 2));
  } catch (error) {
    addLog(`Error occurred: ${error.message}`);
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

  const handleMatch = () => {
    console.log("Match button clicked");
  };

  const handleManualMatch = () => {
    if (selectedStudent && selectedTutor) 
      {
      const overlap = calculateDetailedOverlap(selectedStudent, selectedTutor).overlappingDays;
      const newMatch = { student: selectedStudent, tutor: selectedTutor, overlap };
      setMatches([...matches, newMatch]);
      setUnmatchedStudents(unmatchedStudents.filter(s => s.id !== selectedStudent.id));
      setUnmatchedTutors(unmatchedTutors.filter(t => t.id !== selectedTutor.id));
      addLog(`Manually matched ${selectedStudent.name} with ${selectedTutor.name}`);
      setSelectedStudent(null);
      setSelectedTutor(null);
    }
  };

  const handleUnpair = (match) => {
    setMatches(matches.filter(m => m !== match));
    setUnmatchedStudents([...unmatchedStudents, match.student]);
    setUnmatchedTutors([...unmatchedTutors, match.tutor]);
    addLog(`Unpaired ${match.student.name} from ${match.tutor.name}`);
  };

  const handleDropdownSelect = (option) => {

  };

  const openModal = (match) => {
    setSelectedMatch(match);
  };

  const [recommendedMatches, setRecommendedMatches] = useState([]);

  const calculateRecommendedMatches = (person, type) => {
    console.log('Calculating recommended matches for:', person.name, 'Type:', type);
    const otherList = type === 'student' ? unmatchedTutors : unmatchedStudents;
    const sorted = otherList
      .map(other => {
        const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(
          type === 'student' ? person : other,
          type === 'student' ? other : person
        );
        return {
          person: other,
          overlappingDays,
          totalOverlapHours,
          matrixValue: calculateMatrixValue(
            type === 'student' ? person : other,
            type === 'student' ? other : person
          )
        };
      })
      .filter(match => match.overlappingDays >= MIN_OVERLAP_THRESHOLD)
      .sort((a, b) => b.matrixValue - a.matrixValue)
      .slice(0, 3);
    
    console.log('Recommended matches:', sorted);
    setRecommendedMatches(sorted);
  };

  const handlePersonSelect = (person, type) => {
    if (type === 'student') {
      setSelectedStudent(person); // This will be null if deselecting
      if (!person) {
        setRecommendedMatches([]); // Clear recommended matches on deselect
      } else if (!selectedTutor) {
        calculateRecommendedMatches(person, 'student');
      }
    } else {
      setSelectedTutor(person); // This will be null if deselecting
      if (!person) {
        setRecommendedMatches([]); // Clear recommended matches on deselect
      } else if (!selectedStudent) {
        calculateRecommendedMatches(person, 'tutor');
      }
    }
  };

  const calculateDetailedOverlap = (person1, person2) => {
    const overlappingSlots = [];
    let totalOverlapHours = 0;
    const overlappingDays = new Set();
  
    const parseTime = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
  
    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
  
    person1.availability.forEach(slot1 => {
      const [day1, timeRange1] = slot1.split(' ');
      const [start1, end1] = timeRange1.split('-').map(parseTime);
  
      person2.availability.forEach(slot2 => {
        const [day2, timeRange2] = slot2.split(' ');
        const [start2, end2] = timeRange2.split('-').map(parseTime);
  
        if (day1 === day2) {
          const overlapStart = Math.max(start1, start2);
          const overlapEnd = Math.min(end1, end2);
          const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
  
          if (overlapMinutes >= 60) {
            overlappingDays.add(day1);
            const overlapTimeRange = `${formatTime(overlapStart)}-${formatTime(overlapEnd)}`;
            overlappingSlots.push({ 
              day: day1, 
              time: overlapTimeRange, 
              overlap: overlapMinutes 
            });
            totalOverlapHours += overlapMinutes / 60;
          }
        }
      });
    });
  
    return { 
      overlappingSlots, 
      totalOverlapHours: Math.round(totalOverlapHours * 10) / 10,
      overlappingDays: overlappingDays.size
    };
  };

// Add a new state variable for the waiting time weight
const [waitingTimeWeight, setWaitingTimeWeight] = useState(0.2); // Default to 20%

// Update the calculateMatrixValue function to use the dynamic weight
const calculateMatrixValue = (person1, person2) => {
  const { overlappingDays, totalOverlapHours } = calculateDetailedOverlap(person1, person2);
  const remainingWeight = 1 - waitingTimeWeight;
  const daysScore = overlappingDays * (remainingWeight / 2);
  const hoursScore = (totalOverlapHours / 5) * (remainingWeight / 2);
  
  const maxWaitingDays = 30; // Assume 30 days is the maximum waiting time
  const waitingScore = ((person1.waitingDays + person2.waitingDays) / (2 * maxWaitingDays)) * waitingTimeWeight;
  console.log('days', daysScore, 'hours', hoursScore, 'waiting', waitingScore)
  return daysScore + hoursScore + waitingScore;
};

const PersonRow = ({ person, type, onSelect, isSelected, selectedStudent, selectedTutor, calculateDetailedOverlap }) => {
  const [overlapInfo, setOverlapInfo] = useState('');
  const selectedPerson = type === 'student' ? selectedTutor : selectedStudent;

  useEffect(() => {
    if (selectedPerson) {
      const { overlappingSlots, totalOverlapHours, overlappingDays } = calculateDetailedOverlap(person, selectedPerson);
      const overlapDetails = overlappingSlots.map(slot => 
        `${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`
      ).join(', ');
      setOverlapInfo(
      <>
        <div className={`text-xs font-bold mt-1`}>{`OVERLAP: ${overlappingDays} days, ${totalOverlapHours.toFixed(1)} hours`}</div>
        <div className={`text-xs text-teal-600 mt-1`}>{`${overlapDetails}`}</div>
      </>);
    } else {
      setOverlapInfo('');
    }
  }, [person, selectedPerson, calculateDetailedOverlap]);
  
    const handleSelectDeselect = () => {
      if (isSelected) {
        onSelect(null, type);
      } else {
        onSelect(person, type);
      }
    };
  
    return (
      <tr className={`${isSelected ? 'bg-teal-50' : ''} relative`}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button 
            onClick={handleSelectDeselect}
            className={`px-2 py-1 ${isSelected ? 'bg-teal-800' : 'bg-teal-600'} text-white rounded hover:bg-teal-700 transition-colors`}
          >
            {isSelected ? 'Deselect' : 'Select'}
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div>{person.availability.join(', ')}</div>
          {overlapInfo && (
            <div>{overlapInfo}</div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.language}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.liveScan ? 'Yes' : 'No'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {person.waitingDays} days waiting
      </td>
      </tr>
    );
  };
  
  const RecommendedMatchesAccordion = () => (
    <div className="mt-4 border rounded-md">
      <button
        className="w-full px-4 py-2 text-left font-bold bg-gray-100 hover:bg-gray-200 transition-colors"
        onClick={() => setIsRecommendedMatchesOpen(!isRecommendedMatchesOpen)}
      >
        Recommended Matches
        <span className="float-right">{isRecommendedMatchesOpen ? '▲' : '▼'}</span>
      </button>
      {isRecommendedMatchesOpen && (
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Waiting</th>
              </tr>
            </thead>
            <tbody>
              {recommendedMatches.map((match, index) => {
                const { overlappingSlots, totalOverlapHours, overlappingDays } = calculateDetailedOverlap(
                  selectedStudent || selectedTutor,
                  match.person
                );
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handlePersonSelect(match.person, selectedStudent ? 'tutor' : 'student')}
                        className="px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                      >
                        Select
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.person.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className={`text-xs font-bold mt-1`}>{`OVERLAP: ${overlappingDays} days, ${totalOverlapHours.toFixed(1)} hours`}</div>
                      <div className={`text-xs text-teal-600 mt-1`}>{`${overlappingSlots.map(slot => 
                        `${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`).join(', ')}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.person.language}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.person.liveScan ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.person.waitingDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  const DetailsBar = ({ student, tutor, onClose, handleManualMatch }) => {
    if (!student && !tutor) return null;

  
    const { overlappingSlots } = student && tutor 
    ? calculateDetailedOverlap(student, tutor)
    : { overlappingSlots: [], totalOverlapHours: 0, overlappingDays: 0 };
  
    const renderPersonTable = (person, role) => (
      <div>
        <h3 className="font-bold mb-2">{role}</h3>
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Name</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/6">Availability</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Language</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">LiveScan</th>
              
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-sm font-medium text-gray-900">{person.name}</td>
              <td className="px-3 py-2 text-sm text-gray-500 break-words">{person.availability.join(', ')}</td>
              <td className="px-3 py-2 text-sm text-gray-500">{person.language}</td>
              <td className="px-3 py-2 text-sm text-gray-500">{person.liveScan ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4" style={{ boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <div className="max-w-full mx-32">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            {student && renderPersonTable(student, "Selected Student")}
            {tutor && renderPersonTable(tutor, "Selected Tutor")}
          </div>
          {overlappingSlots.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold mb-2">Overlap Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {overlappingSlots.map((slot, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded">
                    <p className="font-medium">{slot.day}</p>
                    <p>{slot.time} ({(slot.overlap / 60).toFixed(1)} hours)</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {student && tutor && (
            <button 
              onClick={handleManualMatch}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            >
              Add to Matched Table
            </button>
          )}
          {recommendedMatches.length > 0 && (!student || !tutor) ? <RecommendedMatchesAccordion /> : ''}

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-full sm:mx-auto">
        <div className="relative px-4 py-10 mx-8 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-full mx-auto">
            <h1 className="text-3xl font-weight-1000 text-teal-600 font-semibold mb-8">Tutor-Student Matching</h1>      
            {/* Filter Controls and Buttons */}
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
                    value={MIN_OVERLAP_THRESHOLD}
                    onChange={(e) => setMIN_OVERLAP_THRESHOLD(parseInt(e.target.value))}
                    className="w-32"
                  />
                  <span className="ml-2 text-gray-700">{MIN_OVERLAP_THRESHOLD}</span>
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
                  className={`px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors ${matches.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={matches.length === 0}
                >
                  {matches.length > 0 ? `Match (${matches.length})` : 'Match'}
                </button>
              </div>
            </div>
            {/* Tutor Availability Chart */}
            <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium text-gray-900">Tutors waiting</h2>
          <div className="flex space-x-2">
            <Dropdown placeholder="Filter by" options={tutorFilterOptions} onSelect={handleDropdownSelect} />
            <Dropdown placeholder="Hidden fields" type="hiddenFields" options={tutorHiddenFieldsOptions} onSelect={handleDropdownSelect} />
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Waiting</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
  {unmatchedTutors.map((tutor) => (
  <PersonRow 
    key={tutor.id}
    person={tutor}
    type="tutor"
    onSelect={handlePersonSelect}
    isSelected={selectedTutor && selectedTutor.id === tutor.id}
    selectedStudent={selectedStudent}
    selectedTutor={selectedTutor}
    calculateDetailedOverlap={calculateDetailedOverlap}
  />
))}
  </tbody>
</table>
        </div>
      </div>
            {/* Student Availability Chart */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-medium text-gray-900">Students waiting</h2>
                <div className="flex space-x-2">
                  <Dropdown placeholder="Filter by" options={studentFilterOptions} onSelect={handleDropdownSelect} />
                  <Dropdown placeholder="Hidden fields" type="hiddenFields" options={studentHiddenFieldsOptions} onSelect={handleDropdownSelect} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Waiting</th>

                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {unmatchedStudents.map((student) => (
  <PersonRow 
    key={student.id}
    person={student}
    type="student"
    onSelect={handlePersonSelect}
    isSelected={selectedStudent && selectedStudent.id === student.id}
    selectedStudent={selectedStudent}
    selectedTutor={selectedTutor}
    calculateDetailedOverlap={calculateDetailedOverlap}
  />
))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Matches */}
            {matches.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Potential Matches</h2>
                <table className="min-w-full divide-y divide-gray-200 mt-2">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overlap</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matches.map((match, index) => (
                      <tr key={index} onClick={() => openModal(match)} className="cursor-pointer hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.tutor.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.overlap} day(s)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.language}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.liveScan ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnpair(match);
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors mr-2"
                          >
                            Unpair
                          </button>
                          <button 
                            className="px-2 py-1 bg-gray-300 text-gray-700 rounded cursor-not-allowed"
                            disabled
                          >
                            Match
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Debug Logs */}
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
    setRecommendedMatches([]);
  }}
/>
      {selectedMatch && <DetailsBar 
  student={selectedMatch?.student} 
  tutor={selectedMatch?.tutor} 
  onClose={() => setSelectedMatch(null)}
/>}
    </div>
  );
};

export default TutorStudentMatchingApp;