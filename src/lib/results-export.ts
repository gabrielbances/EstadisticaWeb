import type { CellObject, Range, WorkSheet } from 'xlsx-js-style'
import type { AnovaComputation } from './anova'
import type { ChiSquareComputation } from './chi-square'

type ExportCell = string | number | null
type SpreadsheetModule = typeof import('xlsx-js-style')
type CellStyle = NonNullable<CellObject['s']>

type WorkbookBase = {
  matrix: number[][]
  rowLabels: string[]
  columnLabels: string[]
  sourceFileName?: string | null
}

type AnovaWorkbookInput = WorkbookBase & {
  result: AnovaComputation
}

type ChiSquareWorkbookInput = WorkbookBase & {
  result: ChiSquareComputation
}

const COLORS = {
  ink: '1F2937',
  mutedInk: '475569',
  border: 'CBD5E1',
  white: 'FFFFFF',
  title: '0F3D66',
  section: '135D66',
  summaryLabel: 'E0ECF7',
  summaryValue: 'F8FAFC',
  firstColumn: 'EEF2F7',
  zebra: 'FAFCFF',
  headerFuente: '16324F',
  headerBlue: '2563EB',
  bodyBlue: 'E8F0FF',
  headerGreen: '2F855A',
  bodyGreen: 'EAF7F0',
  headerGold: 'B7791F',
  bodyGold: 'FFF7E6',
  headerOrange: 'C05621',
  bodyOrange: 'FFF1E8',
  headerTeal: '0F766E',
  bodyTeal: 'E6FFFB',
  headerSlate: '334155',
  bodySlate: 'F1F5F9',
} as const

const BASE_BORDER: CellStyle['border'] = {
  top: { style: 'thin', color: { rgb: COLORS.border } },
  right: { style: 'thin', color: { rgb: COLORS.border } },
  bottom: { style: 'thin', color: { rgb: COLORS.border } },
  left: { style: 'thin', color: { rgb: COLORS.border } },
}

const sanitizeFileBase = (value: string) =>
  value
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()

const buildExportFileName = (
  analysis: 'anova' | 'chi-cuadrado',
  sourceFileName?: string | null,
) => {
  const baseName = sourceFileName ? sanitizeFileBase(sourceFileName) : ''
  const prefix = baseName || analysis
  return `${prefix}_resultados.xlsx`
}

const styleFactory = ({
  fill,
  color = COLORS.ink,
  bold = false,
  horizontal = 'left',
}: {
  fill: string
  color?: string
  bold?: boolean
  horizontal?: 'left' | 'center' | 'right'
}): CellStyle => ({
  alignment: {
    horizontal,
    vertical: 'center',
  },
  border: BASE_BORDER,
  fill: {
    fgColor: { rgb: fill },
    patternType: 'solid',
  },
  font: {
    bold,
    color: { rgb: color },
    name: 'Aptos',
    sz: 11,
  },
})

const TITLE_STYLE = {
  ...styleFactory({
    fill: COLORS.title,
    color: COLORS.white,
    bold: true,
    horizontal: 'center',
  }),
  font: {
    bold: true,
    color: { rgb: COLORS.white },
    name: 'Aptos Display',
    sz: 15,
  },
} satisfies CellStyle

const SECTION_STYLE = styleFactory({
  fill: COLORS.section,
  color: COLORS.white,
  bold: true,
})

const SUMMARY_LABEL_STYLE = styleFactory({
  fill: COLORS.summaryLabel,
  color: COLORS.title,
  bold: true,
})

const SUMMARY_VALUE_STYLE = styleFactory({
  fill: COLORS.summaryValue,
  color: COLORS.ink,
  bold: true,
  horizontal: 'right',
})

const FIRST_COLUMN_STYLE = styleFactory({
  fill: COLORS.firstColumn,
  color: COLORS.ink,
  bold: true,
})

const FIRST_COLUMN_ALT_STYLE = styleFactory({
  fill: COLORS.zebra,
  color: COLORS.ink,
  bold: true,
})

const SUBHEADER_LABEL_STYLE = styleFactory({
  fill: COLORS.headerSlate,
  color: COLORS.white,
  bold: true,
})

const SUBHEADER_VALUE_STYLE = styleFactory({
  fill: COLORS.bodySlate,
  color: COLORS.ink,
  bold: true,
})

