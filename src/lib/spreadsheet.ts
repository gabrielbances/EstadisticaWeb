export const SPREADSHEET_ERROR_CODES = {
  fileTooLarge: 'SPREADSHEET_FILE_TOO_LARGE',
  invalidTable: 'SPREADSHEET_INVALID_TABLE',
  matrixTooLarge: 'SPREADSHEET_MATRIX_TOO_LARGE',
  noWorksheet: 'SPREADSHEET_NO_WORKSHEET',
  readFailed: 'SPREADSHEET_READ_FAILED',
  unsupportedFormat: 'SPREADSHEET_UNSUPPORTED_FORMAT',
} as const

export const SPREADSHEET_LIMITS = {
  maxColumns: 200,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxRows: 200,
} as const

type CellValue = string | number | boolean | null | undefined

type Candidate = {
  matrix: number[][]
  rowLabels: string[]
  columnLabels: string[]
  score: number
  area: number
  hasHeaders: boolean
  hasRowLabels: boolean
}

export type ExtractedSpreadsheetTable = {
  matrix: number[][]
  rowLabels: string[]
  columnLabels: string[]
}

const isBlank = (value: CellValue) => value === null || value === undefined || String(value).trim() === ''

const parseNumericCell = (value: CellValue): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'boolean' || value === null || value === undefined) {
    return null
  }

  const normalized = String(value)
    .trim()
    .replace(/\u00a0/g, '')
    .replace(/ /g, '')

  if (!normalized) {
    return null
  }

  let nextValue = normalized
  if (nextValue.includes(',') && !nextValue.includes('.')) {
    nextValue = nextValue.replace(/,/g, '.')
  } else if (nextValue.includes(',') && nextValue.includes('.')) {
    nextValue = nextValue.replace(/,/g, '')
  }

  const parsed = Number(nextValue)
  return Number.isFinite(parsed) ? parsed : null
}

const padGrid = (rows: CellValue[][]) => {
  const width = rows.reduce((maxWidth, row) => Math.max(maxWidth, row.length), 0)
  return rows.map((row) => [...row, ...Array.from({ length: width - row.length }, () => '')])
}

const trimGrid = (rows: CellValue[][]) => {
  const grid = padGrid(rows)
  if (grid.length === 0) {
    return []
  }

  const nonEmptyRows = grid
    .map((row, index) => ({ index, hasData: row.some((cell) => !isBlank(cell)) }))
    .filter((row) => row.hasData)
    .map((row) => row.index)

  if (nonEmptyRows.length === 0) {
    return []
  }

  const top = nonEmptyRows[0]
  const bottom = nonEmptyRows[nonEmptyRows.length - 1]
  const nonEmptyColumns = grid[0]
    .map((_, columnIndex) => columnIndex)
    .filter((columnIndex) => grid.some((row) => !isBlank(row[columnIndex])))

  const left = nonEmptyColumns[0]
  const right = nonEmptyColumns[nonEmptyColumns.length - 1]

  return grid.slice(top, bottom + 1).map((row) => row.slice(left, right + 1))
}

const splitRegions = (rows: CellValue[][]): CellValue[][][] => {
  const grid = trimGrid(rows)
  if (grid.length === 0) {
    return []
  }

  const blankRows = grid
    .map((row, index) => ({ index, isBlank: row.every((cell) => isBlank(cell)) }))
    .filter((row) => row.isBlank)
    .map((row) => row.index)

  if (blankRows.length > 0) {
    const regions: CellValue[][][] = []
    let start = 0
    for (const index of [...blankRows, grid.length]) {
      const chunk = grid.slice(start, index)
      if (chunk.length > 0) {
        regions.push(...splitRegions(chunk))
      }
      start = index + 1
    }
    return regions
  }

  const blankColumns = grid[0]
    .map((_, columnIndex) => columnIndex)
    .filter((columnIndex) => grid.every((row) => isBlank(row[columnIndex])))

  if (blankColumns.length > 0) {
    const regions: CellValue[][][] = []
    let start = 0
    for (const index of [...blankColumns, grid[0].length]) {
      if (start < index) {
        const chunk = grid.map((row) => row.slice(start, index))
        regions.push(...splitRegions(chunk))
      }
      start = index + 1
    }
    return regions
  }

  return [grid]
}

