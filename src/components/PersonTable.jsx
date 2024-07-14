import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

const PersonTable = ({ people, type, onSelect, selectedPerson, calculateDetailedOverlap }) => {
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
    if (data.length === 0) return [];
    
    const priorityFields = ['name', 'availability', 'language', 'liveScan', 'waitingDays'];
    const allKeys = Object.keys(data[0]);
    
    const createColumn = (key) => ({
      accessorKey: key,
      header: key.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      size: 150,
      Cell: ({ cell }) => {
        if (key === 'availability') {
          const isSelected = selectedPerson?.id === cell.row.original.id;
          const { overlappingSlots, totalOverlapHours, overlappingDays } = isSelected && selectedPerson
            ? calculateDetailedOverlap(cell.row.original, selectedPerson) 
            : { overlappingSlots: [], totalOverlapHours: 0, overlappingDays: 0 };
          const overlapDetails = isSelected && overlappingSlots
            ? overlappingSlots.map(slot => `${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`).join(', ') 
            : '';
          return (
            <>
              <div>{Array.isArray(cell.getValue()) ? cell.getValue().join(', ') : cell.getValue()}</div>
              {isSelected && (
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
      ...priorityFields.map(createColumn),
      ...allKeys.filter(key => key !== 'id' && key !== 'action' && !priorityFields.includes(key)).map(key => ({
        ...createColumn(key),
        hidden: true,
      })),
    ];
  }, [data, selectedPerson, calculateDetailedOverlap, onSelect, type]);

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
      rowsPerPageOptions: [10, 20, 50, 100],
    },
  });

  return <MaterialReactTable table={table} />;
};

export default PersonTable;