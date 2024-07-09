import React from 'react';
import Table from './common/Table';

const MatchRowComponent = ({ item: match, columns, onUnpair, onViewDetails }) => {
  return (
    <tr className="cursor-pointer hover:bg-gray-50" onClick={() => onViewDetails(match)}>
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {column.key === 'actions' ? (
            <>
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
            </>
          ) : column.render ? (
            column.render(match)
          ) : (
            match[column.key]
          )}
        </td>
      ))}
    </tr>
  );
};

const MatchesTable = ({ matches, onUnpair, onViewDetails }) => {
  const columns = [
    { key: 'student', header: 'Student', render: (match) => match.student.name },
    { key: 'tutor', header: 'Tutor', render: (match) => match.tutor.name },
    { key: 'overlap', header: 'Overlap', render: (match) => `${match.overlap} day(s)` },
    { key: 'language', header: 'Language', render: (match) => match.student.language },
    { key: 'liveScan', header: 'LiveScan', render: (match) => match.student.liveScan ? 'Yes' : 'No' },
    { key: 'actions', header: 'Actions' },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Potential Matches</h2>
      <Table 
        columns={columns} 
        data={matches} 
        RowComponent={(props) => 
          <MatchRowComponent 
            {...props} 
            onUnpair={onUnpair}
            onViewDetails={onViewDetails}
          />
        } 
      />
    </div>
  );
};

export default MatchesTable;