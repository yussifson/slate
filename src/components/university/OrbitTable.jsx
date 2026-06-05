import React from 'react';

export default function OrbitTable({ headers, data, renderRow }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-deep">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface/50 text-xs font-medium text-text-muted sticky top-0 z-10 backdrop-blur-md">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-4 font-mono font-normal">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-text-muted">
                No data available.
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-surface/30 transition-colors group">
                {renderRow ? renderRow(row) : headers.map((_, j) => (
                  <td key={j} className="px-6 py-4 text-sm text-text-secondary">
                    {row[Object.keys(row)[j]]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
