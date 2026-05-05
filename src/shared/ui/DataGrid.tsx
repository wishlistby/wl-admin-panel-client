import { clsx } from 'clsx';

type DataGridColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

interface DataGridProps<T> {
  columns: Array<DataGridColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  selectedKey?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  selectedKey,
  onRowClick,
  emptyMessage = 'Данные пока не заполнены.',
}: DataGridProps<T>) {
  return (
    <div className="data-grid-shell">
      <table className="data-grid">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="data-grid-empty">
                {emptyMessage}
              </td>
            </tr>
          )}

          {rows.map((row) => {
            const key = rowKey(row);
            const isSelected = selectedKey === key;

            return (
              <tr
                key={key}
                className={clsx('data-grid-row', isSelected && 'is-selected', onRowClick && 'is-clickable')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
