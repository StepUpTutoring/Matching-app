import React from 'react';

const RowComponent = ({ item, columns }) => {
  return (
    <tr>
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {column.render ? column.render(item) : item[column.key]}
        </td>
      ))}
    </tr>
  );
};

export default RowComponent;