import { Plus, Trash2 } from 'lucide-react'

type MatrixEditorProps = {
  addColumnLabel: string
  addRowLabel: string
  cellInputClassName: string
  columnBaseLabel: string
  columnHeaderLabel: string
  columnLabels: string[]
  cornerLabel: string
  helperText: string
  matrixValues: string[][]
  minColumns: number
  minRows: number
  onAddColumn: () => void
  onAddRow: () => void
  onCellChange: (rowIndex: number, columnIndex: number, nextValue: string) => void
  onColumnLabelChange: (columnIndex: number, nextValue: string) => void
  onRemoveColumn: (columnIndex: number) => void
  onRemoveRow: (rowIndex: number) => void
  onRowLabelChange: (rowIndex: number, nextValue: string) => void
  removeColumnLabel: (label: string) => string
  removeRowLabel: (label: string) => string
  rowBaseLabel: string
  rowLabels: string[]
  tableMinWidth: number
}

export function MatrixEditor({
  addColumnLabel,
  addRowLabel,
  cellInputClassName,
  columnBaseLabel,
  columnHeaderLabel,
  columnLabels,
  cornerLabel,
  helperText,
  matrixValues,
  minColumns,
  minRows,
  onAddColumn,
  onAddRow,
  onCellChange,
  onColumnLabelChange,
  onRemoveColumn,
  onRemoveRow,
  onRowLabelChange,
  removeColumnLabel,
  removeRowLabel,
  rowBaseLabel,
  rowLabels,
  tableMinWidth,
}: MatrixEditorProps) {
  const canRemoveRow = rowLabels.length > minRows
  const canRemoveColumn = columnLabels.length > minColumns

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            className="atelier-outline-button"
            onClick={onAddRow}
            type="button"
          >
            <Plus size={16} />
            {addRowLabel}
          </button>
          <button
            className="atelier-outline-button"
            onClick={onAddColumn}
            type="button"
          >
            <Plus size={16} />
            {addColumnLabel}
          </button>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c6d78]">
          {helperText}
        </p>
      </div>

      <div className="table-wrap">
        <table className="table-base" style={{ minWidth: `${tableMinWidth}px` }}>
          <thead>
            <tr>
              <th className="min-w-[13rem]">{cornerLabel}</th>
              {columnLabels.map((label, columnIndex) => (
                <th key={`${columnBaseLabel}-${columnIndex}`}>
                  <div className="flex min-w-[8.5rem] items-center gap-2">
                    <input
                      aria-label={`${columnBaseLabel} ${columnIndex + 1}`}
                      className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#1b1c15] outline-none transition focus:shadow-[0_0_0_2px_rgba(0,44,152,0.18)]"
                      onChange={(event) =>
                        onColumnLabelChange(columnIndex, event.target.value)
                      }
                      value={label}
                    />
                    <button
                      aria-label={removeColumnLabel(label)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8d9e2] bg-white text-[#6c6d78] transition hover:border-[#002c98] hover:text-[#002c98] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!canRemoveColumn}
                      onClick={() => onRemoveColumn(columnIndex)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-[6rem] text-center">{columnHeaderLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((label, rowIndex) => (
              <tr key={`${rowBaseLabel}-${rowIndex}`}>
                <td>
                  <div className="flex min-w-[13rem] items-center gap-2">
                    <input
                      aria-label={`${rowBaseLabel} ${rowIndex + 1}`}
                      className="w-full rounded-xl bg-[#f5f4e8] px-3 py-2 text-sm font-semibold text-[#1b1c15] outline-none transition focus:bg-white focus:shadow-[0_0_0_2px_rgba(0,44,152,0.18)]"
                      onChange={(event) =>
                        onRowLabelChange(rowIndex, event.target.value)
                      }
                      value={label}
                    />
                    <button
                      aria-label={removeRowLabel(label)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8d9e2] bg-white text-[#6c6d78] transition hover:border-[#002c98] hover:text-[#002c98] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!canRemoveRow}
                      onClick={() => onRemoveRow(rowIndex)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
                {columnLabels.map((columnLabel, columnIndex) => (
                  <td key={`${label}-${columnLabel}-${columnIndex}`}>
                    <input
                      className={cellInputClassName}
                      inputMode="decimal"
                      onChange={(event) =>
                        onCellChange(rowIndex, columnIndex, event.target.value)
                      }
                      value={matrixValues[rowIndex][columnIndex] ?? ''}
                    />
                  </td>
                ))}
                <td className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#6c6d78]">
                  {rowIndex + 1}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