const DATA_HEADER_STYLES = [
  styleFactory({ fill: COLORS.headerSlate, color: COLORS.white, bold: true }),
  styleFactory({ fill: COLORS.headerBlue, color: COLORS.white, bold: true }),
  styleFactory({ fill: COLORS.headerGreen, color: COLORS.white, bold: true }),
  styleFactory({ fill: COLORS.headerGold, color: COLORS.white, bold: true }),
  styleFactory({ fill: COLORS.headerOrange, color: COLORS.white, bold: true }),
  styleFactory({ fill: COLORS.headerTeal, color: COLORS.white, bold: true }),
]

const DATA_BODY_STYLES = [
  styleFactory({ fill: COLORS.firstColumn, bold: true }),
  styleFactory({ fill: COLORS.bodyBlue, horizontal: 'right' }),
  styleFactory({ fill: COLORS.bodyGreen, horizontal: 'right' }),
  styleFactory({ fill: COLORS.bodyGold, horizontal: 'right' }),
  styleFactory({ fill: COLORS.bodyOrange, horizontal: 'right' }),
  styleFactory({ fill: COLORS.bodyTeal, horizontal: 'right' }),
]

const DATA_BODY_ALT_STYLES = [
  styleFactory({ fill: COLORS.zebra, bold: true }),
  styleFactory({ fill: COLORS.white, horizontal: 'right' }),
  styleFactory({ fill: 'F4FAF7', horizontal: 'right' }),
  styleFactory({ fill: 'FFF9ED', horizontal: 'right' }),
  styleFactory({ fill: 'FFF5EE', horizontal: 'right' }),
  styleFactory({ fill: 'F0FDFA', horizontal: 'right' }),
]

const NUMBER_FORMAT = '0.0000####'
const INTEGER_FORMAT = '0'

const loadStyledXlsx = async (): Promise<SpreadsheetModule> => {
  const module = await import('xlsx-js-style')
  return ('default' in module ? module.default : module) as SpreadsheetModule
}

const buildDataSheetRows = (
  matrix: number[][],
  rowLabels: string[],
  columnLabels: string[],
  rowHeaderLabel: string,
): ExportCell[][] => {
  const rows: ExportCell[][] = [['Tabla de datos'], []]
  rows.push([rowHeaderLabel, ...columnLabels])

  matrix.forEach((row, rowIndex) => {
    rows.push([
      rowLabels[rowIndex] ?? `${rowHeaderLabel} ${rowIndex + 1}`,
      ...row,
    ])
  })

  return rows
}

const buildAnovaResultsSheetRows = (
  result: AnovaComputation,
  rowLabels: string[],
  columnLabels: string[],
): ExportCell[][] => {
  const rows: ExportCell[][] = [['Resultados estadisticos'], []]

  rows.push(['Prueba', 'ANOVA'])
  rows.push(['Total', result.total])
  rows.push(['Factor de correccion', result.correctionFactor])
  rows.push([])
  rows.push(['ANOVA'])
  rows.push(['Fuente', 'SC', 'gl', 'CM', 'RV'])

  result.table.forEach((row) => {
    rows.push([
      row.source,
      row.sumSquares,
      row.degreesOfFreedom,
      row.meanSquare,
      row.varianceRatio,
    ])
  })

  rows.push([])
  rows.push(['Totales por fila'])
  rows.push(['Etiqueta', 'Total'])
  result.rowTotals.forEach((value, index) => {
    rows.push([rowLabels[index] ?? `Fila ${index + 1}`, value])
  })

  rows.push([])
  rows.push(['Totales por columna'])
  rows.push(['Etiqueta', 'Total'])
  result.columnTotals.forEach((value, index) => {
    rows.push([columnLabels[index] ?? `Columna ${index + 1}`, value])
  })

  return rows
}

const buildChiSquareResultsSheetRows = (
  result: ChiSquareComputation,
  rowLabels: string[],
  columnLabels: string[],
): ExportCell[][] => {
  const rows: ExportCell[][] = [['Resultados estadisticos'], []]

  rows.push(['Prueba', 'Chi-cuadrado'])
  rows.push(['Estadistico X2', result.statistic])
  rows.push(['Grados de libertad', result.degreesOfFreedom])
  rows.push(['Total', result.total])
  rows.push([])
  rows.push(['Totales por fila'])
  rows.push(['Etiqueta', 'Total'])
  result.rowTotals.forEach((value, index) => {
    rows.push([rowLabels[index] ?? `Fila ${index + 1}`, value])
  })

  rows.push([])
  rows.push(['Totales por columna'])
  rows.push(['Etiqueta', 'Total'])
  result.columnTotals.forEach((value, index) => {
    rows.push([columnLabels[index] ?? `Columna ${index + 1}`, value])
  })

  rows.push([])
  rows.push(['Frecuencias esperadas'])
  rows.push(['Variable', ...columnLabels])
  result.expected.forEach((row, rowIndex) => {
    rows.push([rowLabels[rowIndex] ?? `Fila ${rowIndex + 1}`, ...row])
  })

  return rows
}