const textRunWidth = (row: CellValue[], start: number) => {
  let width = 0
  for (const cell of row.slice(start)) {
    if (isBlank(cell) || parseNumericCell(cell) !== null) {
      break
    }
    width += 1
  }
  return width
}

const buildCandidate = (
  grid: CellValue[][],
  top: number,
  left: number,
  height: number,
  width: number,
  useHeaders: boolean,
): Candidate | null => {
  const matrix: number[][] = []

  for (let rowIndex = top; rowIndex < top + height; rowIndex += 1) {
    const parsedRow: number[] = []
    for (let columnIndex = left; columnIndex < left + width; columnIndex += 1) {
      const numericValue = parseNumericCell(grid[rowIndex][columnIndex])
      if (numericValue === null) {
        return null
      }
      parsedRow.push(numericValue)
    }
    matrix.push(parsedRow)
  }

  let columnLabels = Array.from({ length: width }, (_, index) => `Columna ${index + 1}`)
  let rowLabels = Array.from({ length: height }, (_, index) => `Fila ${index + 1}`)
  let score = height * width
  let hasHeaders = false
  let hasRowLabels = false

  if (useHeaders && top > 0) {
    const headerCells = Array.from(
      { length: width },
      (_, index) => grid[top - 1][left + index],
    )
    if (
      headerCells.every(
        (cell) => !isBlank(cell) && parseNumericCell(cell) === null,
      )
    ) {
      columnLabels = headerCells.map((cell) => String(cell).trim())
      hasHeaders = true
      score += 12
    }
  }

  if (left > 0) {
    const labelCells = Array.from(
      { length: height },
      (_, index) => grid[top + index][left - 1],
    )
    if (labelCells.every((cell) => !isBlank(cell))) {
      rowLabels = labelCells.map((cell) => String(cell).trim())
      hasRowLabels = true
      score += 8
    }
  }

  if (hasHeaders && hasRowLabels) {
    score += 4
  }

  return {
    matrix,
    rowLabels,
    columnLabels,
    score,
    area: height * width,
    hasHeaders,
    hasRowLabels,
  }
}

const chooseBetterCandidate = (
  current: Candidate | null,
  candidate: Candidate | null,
) => {
  if (candidate === null) {
    return current
  }

  if (current === null) {
    return candidate
  }

  const currentKey = [
    current.score,
    current.hasHeaders ? 1 : 0,
    current.hasRowLabels ? 1 : 0,
    current.area,
  ]
  const candidateKey = [
    candidate.score,
    candidate.hasHeaders ? 1 : 0,
    candidate.hasRowLabels ? 1 : 0,
    candidate.area,
  ]

  for (let index = 0; index < currentKey.length; index += 1) {
    if (candidateKey[index] > currentKey[index]) {
      return candidate
    }
    if (candidateKey[index] < currentKey[index]) {
      return current
    }
  }

  return current
}

