'use client';

interface TableProps {
  data: Record<string, any>[];
  columns?: string[];
  caption?: string;
  maxRows?: number;
}

export function Table({ data, columns, caption, maxRows }: TableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">No data available</div>
    );
  }

  // Auto-detect columns from first row if not provided
  const displayColumns = columns || Object.keys(data[0]);

  // Limit rows if specified
  const displayData = maxRows ? data.slice(0, maxRows) : data;
  const hasMoreRows = maxRows && data.length > maxRows;

  // Format cell value
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      // Format large numbers with commas
      if (Math.abs(value) >= 1000) {
        return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
      }
      return value.toFixed(2);
    }
    return String(value);
  };

  // Format column header (convert camelCase to Title Case)
  const formatHeader = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="overflow-x-auto">
      {caption && (
        <div className="text-sm font-semibold mb-2 text-gray-700">
          {caption}
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {displayColumns.map(column => (
              <th
                key={column}
                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                {formatHeader(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {displayColumns.map(column => (
                <td key={column} className="px-4 py-2 whitespace-nowrap text-gray-900">
                  {formatValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {hasMoreRows && (
        <div className="text-xs text-gray-500 mt-2 italic">
          Showing {displayData.length} of {data.length} rows
        </div>
      )}
    </div>
  );
}
