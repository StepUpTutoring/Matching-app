import React from 'react';

const MatchesTable = ({ matches, onUnpair, onOpenModal }) => {
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {matches.map((match, index) => (
            <tr key={index} onClick={() => onOpenModal(match)} className="cursor-pointer hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{match.student.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.tutor.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.overlap} day(s)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.language}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{match.student.liveScan ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpair(match);
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
  );
};

export default MatchesTable;