import React from 'react';
import { calculateDetailedOverlap } from '../utils/matchingUtils';

// Spinner component
const Spinner = () => (
  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
);

const MatchesTable = ({ matches, onUnpair, onOpenModal, onMatch, loadingMatch }) => {
  const getProposedMeetings = (student, tutor) => {
    const { proposedMeetings } = calculateDetailedOverlap(student, tutor);
    return proposedMeetings || [];
  };

  return (
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposed Times</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {matches.map((match, index) => {
            const proposedMeetings = getProposedMeetings(match.student, match.tutor);
            return (
              <tr key={index} onClick={() => onOpenModal(match)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.tutor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.overlap} day(s)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.language}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.liveScan ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {proposedMeetings.length > 0 ? (
                    <div>
                      {proposedMeetings.map((meeting, i) => (
                        <div key={i} className="text-teal-600">
                          {`${meeting.day} at ${meeting.time}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    'No proposed times'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpair(match);
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Unpair
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMatch(match);
                      }}
                      disabled={loadingMatch === `${match.student.id}-${match.tutor.id}`}
                      className="px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] flex items-center justify-center space-x-1"
                    >
                      {loadingMatch === `${match.student.id}-${match.tutor.id}` ? (
                        <>
                          <Spinner />
                          <span>...</span>
                        </>
                      ) : (
                        'Match'
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MatchesTable;
