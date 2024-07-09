import React from 'react';
import Table from './common/Table';

const TutorRowComponent = ({ item: tutor, columns, onSelect, isSelected }) => {
  return (
    <tr className={`${isSelected ? 'bg-teal-50' : ''} relative`}>
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {column.key === 'action' ? (
            <button 
              onClick={() => onSelect(tutor)}
              className={`px-2 py-1 ${isSelected ? 'bg-teal-600' : 'bg-teal-500'} text-white rounded hover:bg-teal-600 transition-colors`}
            >
              {isSelected ? 'Deselect' : 'Select'}
            </button>
          ) : column.render ? (
            column.render(tutor)
          ) : (
            tutor[column.key]
          )}
        </td>
      ))}
    </tr>
  );
};

const TutorTable = ({ tutors, selectedTutor, onSelectTutor }) => {
  const columns = [
    { key: 'action', header: 'Action' },
    { key: 'name', header: 'Name' },
    { key: 'availability', header: 'Availability', render: (tutor) => tutor.availability.join(', ') },
    { key: 'language', header: 'Language' },
    { key: 'liveScan', header: 'LiveScan', render: (tutor) => tutor.liveScan ? 'Yes' : 'No' },
    { key: 'waitingDays', header: 'Waiting Days' },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-medium text-gray-900 mb-4">Tutors waiting</h2>
      <Table 
        columns={columns} 
        data={tutors} 
        RowComponent={(props) => 
          <TutorRowComponent 
            {...props} 
            onSelect={onSelectTutor}
            isSelected={selectedTutor && selectedTutor.id === props.item.id}
          />
        } 
      />
    </div>
  );
};

export default TutorTable;