import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

const PersonTable = ({ people, type, onSelect, selectedPerson, calculateDetailedOverlap }) => {
  const data = useMemo(() => people.map((row) => ({
    ...row,
    liveScan: row.liveScan ? 'Yes' : 'No',
    waitingDays: `${row.waitingDays || ''} days waiting`,
  })), [people]);
  const columns = useMemo(
    () => [
      {
        accessorKey: 'action',
        header: 'Action',
        size: 150,
        Cell: ({ row }) => (
          <button 
            onClick={(e) => onSelect(selectedPerson?.id === row.original.id ? row.original : null, type)}
            className={`px-2 py-1 ${selectedPerson?.id === row.original.id ? 'bg-teal-800' : 'bg-teal-600'} text-white rounded hover:bg-teal-700 transition-colors`}
          >
            {selectedPerson?.id === row.original.id ? 'Deselect' : 'Select'}
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
      },
      {
        accessorKey: 'availability', //normal accessorKey
        header: 'Availability',
        size: 200,
        Cell: ({ row }) => {
          let isSelected = selectedPerson?.id === row.original.id;
          const { overlappingSlots, totalOverlapHours, overlappingDays } = isSelected ? calculateDetailedOverlap(row.original, selectedPerson) : {};
          const overlapDetails = isSelected ? overlappingSlots.map(slot => 
            `${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`
          ).join(', ') : '';
          return (
            <>
              <div>{row.original.availability?.join(', ')}</div>
              {!isSelected ? null : <div>
                <div className={`text-xs font-bold mt-1`}>{`OVERLAP: ${overlappingDays} days, ${totalOverlapHours.toFixed(1)} hours`}</div>
                <div className={`text-xs text-teal-600 mt-1`}>{`${overlapDetails}`}</div>
              </div>}
            </>
          )
        },
      },
      {
        accessorKey: 'language',
        header: 'Language',
        size: 150,
      },
      {
        accessorKey: 'liveScan',
        header: 'LiveScan',
        size: 150,
        filterVariant: 'select',
        filterSelectOptions: ['Yes', 'No'],
      },
      {
        accessorKey: 'waitingDays',
        header: 'Time Waiting',
        size: 150,
      },
    ],
    [],
  );
  const table = useMaterialReactTable({
    columns,
    data,
    initialState: { showColumnFilters: true },
  });

  return <MaterialReactTable table={table} />;
};

export default PersonTable;