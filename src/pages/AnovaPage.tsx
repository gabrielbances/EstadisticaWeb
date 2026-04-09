import { MatrixEditor } from '../components/MatrixEditor'
import { Download, FileUp, RotateCcw, Sigma } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { anovaExampleDataset } from '../data/mock'
import { ANOVA_ERROR_CODES, computeAnova } from '../lib/anova'
import { exportAnovaWorkbook } from '../lib/results-export'
import {
  SPREADSHEET_ERROR_CODES,
  loadSpreadsheetTable,
} from '../lib/spreadsheet'

const createInitialMatrixValues = () =>
  anovaExampleDataset.matrix.map((row) => row.map((value) => value.toString()))

export function AnovaPage() {
  const { i18n, t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [rowLabels, setRowLabels] = useState<string[]>([
    ...anovaExampleDataset.rowLabels,
  ])
  const [columnLabels, setColumnLabels] = useState<string[]>([
    ...anovaExampleDataset.columnLabels,
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
  const tableMinWidth = Math.max(860, 320 + columnLabels.length * 180)

  const formatNumber = (value: number, digits = 4) =>
    new Intl.NumberFormat(i18n.language, {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits > 2 ? 2 : digits,
    }).format(value)

  const mapAnovaError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return t('anova.validationGeneric')
    }

    if (error.message === ANOVA_ERROR_CODES.matrixTooSmall) {
      return t('anova.validationTooSmall')
    }

    if (error.message === ANOVA_ERROR_CODES.matrixNotRectangular) {
      return t('anova.validationRectangular')
    }

    if (error.message === ANOVA_ERROR_CODES.matrixNonNumeric) {
      return t('anova.validationNumeric')
    }

    return error.message
  }

  let anovaResult: ReturnType<typeof computeAnova> | null = null
  let parsedMatrix: number[][] | null = null
  let validationError: string | null = null

  try {
    parsedMatrix = matrixValues.map((row) =>
      row.map((value) => {
        const normalizedValue = value.trim().replace(',', '.')
        if (normalizedValue.length === 0) {
          throw new Error('ANOVA_EMPTY_VALUE')
        }

        const parsedValue = Number(normalizedValue)
        if (Number.isNaN(parsedValue)) {
          throw new Error(ANOVA_ERROR_CODES.matrixNonNumeric)
        }

        return parsedValue
      }),
    )

    anovaResult = computeAnova(parsedMatrix)
  } catch (error) {
    validationError =
      error instanceof Error && error.message === 'ANOVA_EMPTY_VALUE'
        ? t('anova.validationEmpty')
        : mapAnovaError(error)
  }

  const calculationSteps = anovaResult
    ? [
        {
          title: t('anova.step1Title'),
          body: `${t('anova.totalLabel')}: ${formatNumber(anovaResult.total, 2)} · ${t('anova.correctionLabel')}: ${formatNumber(anovaResult.correctionFactor)}`,
        },
        {
          title: t('anova.step2Title'),
          body: `${t('anova.treatmentsLabel')}: ${formatNumber(anovaResult.sumSquares.treatments)} · ${t('anova.blocksLabel')}: ${formatNumber(anovaResult.sumSquares.blocks)} · ${t('anova.errorLabel')}: ${formatNumber(anovaResult.sumSquares.error)}`,
        },
        {
          title: t('anova.step3Title'),
          body: `${t('anova.meanSquareLabel')}: ${formatNumber(anovaResult.meanSquares.treatments)} / ${formatNumber(anovaResult.meanSquares.error)} · ${t('anova.varianceRatioLabel')}: ${formatNumber(anovaResult.varianceRatios.treatments ?? 0)}`,
        },
      ]
    : [
        {
          title: t('anova.step1Title'),
          body: t('anova.stepPlaceholder'),
        },
        {
          title: t('anova.step2Title'),
          body: t('anova.stepPlaceholder'),
        },
        {
          title: t('anova.step3Title'),
          body: t('anova.stepPlaceholder'),
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
    setRowLabels((current) => [...current, `${t('anova.blockColumn')} ${current.length + 1}`])
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
      `${t('anova.treatmentLabel')} ${current.length + 1}`,
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
    setRowLabels([...anovaExampleDataset.rowLabels])
    setColumnLabels([...anovaExampleDataset.columnLabels])
    setMatrixValues(createInitialMatrixValues())
    setSelectedFileName(null)
    setImportMessage(null)
    setExportMessage(null)
  }

  const mapImportError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return t('anova.importReadError')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.unsupportedFormat) {
      return t('anova.importUnsupportedFormat')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.invalidTable) {
      return t('anova.importInvalidTable')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.fileTooLarge) {
      return t('anova.importFileTooLarge')
    }

    if (error.message === SPREADSHEET_ERROR_CODES.matrixTooLarge) {
      return t('anova.importMatrixTooLarge')
    }

    if (
      error.message === SPREADSHEET_ERROR_CODES.noWorksheet ||
      error.message === SPREADSHEET_ERROR_CODES.readFailed
    ) {
      return t('anova.importReadError')
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
        value: t('anova.importSuccess'),
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
    if (!parsedMatrix || !anovaResult) {
      setExportMessage({
        tone: 'error',
        value: t('anova.exportUnavailable'),
      })
      return
    }

    setIsExporting(true)
    setExportMessage(null)

    try {
      await exportAnovaWorkbook({
        matrix: parsedMatrix,
        rowLabels,
        columnLabels,
        result: anovaResult,
        sourceFileName: selectedFileName,
      })
      setExportMessage({
        tone: 'success',
        value: t('anova.exportSuccess'),
      })
    } catch {
      setExportMessage({
        tone: 'error',
        value: t('anova.exportError'),
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="max-w-5xl">
        <p className="eyebrow mb-3">Tool 01</p>
        <h1 className="page-title">{t('anova.title')}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#444654]">
          {t('anova.subtitle')}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.3fr_0.7fr]">
        <article className="atelier-panel-soft">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dde1ff] text-[#002c98]">
            <Sigma size={26} />
          </div>
          <h2 className="section-title">{t('anova.introTitle')}</h2>
          <p className="mt-4 text-sm leading-7 text-[#444654]">{t('anova.introBody')}</p>
        </article>

        <article className="atelier-panel min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">{t('anova.previewTitle')}</h2>
            <span className="status-pill bg-[#a0f399] text-[#005312]">
              {rowLabels.length} x {columnLabels.length}
            </span>
          </div>
          <MatrixEditor
            addColumnLabel={t('common.addColumn')}
            addRowLabel={t('common.addRow')}
            cellInputClassName="min-w-[8rem] rounded-xl bg-[#f5f4e8] px-3 py-2 text-center text-sm text-[#1b1c15] outline-none transition focus:bg-white focus:shadow-[0_0_0_2px_rgba(0,44,152,0.18)]"
            columnBaseLabel={t('common.column')}
            columnHeaderLabel={t('common.index')}
            columnLabels={columnLabels}
            cornerLabel={t('anova.blockColumn')}
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
            rowBaseLabel={t('anova.blockColumn')}
            rowLabels={rowLabels}
            tableMinWidth={tableMinWidth}
          />
          {validationError ? (
            <div className="mt-5 rounded-[22px] border border-[#f4c7c3] bg-[#fff3f1] px-4 py-3 text-sm leading-7 text-[#8a2b1d]">
              <p className="font-semibold">{t('anova.validationTitle')}</p>
              <p>{validationError}</p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.24fr_minmax(0,0.5fr)_0.26fr]">
        <article className="atelier-panel-soft">
          <input
            accept=".xlsx,.csv,.txt"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#002c98]">
            <FileUp size={22} />
          </div>
          <h3 className="mt-4 font-headline text-xl font-bold">{t('anova.uploadTitle')}</h3>
          <p className="mt-3 text-sm leading-7 text-[#444654]">{t('anova.uploadBody')}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              className="atelier-primary-button w-full"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {isImporting ? t('anova.importing') : t('common.upload')}
            </button>
            <button
              className="atelier-outline-button w-full"
              onClick={handleResetExample}
              type="button"
            >
              <RotateCcw size={16} />
              {t('anova.resetExample')}
            </button>
          </div>
          {selectedFileName ? (
            <p className="mt-4 text-sm leading-7 text-[#1b1c15]">
              {t('anova.loadedFileLabel')}: {selectedFileName}
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
          <p className="mt-4 text-sm leading-7 text-[#6c6d78]">{t('anova.matrixHelp')}</p>
        </article>

        <article className="atelier-panel min-w-0">
          <h2 className="section-title">{t('anova.calculatedTableTitle')}</h2>
          {anovaResult ? (
            <div className="mt-5 table-wrap">
              <table className="table-base" style={{ minWidth: '680px' }}>
                <thead>
                  <tr>
                    <th>{t('anova.sourceColumn')}</th>
                    <th>{t('anova.sumSquaresColumn')}</th>
                    <th>{t('anova.degreesFreedomColumn')}</th>
                    <th>{t('anova.meanSquareColumn')}</th>
                    <th>{t('anova.varianceRatioColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {anovaResult.table.map((row) => (
                    <tr key={row.source}>
                      <td>{row.source}</td>
                      <td>{formatNumber(row.sumSquares)}</td>
                      <td>{row.degreesOfFreedom}</td>
                      <td>
                        {row.meanSquare === null ? '—' : formatNumber(row.meanSquare)}
                      </td>
                      <td>
                        {row.varianceRatio === null ? '—' : formatNumber(row.varianceRatio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 rounded-[22px] bg-[#f5f4e8] p-4 text-sm leading-7 text-[#444654]">
              {t('anova.validationTablePending')}
            </div>
          )}
        </article>

        <article className="space-y-4">
          <div className="atelier-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">{t('anova.resultTitle')}</h2>
              <Download className="text-[#002c98]" size={18} />
            </div>
            <button
              className="atelier-primary-button w-full"
              disabled={!anovaResult || isExporting}
              onClick={handleExport}
              type="button"
            >
              {isExporting ? t('anova.exporting') : t('anova.downloadResults')}
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
            <div className="mt-4 rounded-[26px] bg-[#002c98] p-6 text-white">
              <p className="text-xs uppercase tracking-[0.16em] text-[#b2bfff]">
                {t('anova.varianceRatioHighlight')}
              </p>
              <p className="mt-3 font-headline text-5xl font-extrabold">
                {anovaResult
                  ? formatNumber(anovaResult.varianceRatios.treatments ?? 0, 2)
                  : '—'}
              </p>
              <p className="mt-4 text-sm leading-7 text-[#dde1ff]">
                {t('anova.treatmentsVsError')}
              </p>
            </div>
          </div>

          {calculationSteps.map((item, index) => (
            <div className="atelier-panel-soft" key={item.title}>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
                Paso {index + 1}
              </p>
              <p className="font-headline text-base font-bold text-[#1b1c15]">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#444654]">{item.body}</p>
            </div>
          ))}
        </article>
      </section>
    </div>
  )
}
