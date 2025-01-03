import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { Tooltip } from '@mui/material';

const PersonTable = ({
  people,
  type,
  onSelect,
  selectedPerson,
  otherSelectedPerson,
  calculateDetailedOverlap,
  onFilterChange,
  isRecommendedMatches,
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

  const [showNeedingStudents, setShowNeedingStudents] = React.useState(false);

  const data = useMemo(() => {
    let filteredPeople = people;
    
    if (type === 'tutor' && showNeedingStudents) {
      filteredPeople = people.filter(row => {
        const person = row.person || row;
        const numStudents = Number(person.numStudentsToMatch);
        return numStudents >= 1;
      });
    }

    return isRecommendedMatches
      ? filteredPeople.map((row) => {
          const person = row.person || row;
          return {
            ...flattenObject(person),
            liveScan: person.liveScan ? 'Yes' : 'No',
            waitingDays: `${person.waitingDays || ''} days waiting`
          };
        })
      : filteredPeople.map((row) => {
          const person = row.person || row;
          return {
            ...flattenObject(person),
            liveScan: person.liveScan ? 'Yes' : 'No',
            waitingDays: `${person.waitingDays || ''} days waiting`
          };
        });
  }, [people, type, showNeedingStudents, isRecommendedMatches]);

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
      'programType',
      'waitingDays',
    ];
    const tutorFields = [
      'assignedMeetings',
      'numberOfStudents',
      'gender',
      'daysWaitingForMatch',
      'linkedInResume',
      'speaksSpanish',
      'TQuality',
      'email',
      'tutorId',
      'firstName',
      'lastName',
      'lastMatch',
      'numStudentsToMatch',
      'phone',
      'primaryGuardian',
      'collegeInfo',
      'backgroundCheck',
      'status',
      'lastStatusChange',
      'matchedStudents',
      'totalDesiredStudents',
      'recordID',
    ];
    const studentFields = [
      'tutorPreferences',
      'subjects',
      'grade',
      'appliedDate',
      'gender',
      'studentId',
      'firstName',
      'lastName',
      'guardianName',
      'guardianPhone',
      'schoolText',
      'backgroundCheck',
      'districtText',
      'firstMatchedDate',
      'guardianEmail',
      'lastStatusChange',
      'guardianLanguage'
    ];

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
        if (key === 'assignedMeetings') {
          return cell.getValue();
        } else if (key === 'availability') {
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
      filterVariant: key === 'Status' ? 'multi-select' : 'text',
      filterSelectOptions: key === 'Status' ? ['Ready to Tutor', 'Needs Rematch', 'Needs a Match', 'Matched'] : undefined,
      filterFn: (row, columnId, filterValue, operator) => {
        if (!filterValue) return true;
        
        const cellValue = row.getValue(columnId);
        if (cellValue === null || cellValue === undefined) return false;
        
        // Handle different filter types
        if (key === 'Status') {
          return Array.isArray(filterValue) 
            ? filterValue.includes(cellValue)
            : filterValue === cellValue;
        } else {
          // For text fields, do case-insensitive contains
          const stringValue = String(cellValue).toLowerCase();
          const filterString = String(filterValue).toLowerCase();
          return stringValue.includes(filterString);
        }
      },
    });

    // Ensure priority fields are always included even if some records don't have them
    const columnsToShow = type === 'tutor' 
      ? [...commonFields, ...tutorFields]
      : [...commonFields, ...studentFields];

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
      
      ...columnsToShow.map(createColumn),
      ...allKeys
        .filter((key) => !columnsToShow.includes(key) && key !== 'id')
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

  const [columnFilters, setColumnFilters] = React.useState(
    isRecommendedMatches ? [] : [
      {
        id: 'Status',
        value: type === 'tutor' ? ['Ready to Tutor', 'Needs Rematch'] : ['Needs a Match', 'Needs Rematch'],
      },
    ]
  );

  // Sync column filters with parent
  React.useEffect(() => {
    if (!isRecommendedMatches && onFilterChange) {
      onFilterChange(type, columnFilters);
    }
  }, [columnFilters, type, onFilterChange, isRecommendedMatches]);

  const tableOptions = useMemo(() => {
    const options = {
      columns,
      data,
      enableFilters: true,
      enableColumnFilters: true,
      state: {
        columnFilters,
      },
      initialState: {
        density: 'compact',
        showColumnFilters: true,
        pagination: {
          pageSize: 15,
        },
        columnVisibility: columns.reduce((acc, column) => {
          if (column.hidden) {
            acc[column.accessorKey] = false;
          }
          return acc;
        }, {}),
      },
      onColumnFiltersChange: setColumnFilters,
      enableHiding: true,
      enableColumnActions: true,
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
        rowsPerPageOptions: [15, 50, 100],
      },
      defaultDisplayRows: 15,
    };

    if (isRecommendedMatches) {
      options.enableColumnFilters = false;
      options.enableGlobalFilter = false;
      options.enablePagination = false;
      options.enableSorting = false;
    }

    return options;
  }, [columns, data, columnFilters, isRecommendedMatches]);

  const table = useMaterialReactTable(tableOptions);


  // Create a wrapper div to hold both the button (for tutors only) and the table
  return (
    <div>
      {type === 'tutor' && (
        <Tooltip title="Filter tutors by those who have Number of Students to Match greater than 0" arrow placement="right">
          <button
            onClick={() => setShowNeedingStudents(!showNeedingStudents)}
            className="mb-2 px-3 py-1 text-teal-600 font-semibold rounded hover:text-teal-700 transition-colors"
          >
            {showNeedingStudents
              ? 'Show All Tutors' 
              : 'Show Tutors Needing Students (Beta)'}
          </button>
        </Tooltip>
      )}
      <MaterialReactTable table={table} />
    </div>
  );
};

export default PersonTable;
