export const CHI_SQUARE_ERROR_CODES = {
  matrixTooSmall: 'CHI_SQUARE_MATRIX_TOO_SMALL',
  matrixNotRectangular: 'CHI_SQUARE_MATRIX_NOT_RECTANGULAR',
  matrixNonNumeric: 'CHI_SQUARE_MATRIX_NON_NUMERIC',
  negativeFrequency: 'CHI_SQUARE_NEGATIVE_FREQUENCY',
  totalMustBePositive: 'CHI_SQUARE_TOTAL_MUST_BE_POSITIVE',
  expectedZero: 'CHI_SQUARE_EXPECTED_ZERO',
} as const

export type ChiSquareComputation = {
  statistic: number
  degreesOfFreedom: number
  expected: number[][]
  rowTotals: number[]
  columnTotals: number[]
  total: number
}

export function validateChiSquareMatrix(matrix: number[][]) {
  if (matrix.length < 2 || matrix[0]?.length < 2) {
    throw new Error(CHI_SQUARE_ERROR_CODES.matrixTooSmall)
  }

  const expectedWidth = matrix[0].length
  for (const row of matrix) {
    if (row.length !== expectedWidth) {
      throw new Error(CHI_SQUARE_ERROR_CODES.matrixNotRectangular)
    }

    for (const value of row) {
      if (!Number.isFinite(value)) {
        throw new Error(CHI_SQUARE_ERROR_CODES.matrixNonNumeric)
      }

      if (value < 0) {
        throw new Error(CHI_SQUARE_ERROR_CODES.negativeFrequency)
      }
    }
  }
}

export function computeChiSquare(matrix: number[][]): ChiSquareComputation {
  validateChiSquareMatrix(matrix)

  const rows = matrix.length
  const cols = matrix[0].length
  const total = matrix.reduce(
    (accumulator, row) =>
      accumulator + row.reduce((rowAccumulator, value) => rowAccumulator + value, 0),
    0,
  )

  if (total <= 0) {
    throw new Error(CHI_SQUARE_ERROR_CODES.totalMustBePositive)
  }

  const rowTotals = matrix.map((row) =>
    row.reduce((accumulator, value) => accumulator + value, 0),
  )
  const columnTotals = matrix[0].map((_, columnIndex) =>
    matrix.reduce((accumulator, row) => accumulator + row[columnIndex], 0),
  )

  let statistic = 0
  const expected = matrix.map((row, rowIndex) =>
    row.map((_, columnIndex) => {
      const expectedValue = (rowTotals[rowIndex] * columnTotals[columnIndex]) / total

      if (expectedValue === 0) {
        throw new Error(CHI_SQUARE_ERROR_CODES.expectedZero)
      }

      statistic +=
        ((matrix[rowIndex][columnIndex] - expectedValue) ** 2) / expectedValue

      return expectedValue
    }),
  )

  return {
    statistic,
    degreesOfFreedom: (rows - 1) * (cols - 1),
    expected,
    rowTotals,
    columnTotals,
    total,
  }
}
