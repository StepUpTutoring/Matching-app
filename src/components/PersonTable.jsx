import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

const PersonTable = ({
  people,
  type,
  onSelect,
  selectedPerson,
  otherSelectedPerson,
  calculateDetailedOverlap,
}) => {
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (
        typeof obj[k] === 'object' &&
        obj[k] !== null &&
        !Array.isArray(obj[k])
      ) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  const truncateText = (text, maxLength = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const data = useMemo(
    () =>
      people.map((row) => ({
        ...flattenObject(row),
        liveScan: row.liveScan ? 'Yes' : 'No',
        waitingDays: `${row.waitingDays || ''} days waiting`
      })),
    [people]
  );

  // Memoize overlap calculations with proper dependency tracking
  const overlapDetails = useMemo(() => {
    if (!otherSelectedPerson) return null;
    
    // Create a stable key for each person's availability
    const getAvailabilityKey = (person) => {
      const avail = Array.isArray(person.availability) ? person.availability : [person.availability];
      return avail.filter(Boolean).sort().join('|');
    };
    
    // Calculate overlaps only if we have valid data
    const results = {};
    people.forEach(person => {
      if (person && person.id && person.availability) {
        results[person.id] = calculateDetailedOverlap(person, otherSelectedPerson);
      }
    });
    
    return results;
  }, [
    // Only depend on the specific properties we need
    people.map(p => p.id).join(','),
    people.map(p => Array.isArray(p.availability) ? p.availability.join(',') : p.availability).join('|'),
    otherSelectedPerson?.id,
    otherSelectedPerson?.availability,
    calculateDetailedOverlap
  ]);

  const columns = useMemo(() => {
    const allKeys = Array.from(
      new Set(people.flatMap((person) => Object.keys(flattenObject(person))))
    );

    const commonFields = [
      'name',
      'Status',
      'availability',
      'language',
      'liveScan',
      'waitingDays',
    ];
    const tutorFields = ['certifications', 'experience', 'rating'];
    const studentFields = ['grade', 'subjects', 'parentContact'];

    const priorityFields =
      type === 'tutor'
        ? [...commonFields, ...tutorFields]
        : [...commonFields, ...studentFields];

    const createColumn = (key) => ({
      accessorKey: key,
      header: truncateText(
        key
          .split('.')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      ),
      minSize: key === 'availability' ? 200 : 50,
      maxSize: key === 'availability' ? 1000 : 500,
      Cell: ({ cell, row }) => {
        if (key === 'availability') {
          const availabilityValue = cell.getValue();
          const availabilityArray = availabilityValue ? 
            (Array.isArray(availabilityValue) ? availabilityValue : [availabilityValue]).filter(Boolean) :
            [];

          const overlap = overlapDetails?.[row.original.id];
          
          return (
            <>
              <div>{availabilityArray.join(', ')}</div>
              {overlap && (
                <div>
                  <div className="text-xs font-bold mt-1">
                    {`OVERLAP: ${overlap.overlappingDays} days, ${overlap.totalOverlapHours.toFixed(1)} hours`}
                  </div>
                  <div className="text-xs text-teal-600 mt-1">
                    {overlap.overlappingSlots.map(slot => 
                      `${slot.day}: ${slot.time} (${(slot.overlap / 60).toFixed(1)} hours)`
                    ).join(', ')}
                  </div>
                </div>
              )}
            </>
          );
        }
        return cell.getValue();
      },
      filterVariant: key === 'liveScan' ? 'select' : key === 'Status' ? 'multi-select' : 'text',
      filterSelectOptions: key === 'liveScan' ? ['Yes', 'No'] : 
        key === 'Status' ? ['Ready to Tutor', 'Needs Rematch', 'Needs a Match', 'Matched'] : undefined,
      filterFn: key === 'Status' ? 
        (row, _columnId, filterValue) => {
          // Handle both string and array filter values
          const status = row.getValue('Status');
          return Array.isArray(filterValue) 
            ? filterValue.includes(status)
            : filterValue === status;
        } : undefined,
    });

    return [
      {
        accessorKey: 'action',
        header: 'Action',
        minSize: 100,
        maxSize: 200,
        Cell: ({ row }) => (
          <button
            onClick={() =>
              onSelect(
                selectedPerson?.id === row.original.id ? null : row.original,
                type
              )
            }
            className={`px-2 py-1 ${
              selectedPerson?.id === row.original.id
                ? 'bg-teal-800'
                : 'bg-teal-600'
            } text-white rounded hover:bg-teal-700 transition-colors`}
          >
            {selectedPerson?.id === row.original.id ? 'Deselect' : 'Select'}
          </button>
        ),
      },
      ...priorityFields
        .filter((field) => allKeys.includes(field))
        .map(createColumn),
      ...allKeys
        .filter((key) => !priorityFields.includes(key) && key !== 'id')
        .map((key) => ({
          ...createColumn(key),
          hidden: true,
        })),
    ];
  }, [
    people,
    type,
    selectedPerson,
    onSelect,
    overlapDetails
  ]);

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
      columnFilters: [
        {
          id: 'Status',
          value: type === 'tutor' ? ['Ready to Tutor', 'Needs Rematch', 'Matched'] : ['Needs a Match', 'Needs Rematch'],
        },
      ],
    },
    enableHiding: true,
    enableColumnActions: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableSorting: true,
    tableLayout: 'auto',
    muiTableBodyCellProps: {
      sx: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '300px',
      },
    },
    muiTablePaginationProps: {
      rowsPerPageOptions: [50, 100],
    },
  });

  return <MaterialReactTable table={table} />;
};

export default PersonTable;