const computeColumnWidths = (rows: ExportCell[][]) => {
  const widths: number[] = []

  rows.forEach((row) => {
    row.forEach((cell, index) => {
      const cellWidth = String(cell ?? '').length + 3
      widths[index] = Math.max(widths[index] ?? 12, Math.min(cellWidth, 30))
    })
  })

  return widths.map((width) => ({ wch: width }))
}

const mergeAcross = (
  worksheet: WorkSheet,
  rowIndex: number,
  endColumnIndex: number,
) => {
  worksheet['!merges'] ??= []
  worksheet['!merges'].push({
    s: { r: rowIndex, c: 0 },
    e: { r: rowIndex, c: endColumnIndex },
  } satisfies Range)
}

const setCellStyle = (
  XLSX: SpreadsheetModule,
  worksheet: WorkSheet,
  rowIndex: number,
  columnIndex: number,
  style: CellStyle,
  format?: string,
) => {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
  const cell = worksheet[address] as CellObject | undefined

  if (!cell) {
    return
  }

  cell.s = style
  if (format) {
    cell.z = format
  }
}

const setRowStyles = (
  XLSX: SpreadsheetModule,
  worksheet: WorkSheet,
  rowIndex: number,
  styles: CellStyle[],
  formatByColumn?: (columnIndex: number) => string | undefined,
) => {
  styles.forEach((style, columnIndex) => {
    setCellStyle(
      XLSX,
      worksheet,
      rowIndex,
      columnIndex,
      style,
      formatByColumn?.(columnIndex),
    )
  })
}

const getTableStyleSet = (columnCount: number, alternate: boolean) => {
  const source = alternate ? DATA_BODY_ALT_STYLES : DATA_BODY_STYLES
  return Array.from(
    { length: columnCount },
    (_, index) => source[index] ?? source[source.length - 1],
  )
}

const styleDataSheet = (
  XLSX: SpreadsheetModule,
  worksheet: WorkSheet,
  rows: ExportCell[][],
) => {
  const lastColumnIndex = Math.max(...rows.map((row) => row.length), 1) - 1
  mergeAcross(worksheet, 0, lastColumnIndex)
  setCellStyle(XLSX, worksheet, 0, 0, TITLE_STYLE)
  setRowStyles(
    XLSX,
    worksheet,
    2,
    Array.from({ length: lastColumnIndex + 1 }, (_, index) => DATA_HEADER_STYLES[index] ?? DATA_HEADER_STYLES[DATA_HEADER_STYLES.length - 1]),
  )

  for (let rowIndex = 3; rowIndex < rows.length; rowIndex += 1) {
    const alternate = rowIndex % 2 === 0
    const styles = getTableStyleSet(lastColumnIndex + 1, alternate)
    setRowStyles(
      XLSX,
      worksheet,
      rowIndex,
      styles,
      (columnIndex) => (columnIndex === 0 ? undefined : NUMBER_FORMAT),
    )
  }
}

