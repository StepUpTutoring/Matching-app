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
      <div className={`toggle__line w-10 h-4 rounded-full shadow-inner ${isChecked ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
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
  const [hoverDetails, setHoverDetails] = useState(null);
  
  const calculateTimeOverlap = (range1, range2) => {
    const [start1, end1] = range1.split('-').map(time => {
      const [hours] = time.split(':').map(Number);
      return hours * 60;
    });
    const [start2, end2] = range2.split('-').map(time => {
      const [hours] = time.split(':').map(Number);
      return hours * 60;
    });

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    return Math.max(0, overlapEnd - overlapStart);
  };

  const calculateOverlap = (student, tutor) => {
    const overlappingDays = new Set();
    student.availability.forEach(studentSlot => {
      const [studentDay, studentTime] = studentSlot.split(' ');
      tutor.availability.forEach(tutorSlot => {
        const [tutorDay, tutorTime] = tutorSlot.split(' ');
        if (studentDay === tutorDay) {
          const overlapMinutes = calculateTimeOverlap(studentTime, tutorTime);
          if (overlapMinutes >= 60) { // At least 1 hour overlap
            overlappingDays.add(studentDay);
          }
        }
      });
    });
    return overlappingDays.size;
  };

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
          return calculateOverlap(student, tutor);
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
          const overlap = calculateOverlap(student, tutor);
          if (overlap >= MIN_OVERLAP_THRESHOLD &&
              (!filters.language || student.language === tutor.language) &&
              (!filters.liveScan || student.liveScan === tutor.liveScan)) {
            newMatches.push({ student, tutor, overlap });
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

  // const handleStudentSelect = (student) => {
  //   setSelectedStudent(student === selectedStudent ? null : student);
  // };

  // const handleTutorSelect = (tutor) => {
  //   setSelectedTutor(tutor === selectedTutor ? null : tutor);
  // };

  const handleManualMatch = () => {
    if (selectedStudent && selectedTutor) {
      const overlap = calculateOverlap(selectedStudent, selectedTutor);
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

  const calculateTotalOverlapHours = (student, tutor) => {
    let totalHours = 0;
    student.availability.forEach(studentSlot => {
      const [studentDay, studentTime] = studentSlot.split(' ');
      tutor.availability.forEach(tutorSlot => {
        const [tutorDay, tutorTime] = tutorSlot.split(' ');
        if (studentDay === tutorDay) {
          const overlapMinutes = calculateTimeOverlap(studentTime, tutorTime);
          totalHours += overlapMinutes / 60;
        }
      });
    });
    return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
  };

  const [recommendedMatches, setRecommendedMatches] = useState([]);

  const calculateRecommendedMatches = (person, type) => {
    console.log('Calculating recommended matches for:', person.name, 'Type:', type);
    const otherList = type === 'student' ? unmatchedTutors : unmatchedStudents;
    const sorted = otherList
      .map(other => ({
        person: other,
        overlap: calculateOverlap(type === 'student' ? person : other, type === 'student' ? other : person)
      }))
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3); 
    console.log('Recommended matches:', sorted);
    setRecommendedMatches(sorted);
  };

  const handlePersonSelect = (person, type) => {
    console.log('Person selected:', person.name, 'Type:', type);
    if (type === 'student') {
      // If selecting a student, always update selectedStudent
      setSelectedStudent(person);
      // If a tutor was already selected, calculate recommended matches
      if (!selectedTutor) {
        calculateRecommendedMatches(person, 'student');
      } else {
        setRecommendedMatches([]);
      }
    } else {
      // If selecting a tutor, always update selectedTutor
      setSelectedTutor(person);
      // If a student was already selected, calculate recommended matches
      if (!selectedStudent) {
        calculateRecommendedMatches(person, 'tutor');
      } else {
        setRecommendedMatches([]);
      }
    }
  };



  const calculateDetailedOverlap = (person1, person2) => {
    const overlappingSlots = [];
    person1.availability.forEach(slot1 => {
      const [day1, time1] = slot1.split(' ');
      person2.availability.forEach(slot2 => {
        const [day2, time2] = slot2.split(' ');
        if (day1 === day2) {
          const overlapMinutes = calculateTimeOverlap(time1, time2);
          if (overlapMinutes >= 60) {
            overlappingSlots.push({ day: day1, time: `${time1} - ${time2}`, overlap: overlapMinutes });
          }
        }
      });
    });
    return overlappingSlots;
  };

  const handlePersonHover = (person, type) => {
    const selectedPerson = type === 'student' ? selectedTutor : selectedStudent;
    if (selectedPerson) {
      const overlappingSlots = calculateDetailedOverlap(person, selectedPerson);
      console.log('overlapping', overlappingSlots)
      const totalOverlapHours = overlappingSlots.reduce((sum, slot) => sum + slot.overlap / 60, 0);
      setHoverDetails({
        person: person,
        content: (
          "test"
          // <div>
          //   <p className='text-sm pb-2'>Overlapping Days: {overlappingSlots.length}</p>
          //   <p className='text-sm'>Total Overlap Hours: {totalOverlapHours.toFixed(1)}</p>
          // </div>
        )
      });
      console.log(hoverDetails)
    }
  };

  const PersonRow = ({ person, type, onSelect, isSelected, selectedStudent, selectedTutor, calculateOverlap, calculateTotalOverlapHours }) => {
    const [overlapInfo, setOverlapInfo] = useState('');
    const selectedPerson = type === 'student' ? selectedTutor : selectedStudent;
  
    useEffect(() => {
      if (selectedPerson) {
        const overlap = calculateOverlap(person, selectedPerson);
        const totalOverlapHours = calculateTotalOverlapHours(person, selectedPerson);
        setOverlapInfo(`Overlapping Days: ${overlap}, Total Overlap Hours: ${totalOverlapHours.toFixed(1)}`);
      } else {
        setOverlapInfo('');
      }
    }, [person, selectedPerson, isSelected, calculateOverlap, calculateTotalOverlapHours]);
  
    return (
      <>
        <tr className={`${isSelected ? 'bg-blue-100' : ''} relative`}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <button 
              onClick={() => onSelect(person, type)}
              className={`px-2 py-1 ${isSelected ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded hover:bg-blue-600 transition-colors`}
            >
              {isSelected ? 'Deselect' : 'Select'}
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div>{person.availability.join(', ')}</div>
            {overlapInfo && (
              <div className="text-xs text-blue-600 mt-1">{overlapInfo}</div>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.language}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.liveScan ? 'Yes' : 'No'}</td>
        </tr>
      </>
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
        <div className="p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overlap Days</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overlap Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {recommendedMatches.map((match, index) => {
                const detailedOverlap = calculateDetailedOverlap(
                  selectedStudent || selectedTutor,
                  match.person
                );
                const totalOverlapHours = detailedOverlap.reduce((sum, slot) => sum + slot.overlap / 60, 0);
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.person.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{detailedOverlap.length}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <p>Total Overlap: {totalOverlapHours.toFixed(1)} hours</p>
                      {detailedOverlap.map((slot, i) => (
                        <div key={i}>{`${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handlePersonSelect(match.person, selectedStudent ? 'tutor' : 'student')}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );


  const FloatingActionBar = () => {
    if (!selectedStudent && !selectedTutor) return null;

    const overlap = selectedStudent && selectedTutor ? calculateOverlap(selectedStudent, selectedTutor) : null;
    const totalOverlapHours = selectedStudent && selectedTutor ? calculateTotalOverlapHours(selectedStudent, selectedTutor) : null;

    const handleClose = () => {
      setSelectedStudent(null);
      setSelectedTutor(null);
      setRecommendedMatches([]);
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4" style={{ boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-4">
            {selectedStudent && (
              <div>
                <h3 className="font-bold mb-2">Selected Student</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{selectedStudent.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedStudent.availability.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedStudent.language}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedStudent.liveScan ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {selectedTutor && (
              <div>
                <h3 className="font-bold mb-2">Selected Tutor</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{selectedTutor.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedTutor.availability.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedTutor.language}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedTutor.liveScan ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {overlap !== null && (
            <div className="mb-4">
              <p className="text-lg">Overlapping Days: <span className="font-medium">{overlap}</span></p>
              <p className="text-lg">Total Overlap Hours: <span className="font-medium">{totalOverlapHours}</span></p>
            </div>
          )}
          {selectedStudent && selectedTutor && (
            <button 
              onClick={handleManualMatch}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            >
              Add to Matched Table
            </button>
          )}
          {recommendedMatches.length > 0 && <RecommendedMatchesAccordion />}
        </div>
      </div>
    );
  };

  const MatchDetailsBar = ({ match, onClose }) => {
    if (!match) return null;

    const totalOverlapHours = calculateTotalOverlapHours(match.student, match.tutor);

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4" style={{ boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <h3 className="font-bold mb-2">Student</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.availability.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.language}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.liveScan ? 'Yes' : 'No'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-bold mb-2">Tutor</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.tutor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.tutor.availability.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.tutor.language}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.tutor.liveScan ? 'Yes' : 'No'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-lg">
            <p>Overlapping Days: <span className="font-medium">{match.overlap}</span></p>
            <p>Total Overlap Hours: <span className="font-medium">{totalOverlapHours}</span></p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-full sm:mx-auto">
        <div className="relative px-4 py-10  mx-8 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-full mx-auto">
            <h1 className="text-3xl font-semibold mb-8">Tutor-Student Matching</h1>      
            {/* Filter Controls and Buttons */}
            <div className="mb-4 flex justify-between items-center">
              <div className="flex space-x-4">
                <p>Match based on compatability for...</p>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.language}
                    onChange={() => toggleFilter('language')}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Language</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.liveScan}
                    onChange={() => toggleFilter('liveScan')}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Livescan</span>
                </label>
                <div className="flex items-center">
                  <span className="mr-2 text-gray-700">Min Overlap:</span>
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
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={handleRoll}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Rolling...' : 'Roll'}
                </button>
                <button 
                  onClick={handleMatch}
                  className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${matches.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    calculateOverlap={calculateOverlap}
    calculateTotalOverlapHours={calculateTotalOverlapHours}
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
    calculateOverlap={calculateOverlap}
    calculateTotalOverlapHours={calculateTotalOverlapHours}
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
      <FloatingActionBar />
      {selectedMatch && <MatchDetailsBar match={selectedMatch} onClose={() => setSelectedMatch(null)} />}
    </div>
  );
};

export default TutorStudentMatchingApp;