export function extractNumericTable(rows: CellValue[][]): ExtractedSpreadsheetTable {
  const regions = splitRegions(rows)
  let best: Candidate | null = null

  for (const unpaddedRegion of regions) {
    const region = padGrid(unpaddedRegion)
    const rowCount = region.length
    const columnCount = region[0]?.length ?? 0

    if (rowCount >= 2 && columnCount >= 2) {
      const fullNumeric = buildCandidate(region, 0, 0, rowCount, columnCount, false)
      best = chooseBetterCandidate(best, fullNumeric)
    }

    for (let top = 0; top < rowCount; top += 1) {
      for (let left = 0; left < columnCount; left += 1) {
        if (parseNumericCell(region[top][left]) === null) {
          continue
        }

        let maxWidth = 0
        while (
          left + maxWidth < columnCount &&
          parseNumericCell(region[top][left + maxWidth]) !== null
        ) {
          maxWidth += 1
        }

        if (maxWidth < 2) {
          continue
        }

        let minWidth = maxWidth
        for (let height = 1; height <= rowCount - top; height += 1) {
          const currentRow = top + height - 1
          let runWidth = 0

          while (
            left + runWidth < columnCount &&
            parseNumericCell(region[currentRow][left + runWidth]) !== null
          ) {
            runWidth += 1
          }

          if (runWidth === 0) {
            break
          }

          minWidth = Math.min(minWidth, runWidth)
          if (height < 2 || minWidth < 2) {
            continue
          }

          let headerWidth = 0
          if (top > 0) {
            headerWidth = textRunWidth(region[top - 1], left)
          }

          if (headerWidth >= 2) {
            const width = Math.min(headerWidth, minWidth)
            if (width >= 2) {
              best = chooseBetterCandidate(
                best,
                buildCandidate(region, top, left, height, width, true),
              )
            }
          } else {
            best = chooseBetterCandidate(
              best,
              buildCandidate(region, top, left, height, minWidth, false),
            )
          }
        }
      }
    }
  }

  if (best === null) {
    throw new Error(SPREADSHEET_ERROR_CODES.invalidTable)
  }

  return {
    matrix: best.matrix,
    rowLabels: best.rowLabels,
    columnLabels: best.columnLabels,
  }
}

const detectDelimiter = (text: string) => {
  const candidates = [',', ';', '\t']
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 12)

  if (lines.length === 0) {
    return ','
  }

  let bestDelimiter = ','
  let bestScore = -1

  for (const delimiter of candidates) {
    const counts = lines.map((line) => line.split(delimiter).length - 1)
    const positiveCounts = counts.filter((count) => count > 0)
    if (positiveCounts.length === 0) {
      continue
    }

    const average =
      positiveCounts.reduce((accumulator, count) => accumulator + count, 0) /
      positiveCounts.length
    const consistency = positiveCounts.filter((count) => count === positiveCounts[0]).length
    const score = average * 10 + consistency

    if (score > bestScore) {
      bestScore = score
      bestDelimiter = delimiter
    }
  }

  return bestDelimiter
}

export async function loadSpreadsheetTable(
  file: File,
): Promise<ExtractedSpreadsheetTable> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (file.size > SPREADSHEET_LIMITS.maxFileSizeBytes) {
    throw new Error(SPREADSHEET_ERROR_CODES.fileTooLarge)
  }

  if (!['xlsx', 'csv', 'txt'].includes(extension)) {
    throw new Error(SPREADSHEET_ERROR_CODES.unsupportedFormat)
  }

  try {
    const XLSX = await import('xlsx')
    let workbook

    if (extension === 'xlsx') {
      const fileBuffer = await file.arrayBuffer()
      workbook = XLSX.read(fileBuffer, { type: 'array' })
    } else {
      const text = await file.text()
      workbook = XLSX.read(text, {
        type: 'string',
        FS: detectDelimiter(text),
      })
    }

    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error(SPREADSHEET_ERROR_CODES.noWorksheet)
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      blankrows: true,
      defval: '',
      header: 1,
      raw: false,
    }) as CellValue[][]

    const extractedTable = extractNumericTable(rows)

    if (
      extractedTable.matrix.length > SPREADSHEET_LIMITS.maxRows ||
      extractedTable.matrix[0]?.length > SPREADSHEET_LIMITS.maxColumns
    ) {
      throw new Error(SPREADSHEET_ERROR_CODES.matrixTooLarge)
    }

    return extractedTable
  } catch (error) {
    if (error instanceof Error && Object.values(SPREADSHEET_ERROR_CODES).includes(error.message as never)) {
      throw error
    }

    throw new Error(SPREADSHEET_ERROR_CODES.readFailed)
  }
}
