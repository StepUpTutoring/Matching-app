import React from 'react';

const PersonRow = ({ person, type, onSelect, isSelected, selectedPerson, calculateDetailedOverlap }) => {
  const [overlapInfo, setOverlapInfo] = React.useState('');

  React.useEffect(() => {
    if (selectedPerson) {
      const { overlappingSlots, totalOverlapHours, overlappingDays } = calculateDetailedOverlap(person, selectedPerson);
      const overlapDetails = overlappingSlots.map(slot => 
        `${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`
      ).join(', ');
      setOverlapInfo(
        <>
          <div className={`text-xs font-bold mt-1`}>{`OVERLAP: ${overlappingDays} days, ${totalOverlapHours.toFixed(1)} hours`}</div>
          <div className={`text-xs text-teal-600 mt-1`}>{`${overlapDetails}`}</div>
        </>
      );
    } else {
      setOverlapInfo('');
    }
  }, [person, selectedPerson, calculateDetailedOverlap]);

  const handleSelectDeselect = () => {
    onSelect(isSelected ? null : person, type);
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
        {overlapInfo && <div>{overlapInfo}</div>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.language}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.liveScan ? 'Yes' : 'No'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.waitingDays} days waiting</td>
    </tr>
  );
};

const PersonTable = ({ people, type, onSelect, selectedPerson, calculateDetailedOverlap }) => {
  return (
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
          {people.map((person) => (
            <PersonRow 
              key={person.id}
              person={person}
              type={type}
              onSelect={onSelect}
              isSelected={selectedPerson && selectedPerson.id === person.id}
              selectedPerson={selectedPerson}
              calculateDetailedOverlap={calculateDetailedOverlap}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PersonTable;