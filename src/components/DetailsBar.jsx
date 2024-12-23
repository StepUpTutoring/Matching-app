import React from 'react';

const DetailsBar = ({ student, tutor, onClose, handleManualMatch, calculateDetailedOverlap, children, proposedTime }) => {
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
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LiveScan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-3 py-2 text-sm font-medium text-gray-900">{person.name}</td>
            <td className="px-3 py-2 text-sm text-gray-500 break-words">{person.availability?.join(', ')}</td>
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
          <>
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
            {student && tutor && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">Proposed Meeting Times</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {calculateDetailedOverlap(student, tutor).proposedMeetings.map((meeting, index) => (
                    <div key={index} className="bg-teal-100 p-2 rounded">
                      <p className="font-medium">{meeting.day}</p>
                      <p>{meeting.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {children}
        {student && tutor && (
          <button 
            onClick={handleManualMatch}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
          >
            Add to Matched Table
          </button>
        )}
      </div>
    </div>
  );
};

export default DetailsBar;