const styleAnovaResultsSheet = (
  XLSX: SpreadsheetModule,
  worksheet: WorkSheet,
  rows: ExportCell[][],
) => {
  const rowTotalsSectionRow = rows.findIndex((row) => row[0] === 'Totales por fila')
  const columnTotalsSectionRow = rows.findIndex((row) => row[0] === 'Totales por columna')

  mergeAcross(worksheet, 0, 4)
  setCellStyle(XLSX, worksheet, 0, 0, TITLE_STYLE)

  ;[2, 3, 4].forEach((rowIndex) => {
    setCellStyle(XLSX, worksheet, rowIndex, 0, SUMMARY_LABEL_STYLE)
    setCellStyle(
      XLSX,
      worksheet,
      rowIndex,
      1,
      SUMMARY_VALUE_STYLE,
      rowIndex === 2 ? undefined : NUMBER_FORMAT,
    )
  })

  mergeAcross(worksheet, 6, 4)
  setCellStyle(XLSX, worksheet, 6, 0, SECTION_STYLE)
  setRowStyles(
    XLSX,
    worksheet,
    7,
    [
      DATA_HEADER_STYLES[0],
      DATA_HEADER_STYLES[1],
      DATA_HEADER_STYLES[2],
      DATA_HEADER_STYLES[3],
      DATA_HEADER_STYLES[4],
    ],
  )

  const anovaTableEnd = 7 + 4
  for (let rowIndex = 8; rowIndex <= anovaTableEnd; rowIndex += 1) {
    const alternate = rowIndex % 2 === 1
    setRowStyles(
      XLSX,
      worksheet,
      rowIndex,
      getTableStyleSet(5, alternate),
      (columnIndex) => {
        if (columnIndex === 0) return undefined
        if (columnIndex === 2) return INTEGER_FORMAT
        return NUMBER_FORMAT
      },
    )
  }

  mergeAcross(worksheet, rowTotalsSectionRow, 1)
  setCellStyle(XLSX, worksheet, rowTotalsSectionRow, 0, SECTION_STYLE)
  setRowStyles(XLSX, worksheet, rowTotalsSectionRow + 1, [SUBHEADER_LABEL_STYLE, SUBHEADER_VALUE_STYLE])
  for (let rowIndex = rowTotalsSectionRow + 2; rowIndex < columnTotalsSectionRow; rowIndex += 1) {
    const alternate = rowIndex % 2 === 0
    setRowStyles(
      XLSX,
      worksheet,
      rowIndex,
      [
        alternate ? FIRST_COLUMN_ALT_STYLE : FIRST_COLUMN_STYLE,
        alternate ? DATA_BODY_ALT_STYLES[1] : DATA_BODY_STYLES[1],
      ],
      (columnIndex) => (columnIndex === 1 ? NUMBER_FORMAT : undefined),
    )
  }

  mergeAcross(worksheet, columnTotalsSectionRow, 1)
  setCellStyle(XLSX, worksheet, columnTotalsSectionRow, 0, SECTION_STYLE)
  setRowStyles(XLSX, worksheet, columnTotalsSectionRow + 1, [SUBHEADER_LABEL_STYLE, SUBHEADER_VALUE_STYLE])
  for (let rowIndex = columnTotalsSectionRow + 2; rowIndex < rows.length; rowIndex += 1) {
    const alternate = rowIndex % 2 === 0
    setRowStyles(
      XLSX,
      worksheet,
      rowIndex,
      [
        alternate ? FIRST_COLUMN_ALT_STYLE : FIRST_COLUMN_STYLE,
        alternate ? DATA_BODY_ALT_STYLES[1] : DATA_BODY_STYLES[1],
      ],
      (columnIndex) => (columnIndex === 1 ? NUMBER_FORMAT : undefined),
    )
  }
}

