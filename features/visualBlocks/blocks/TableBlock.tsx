import React, { useState, useMemo } from 'react';
import { TableBlockProps, TableColumn } from '../types';
import { BlockContainer } from './BlockContainer';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * TableBlock - Tabela de dados com sorting e paginação
 */
export const TableBlock: React.FC<TableBlockProps> = ({
  title,
  subtitle,
  columns,
  data,
  variant = 'default',
  sortable = false,
  pagination,
  footer,
  className
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      const column = columns.find((col) => col.id === sortConfig.key);
      if (!column) return 0;

      const aValue =
        typeof column.accessor === 'function'
          ? column.accessor(a)
          : a[column.accessor];
      const bValue =
        typeof column.accessor === 'function'
          ? column.accessor(b)
          : b[column.accessor];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortConfig, columns, sortable]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!pagination?.enabled) return sortedData;

    const pageSize = pagination.pageSize || 10;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, pagination, currentPage]);

  const totalPages = pagination?.enabled
    ? Math.ceil(sortedData.length / (pagination.pageSize || 10))
    : 1;

  const handleSort = (columnId: string) => {
    if (!sortable) return;

    const column = columns.find((col) => col.id === columnId);
    if (!column || column.sortable === false) return;

    setSortConfig((prev) => {
      if (!prev || prev.key !== columnId) {
        return { key: columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnId, direction: 'desc' };
      }
      return null;
    });
  };

  const getCellValue = (row: any, column: TableColumn) => {
    const rawValue =
      typeof column.accessor === 'function'
        ? column.accessor(row)
        : row[column.accessor];

    if (column.format) {
      return column.format(rawValue);
    }

    return rawValue;
  };

  const variantClasses = {
    default: '',
    striped: '[&_tbody_tr:nth-child(even)]:bg-gray-50',
    bordered: 'border border-gray-200',
    compact: '[&_td]:py-2 [&_th]:py-2'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <BlockContainer title={title} subtitle={subtitle} className={className}>
      <div className="overflow-x-auto">
        <table className={`w-full ${variantClasses[variant]}`}>
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-xs font-black text-gray-600 uppercase tracking-wider ${
                    alignClasses[column.align || 'left']
                  } ${
                    sortable && column.sortable !== false
                      ? 'cursor-pointer hover:bg-gray-100 select-none'
                      : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.id)}
                >
                  <div className="flex items-center gap-2 justify-between">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <span className="text-gray-400">
                        {sortConfig?.key === column.id ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`px-4 py-3 text-sm text-gray-700 ${
                      alignClasses[column.align || 'left']
                    }`}
                  >
                    {getCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={columns.length} className="px-4 py-3">
                  {footer}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pagination?.enabled && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando{' '}
            <span className="font-bold">
              {(currentPage - 1) * (pagination.pageSize || 10) + 1}
            </span>{' '}
            a{' '}
            <span className="font-bold">
              {Math.min(currentPage * (pagination.pageSize || 10), sortedData.length)}
            </span>{' '}
            de <span className="font-bold">{sortedData.length}</span> registros
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-bold rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm font-bold rounded transition-colors ${
                    currentPage === page
                      ? 'bg-[#1B75BB] text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-bold rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </BlockContainer>
  );
};
