import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

const PersonTable = ({ people, type, onSelect, selectedPerson, calculateDetailedOverlap, otherSelectedPerson }) => {
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  const data = useMemo(() => people.map((row) => {
    const flatRow = flattenObject(row);
    return {
      ...flatRow,
      liveScan: flatRow.liveScan ? 'Yes' : 'No',
      waitingDays: `${flatRow.waitingDays || ''} days waiting`,
    };
  }), [people]);

  const columns = useMemo(() => {
    // Get all unique keys from all people
    const allKeys = Array.from(new Set(people.flatMap(person => Object.keys(flattenObject(person)))));
    
    const commonFields = ['name', 'availability', 'language', 'liveScan', 'waitingDays'];
    const tutorFields = ['certifications', 'experience', 'rating'];
    const studentFields = ['grade', 'subjects', 'parentContact'];

    const priorityFields = type === 'tutor' 
      ? [...commonFields, ...tutorFields] 
      : [...commonFields, ...studentFields];
    
      const createColumn = (key) => ({
        accessorKey: key,
        header: key.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        size: 150,
        Cell: ({ cell }) => {
          if (key === 'availability') {
            const availabilityValue = cell.getValue();
            const availabilityArray = Array.isArray(availabilityValue) ? availabilityValue : [availabilityValue];
            const showOverlap = type === 'student' ? otherSelectedPerson : selectedPerson;
            const { overlappingSlots, totalOverlapHours, overlappingDays } = showOverlap
              ? calculateDetailedOverlap(cell.row.original, showOverlap) 
              : { overlappingSlots: [], totalOverlapHours: 0, overlappingDays: 0 };
            const overlapDetails = overlappingSlots.length > 0
              ? overlappingSlots.map(slot => `${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`).join(', ') 
              : '';
            return (
              <>
                <div>{availabilityArray.join(', ')}</div>
                {showOverlap && (
                  <div>
                    <div className="text-xs font-bold mt-1">{`OVERLAP: ${overlappingDays} days, ${totalOverlapHours.toFixed(1)} hours`}</div>
                    <div className="text-xs text-teal-600 mt-1">{overlapDetails}</div>
                  </div>
                )}
              </>
            );
          }
          return cell.getValue();
        },
      filterVariant: key === 'liveScan' ? 'select' : 'text',
      filterSelectOptions: key === 'liveScan' ? ['Yes', 'No'] : undefined,
    });

    return [
      {
        accessorKey: 'action',
        header: 'Action',
        size: 150,
        Cell: ({ row }) => (
          <button 
            onClick={() => onSelect(selectedPerson?.id === row.original.id ? null : row.original, type)}
            className={`px-2 py-1 ${selectedPerson?.id === row.original.id ? 'bg-teal-800' : 'bg-teal-600'} text-white rounded hover:bg-teal-700 transition-colors`}
          >
            {selectedPerson?.id === row.original.id ? 'Deselect' : 'Select'}
          </button>
        ),
      },
      ...priorityFields.filter(field => allKeys.includes(field)).map(createColumn),
      ...allKeys.filter(key => !priorityFields.includes(key) && key !== 'id').map(key => ({
        ...createColumn(key),
        hidden: true,
      })),
    ];
  }, [people, type, selectedPerson, calculateDetailedOverlap, onSelect, otherSelectedPerson]);

  const table = useMaterialReactTable({
    columns,
    data,
    initialState: { 
      showColumnFilters: true,
      columnVisibility: columns.reduce((acc, column) => {
        if (column.hidden) {
          acc[column.accessorKey] = false;
        }
        return acc;
      }, {}),
    },
    enableHiding: true,
    enableColumnActions: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableSorting: true,
    muiTablePaginationProps: {
      rowsPerPageOptions: [50, 100],
    },
  });

  return <MaterialReactTable table={table} />;
};

export default PersonTable;