const styleChiSquareResultsSheet = (
  XLSX: SpreadsheetModule,
  worksheet: WorkSheet,
  rows: ExportCell[][],
) => {
  const lastColumnIndex = Math.max(...rows.map((row) => row.length), 1) - 1
  const columnSectionRow = rows.findIndex((row) => row[0] === 'Totales por columna')
  const expectedSectionRow = rows.findIndex((row) => row[0] === 'Frecuencias esperadas')

  mergeAcross(worksheet, 0, Math.max(lastColumnIndex, 1))
  setCellStyle(XLSX, worksheet, 0, 0, TITLE_STYLE)

  ;[2, 3, 4, 5].forEach((rowIndex) => {
    setCellStyle(XLSX, worksheet, rowIndex, 0, SUMMARY_LABEL_STYLE)
    setCellStyle(
      XLSX,
      worksheet,
      rowIndex,
      1,
      SUMMARY_VALUE_STYLE,
      rowIndex === 2 ? undefined : rowIndex === 4 ? INTEGER_FORMAT : NUMBER_FORMAT,
    )
  })

  mergeAcross(worksheet, 7, 1)
  setCellStyle(XLSX, worksheet, 7, 0, SECTION_STYLE)
  setRowStyles(XLSX, worksheet, 8, [SUBHEADER_LABEL_STYLE, SUBHEADER_VALUE_STYLE])
  for (let rowIndex = 9; rowIndex < columnSectionRow; rowIndex += 1) {
    const alternate = rowIndex % 2 === 0
    setRowStyles(
      XLSX,
      worksheet,
      rowIndex,
      [
        alternate ? FIRST_COLUMN_ALT_STYLE : FIRST_COLUMN_STYLE,
        alternate ? DATA_BODY_ALT_STYLES[1] : DATA_BODY_STYLES[1],
      ],
      (columnIndex) => (columnIndex === 1 ? NUMBER_FORMAT : undefined),
    )
  }

  mergeAcross(worksheet, columnSectionRow, 1)
  setCellStyle(XLSX, worksheet, columnSectionRow, 0, SECTION_STYLE)
  setRowStyles(XLSX, worksheet, columnSectionRow + 1, [SUBHEADER_LABEL_STYLE, SUBHEADER_VALUE_STYLE])
  for (let rowIndex = columnSectionRow + 2; rowIndex < expectedSectionRow; rowIndex += 1) {
    const alternate = rowIndex % 2 === 0
    setRowStyles(
      XLSX,
      worksheet,
      rowIndex,
      [
        alternate ? FIRST_COLUMN_ALT_STYLE : FIRST_COLUMN_STYLE,
        alternate ? DATA_BODY_ALT_STYLES[1] : DATA_BODY_STYLES[1],
      ],
      (columnIndex) => (columnIndex === 1 ? NUMBER_FORMAT : undefined),
    )
  }

  mergeAcross(worksheet, expectedSectionRow, lastColumnIndex)
  setCellStyle(XLSX, worksheet, expectedSectionRow, 0, SECTION_STYLE)
  const expectedHeaderRow = expectedSectionRow + 1
  setRowStyles(
    XLSX,
    worksheet,
    expectedHeaderRow,
    Array.from({ length: lastColumnIndex + 1 }, (_, index) => DATA_HEADER_STYLES[index] ?? DATA_HEADER_STYLES[DATA_HEADER_STYLES.length - 1]),
  )

  for (let rowIndex = expectedHeaderRow + 1; rowIndex < rows.length; rowIndex += 1) {
    const alternate = rowIndex % 2 === 0
    setRowStyles(
      XLSX,
      worksheet,
      rowIndex,
      getTableStyleSet(lastColumnIndex + 1, alternate),
      (columnIndex) => (columnIndex === 0 ? undefined : NUMBER_FORMAT),
    )
  }
}

const createSheet = (
  XLSX: SpreadsheetModule,
  rows: ExportCell[][],
  styler: (XLSX: SpreadsheetModule, worksheet: WorkSheet, rows: ExportCell[][]) => void,
) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = computeColumnWidths(rows)
  styler(XLSX, worksheet, rows)
  return worksheet
}

export async function exportAnovaWorkbook({
  matrix,
  rowLabels,
  columnLabels,
  result,
  sourceFileName,
}: AnovaWorkbookInput) {
  const XLSX = await loadStyledXlsx()
  const workbook = XLSX.utils.book_new()
  const fileName = buildExportFileName('anova', sourceFileName)

  XLSX.utils.book_append_sheet(
    workbook,
    createSheet(
      XLSX,
      buildDataSheetRows(matrix, rowLabels, columnLabels, 'Bloque'),
      styleDataSheet,
    ),
    'Datos',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    createSheet(
      XLSX,
      buildAnovaResultsSheetRows(result, rowLabels, columnLabels),
      styleAnovaResultsSheet,
    ),
    'Resultados',
  )

  XLSX.writeFile(workbook, fileName, { compression: true })
  return fileName
}

export async function exportChiSquareWorkbook({
  matrix,
  rowLabels,
  columnLabels,
  result,
  sourceFileName,
}: ChiSquareWorkbookInput) {
  const XLSX = await loadStyledXlsx()
  const workbook = XLSX.utils.book_new()
  const fileName = buildExportFileName('chi-cuadrado', sourceFileName)

  XLSX.utils.book_append_sheet(
    workbook,
    createSheet(
      XLSX,
      buildDataSheetRows(matrix, rowLabels, columnLabels, 'Variable'),
      styleDataSheet,
    ),
    'Datos',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    createSheet(
      XLSX,
      buildChiSquareResultsSheetRows(result, rowLabels, columnLabels),
      styleChiSquareResultsSheet,
    ),
    'Resultados',
  )

  XLSX.writeFile(workbook, fileName, { compression: true })
  return fileName
}
