import { Calculator, Download, FileUp, RotateCcw } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { MatrixEditor } from '../components/MatrixEditor'
import { chiSquareExampleDataset } from '../data/mock'
import {
  CHI_SQUARE_ERROR_CODES,
  computeChiSquare,
} from '../lib/chi-square'
import { exportChiSquareWorkbook } from '../lib/results-export'
import {
  SPREADSHEET_ERROR_CODES,
  loadSpreadsheetTable,
} from '../lib/spreadsheet'

const createInitialMatrixValues = () =>
  chiSquareExampleDataset.matrix.map((row) => row.map((value) => value.toString()))

export function ChiSquarePage() {
  const { i18n, t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [rowLabels, setRowLabels] = useState<string[]>([
    ...chiSquareExampleDataset.rowLabels,
  ])
  const [columnLabels, setColumnLabels] = useState<string[]>([
    ...chiSquareExampleDataset.columnLabels,
  ])
  const [matrixValues, setMatrixValues] = useState<string[][]>(() =>
    createInitialMatrixValues(),
  )
  const [importMessage, setImportMessage] = useState<{
    tone: 'error' | 'success'
    value: string
  } | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<{
    tone: 'error' | 'success'
    value: string
  } | null>(null)
  const shouldStackDataTables = columnLabels.length > 2 || rowLabels.some((label) => label.length > 10)
  const tableMinWidth = Math.max(820, 320 + columnLabels.length * 170)

  const formatNumber = (value: number, digits = 4) =>
    new Intl.NumberFormat(i18n.language, {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits > 2 ? 2 : digits,
    }).format(value)

  const mapChiSquareError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return t('chiSquare.validationGeneric')
    }

    if (error.message === CHI_SQUARE_ERROR_CODES.matrixTooSmall) {
      return t('chiSquare.validationTooSmall')
    }

    if (error.message === CHI_SQUARE_ERROR_CODES.matrixNotRectangular) {
      return t('chiSquare.validationRectangular')
    }

    if (error.message === CHI_SQUARE_ERROR_CODES.matrixNonNumeric) {
      return t('chiSquare.validationNumeric')
    }

    if (error.message === CHI_SQUARE_ERROR_CODES.negativeFrequency) {
      return t('chiSquare.validationNegative')
    }

    if (error.message === CHI_SQUARE_ERROR_CODES.totalMustBePositive) {
      return t('chiSquare.validationTotal')
    }

    if (error.message === CHI_SQUARE_ERROR_CODES.expectedZero) {
      return t('chiSquare.validationExpectedZero')
    }

    return error.message
  }

  let chiSquareResult: ReturnType<typeof computeChiSquare> | null = null
  let parsedMatrix: number[][] | null = null
  let validationError: string | null = null

  try {
    parsedMatrix = matrixValues.map((row) =>
      row.map((value) => {
        const normalizedValue = value.trim().replace(',', '.')
        if (normalizedValue.length === 0) {
          throw new Error('CHI_SQUARE_EMPTY_VALUE')
        }

        const parsedValue = Number(normalizedValue)
        if (Number.isNaN(parsedValue)) {
          throw new Error(CHI_SQUARE_ERROR_CODES.matrixNonNumeric)
        }

        return parsedValue
      }),
    )

    chiSquareResult = computeChiSquare(parsedMatrix)
  } catch (error) {
    validationError =
      error instanceof Error && error.message === 'CHI_SQUARE_EMPTY_VALUE'
        ? t('chiSquare.validationEmpty')
        : mapChiSquareError(error)
  }

  const steps = chiSquareResult
    ? [
        {
          title: t('chiSquare.step1Title'),
          body: `${t('chiSquare.totalLabel')}: ${formatNumber(chiSquareResult.total, 0)} · ${t('chiSquare.rowTotalsLabel')}: ${chiSquareResult.rowTotals.map((value) => formatNumber(value, 0)).join(', ')}`,
        },
        {
          title: t('chiSquare.step2Title'),
          body: `${t('chiSquare.columnTotalsLabel')}: ${chiSquareResult.columnTotals.map((value) => formatNumber(value, 0)).join(', ')} · ${t('chiSquare.expectedLabel')}: ${formatNumber(chiSquareResult.expected[0][0])}`,
        },
        {
          title: t('chiSquare.step3Title'),
          body: `${t('chiSquare.statisticLabel')}: ${formatNumber(chiSquareResult.statistic)} · gl: ${chiSquareResult.degreesOfFreedom}`,
        },
      ]
    : [
        {
          title: t('chiSquare.step1Title'),
          body: t('chiSquare.stepPlaceholder'),
        },
        {
          title: t('chiSquare.step2Title'),
          body: t('chiSquare.stepPlaceholder'),
        },
        {
          title: t('chiSquare.step3Title'),
          body: t('chiSquare.stepPlaceholder'),
        },
      ]

  const handleCellChange = (
    rowIndex: number,
    columnIndex: number,
    nextValue: string,
  ) => {
    setExportMessage(null)
    setMatrixValues((current) =>
      current.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((value, currentColumnIndex) =>
              currentColumnIndex === columnIndex ? nextValue : value,
            )
          : row,
      ),
    )
  }

  const handleRowLabelChange = (rowIndex: number, nextValue: string) => {
    setExportMessage(null)
    setRowLabels((current) =>
      current.map((label, currentRowIndex) =>
        currentRowIndex === rowIndex ? nextValue : label,
      ),
    )
  }

  const handleColumnLabelChange = (columnIndex: number, nextValue: string) => {
    setExportMessage(null)
    setColumnLabels((current) =>
      current.map((label, currentColumnIndex) =>
        currentColumnIndex === columnIndex ? nextValue : label,
      ),
    )
  }

  const handleAddRow = () => {
    setExportMessage(null)
    setRowLabels((current) => [...current, `${t('common.row')} ${current.length + 1}`])
    setMatrixValues((current) => [
      ...current,
      Array.from({ length: columnLabels.length }, () => ''),
    ])
  }

  const handleRemoveRow = (rowIndex: number) => {
    if (rowLabels.length <= 2) {
      return
    }

    setExportMessage(null)
    setRowLabels((current) => current.filter((_, currentRowIndex) => currentRowIndex !== rowIndex))
    setMatrixValues((current) =>
      current.filter((_, currentRowIndex) => currentRowIndex !== rowIndex),
    )
  }

  const handleAddColumn = () => {
    setExportMessage(null)
    setColumnLabels((current) => [
      ...current,
      `${t('common.column')} ${current.length + 1}`,
    ])
    setMatrixValues((current) => current.map((row) => [...row, '']))
  }

  const handleRemoveColumn = (columnIndex: number) => {
    if (columnLabels.length <= 2) {
      return
    }

    setExportMessage(null)
    setColumnLabels((current) =>
      current.filter((_, currentColumnIndex) => currentColumnIndex !== columnIndex),
    )
    setMatrixValues((current) =>
      current.map((row) =>
        row.filter((_, currentColumnIndex) => currentColumnIndex !== columnIndex),
      ),
    )
  }

  const handleResetExample = () => {
    setRowLabels([...chiSquareExampleDataset.rowLabels])
    setColumnLabels([...chiSquareExampleDataset.columnLabels])
    setMatrixValues(createInitialMatrixValues())
    setSelectedFileName(null)
    setImportMessage(null)
    setExportMessage(null)
  }

  const mapImportError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return t('chiSquare.importReadError')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.unsupportedFormat) {
      return t('chiSquare.importUnsupportedFormat')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.invalidTable) {
      return t('chiSquare.importInvalidTable')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.fileTooLarge) {
      return t('chiSquare.importFileTooLarge')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.matrixTooLarge) {
      return t('chiSquare.importMatrixTooLarge')
    }

    if (
      error.message === SPREADSHEET_ERROR_CODES.noWorksheet ||
      error.message === SPREADSHEET_ERROR_CODES.readFailed
    ) {
      return t('chiSquare.importReadError')
    }

    return error.message
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsImporting(true)
    setImportMessage(null)
    setExportMessage(null)

    try {
      const loadedTable = await loadSpreadsheetTable(file)
      setRowLabels(loadedTable.rowLabels)
      setColumnLabels(loadedTable.columnLabels)
      setMatrixValues(
        loadedTable.matrix.map((row) => row.map((value) => value.toString())),
      )
      setSelectedFileName(file.name)
      setImportMessage({
        tone: 'success',
        value: t('chiSquare.importSuccess'),
      })
    } catch (error) {
      setImportMessage({
        tone: 'error',
        value: mapImportError(error),
      })
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  const handleExport = async () => {
    if (!parsedMatrix || !chiSquareResult) {
      setExportMessage({
        tone: 'error',
        value: t('chiSquare.exportUnavailable'),
      })
      return
    }

    setIsExporting(true)
    setExportMessage(null)

    try {
      await exportChiSquareWorkbook({
        matrix: parsedMatrix,
        rowLabels,
        columnLabels,
        result: chiSquareResult,
        sourceFileName: selectedFileName,
      })
      setExportMessage({
        tone: 'success',
        value: t('chiSquare.exportSuccess'),
      })
    } catch {
      setExportMessage({
        tone: 'error',
        value: t('chiSquare.exportError'),
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="max-w-5xl">
        <p className="eyebrow mb-3">Tool 02</p>
        <h1 className="page-title">{t('chiSquare.title')}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#444654]">
          {t('chiSquare.subtitle')}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.36fr_minmax(0,0.64fr)]">
        <article className="atelier-panel-soft min-w-0">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a0f399] text-[#005312]">
            <Calculator size={24} />
          </div>
          <h2 className="section-title">{t('chiSquare.introTitle')}</h2>
          <p className="mt-4 text-sm leading-7 text-[#444654]">
            {t('chiSquare.introBody')}
          </p>
          <input
            accept=".xlsx,.csv,.txt"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <div className="mt-8 rounded-[24px] border-2 border-dashed border-[#c4c5d6] bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f4e8] text-[#005312]">
                <FileUp size={22} />
              </div>
              <button
                className="atelier-primary-button"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {isImporting ? t('chiSquare.importing') : t('common.upload')}
              </button>
              <button
                className="atelier-outline-button"
                onClick={handleResetExample}
                type="button"
              >
                <RotateCcw size={16} />
                {t('chiSquare.resetExample')}
              </button>
            </div>
            {selectedFileName ? (
              <p className="mt-4 text-sm leading-7 text-[#1b1c15]">
                {t('chiSquare.loadedFileLabel')}: {selectedFileName}
              </p>
            ) : null}
            {importMessage ? (
              <div
                className={`mt-4 rounded-[18px] px-4 py-3 text-sm leading-7 ${
                  importMessage.tone === 'error'
                    ? 'bg-[#fff3f1] text-[#8a2b1d]'
                    : 'bg-[#eefde9] text-[#1b6d24]'
                }`}
              >
                {importMessage.value}
              </div>
            ) : null}
            <p className="mt-4 text-sm leading-7 text-[#444654]">
              {t('chiSquare.matrixHelp')}
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {steps.map((step, index) => (
              <div className="rounded-[22px] bg-white p-4" key={step.title}>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
                  Paso {index + 1}
                </p>
                <p className="font-headline text-base font-bold text-[#1b1c15]">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#444654]">{step.body}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="min-w-0 space-y-6">
          <div
            className={`grid gap-6 ${
              shouldStackDataTables ? 'grid-cols-1' : '2xl:grid-cols-2'
            }`}
          >
            <article className="atelier-panel min-w-0">
              <h2 className="section-title">{t('chiSquare.observedTitle')}</h2>
              <MatrixEditor
                addColumnLabel={t('common.addColumn')}
                addRowLabel={t('common.addRow')}
                cellInputClassName="min-w-[6.5rem] rounded-xl bg-[#f5f4e8] px-3 py-2 text-center text-sm text-[#1b1c15] outline-none transition focus:bg-white focus:shadow-[0_0_0_2px_rgba(0,44,152,0.18)]"
                columnBaseLabel={t('common.column')}
                columnHeaderLabel={t('common.index')}
                columnLabels={columnLabels}
                cornerLabel={t('chiSquare.variableColumn')}
                helperText={t('common.matrixEditorHint')}
                matrixValues={matrixValues}
                minColumns={2}
                minRows={2}
                onAddColumn={handleAddColumn}
                onAddRow={handleAddRow}
                onCellChange={handleCellChange}
                onColumnLabelChange={handleColumnLabelChange}
                onRemoveColumn={handleRemoveColumn}
                onRemoveRow={handleRemoveRow}
                onRowLabelChange={handleRowLabelChange}
                removeColumnLabel={(label) => `${t('common.removeColumn')} ${label}`}
                removeRowLabel={(label) => `${t('common.removeRow')} ${label}`}
                rowBaseLabel={t('common.row')}
                rowLabels={rowLabels}
                tableMinWidth={tableMinWidth}
              />
              {validationError ? (
                <div className="mt-5 rounded-[22px] border border-[#f4c7c3] bg-[#fff3f1] px-4 py-3 text-sm leading-7 text-[#8a2b1d]">
                  <p className="font-semibold">{t('chiSquare.validationTitle')}</p>
                  <p>{validationError}</p>
                </div>
              ) : null}
            </article>

            <article className="atelier-panel min-w-0">
              <h2 className="section-title">{t('chiSquare.expectedTitle')}</h2>
              {chiSquareResult ? (
                <div className="mt-5 table-wrap">
                  <table className="table-base" style={{ minWidth: `${tableMinWidth}px` }}>
                    <thead>
                      <tr>
                        <th>{t('chiSquare.variableColumn')}</th>
                        {columnLabels.map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rowLabels.map((label, rowIndex) => (
                        <tr key={label}>
                          <td>{label}</td>
                          {columnLabels.map((columnLabel, columnIndex) => (
                            <td key={`${label}-${columnLabel}`}>
                              {formatNumber(chiSquareResult.expected[rowIndex][columnIndex])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] bg-[#f5f4e8] p-4 text-sm leading-7 text-[#444654]">
                  {t('chiSquare.validationTablePending')}
                </div>
              )}
            </article>
          </div>

          <article className="atelier-panel">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title">{t('chiSquare.interpretationTitle')}</h2>
              <Download className="text-[#002c98]" size={18} />
            </div>
            <button
              className="atelier-primary-button w-full"
              disabled={!chiSquareResult || isExporting}
              onClick={handleExport}
              type="button"
            >
              {isExporting ? t('chiSquare.exporting') : t('chiSquare.downloadResults')}
              <Download size={16} />
            </button>
            {exportMessage ? (
              <div
                className={`mt-4 rounded-[18px] px-4 py-3 text-sm leading-7 ${
                  exportMessage.tone === 'error'
                    ? 'bg-[#fff3f1] text-[#8a2b1d]'
                    : 'bg-[#eefde9] text-[#1b6d24]'
                }`}
              >
                {exportMessage.value}
              </div>
            ) : null}
            <div className="mt-4 grid gap-6 lg:grid-cols-[0.44fr_0.56fr]">
              <div className="rounded-[26px] bg-[#002c98] p-6 text-white">
                <p className="text-xs uppercase tracking-[0.16em] text-[#b2bfff]">X²</p>
                <p className="mt-3 font-headline text-5xl font-extrabold">
                  {chiSquareResult ? formatNumber(chiSquareResult.statistic, 2) : '—'}
                </p>
                <p className="mt-4 text-sm leading-7 text-[#dde1ff]">
                  gl = {chiSquareResult?.degreesOfFreedom ?? '—'}
                </p>
              </div>
              <div className="rounded-[26px] bg-[#f5f4e8] p-6">
                <p className="text-sm leading-7 text-[#444654]">
                  {chiSquareResult
                    ? t('chiSquare.interpretationBody')
                    : t('chiSquare.interpretationPending')}
                </p>
                {chiSquareResult ? (
                  <div className="mt-4 space-y-2 text-sm leading-7 text-[#444654]">
                    <p>
                      {t('chiSquare.totalLabel')}: {formatNumber(chiSquareResult.total, 0)}
                    </p>
                    <p>
                      {t('chiSquare.rowTotalsLabel')}:{' '}
                      {chiSquareResult.rowTotals
                        .map((value) => formatNumber(value, 0))
                        .join(', ')}
                    </p>
                    <p>
                      {t('chiSquare.columnTotalsLabel')}:{' '}
                      {chiSquareResult.columnTotals
                        .map((value) => formatNumber(value, 0))
                        .join(', ')}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
