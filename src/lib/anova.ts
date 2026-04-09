export const ANOVA_ERROR_CODES = {
  matrixTooSmall: 'ANOVA_MATRIX_TOO_SMALL',
  matrixNotRectangular: 'ANOVA_MATRIX_NOT_RECTANGULAR',
  matrixNonNumeric: 'ANOVA_MATRIX_NON_NUMERIC',
} as const

export type AnovaTableRow = {
  source: 'Tratamientos' | 'Bloques' | 'Error' | 'Total'
  sumSquares: number
  degreesOfFreedom: number
  meanSquare: number | null
  varianceRatio: number | null
}

export type AnovaComputation = {
  blocks: number
  treatments: number
  total: number
  squaredSum: number
  correctionFactor: number
  rowTotals: number[]
  columnTotals: number[]
  sumSquares: {
    total: number
    treatments: number
    blocks: number
    error: number
  }
  degreesOfFreedom: {
    total: number
    treatments: number
    blocks: number
    error: number
  }
  meanSquares: {
    treatments: number
    blocks: number
    error: number
  }
  varianceRatios: {
    treatments: number | null
    blocks: number | null
  }
  table: AnovaTableRow[]
}

export function validateAnovaMatrix(matrix: number[][]) {
  if (matrix.length < 2 || matrix[0]?.length < 2) {
    throw new Error(ANOVA_ERROR_CODES.matrixTooSmall)
  }

  const expectedWidth = matrix[0].length
  for (const row of matrix) {
    if (row.length !== expectedWidth) {
      throw new Error(ANOVA_ERROR_CODES.matrixNotRectangular)
    }

    for (const value of row) {
      if (!Number.isFinite(value)) {
        throw new Error(ANOVA_ERROR_CODES.matrixNonNumeric)
      }
    }
  }
}

export function computeAnova(matrix: number[][]): AnovaComputation {
  validateAnovaMatrix(matrix)

  const blocks = matrix.length
  const treatments = matrix[0].length
  const total = matrix.reduce(
    (accumulator, row) =>
      accumulator + row.reduce((rowAccumulator, value) => rowAccumulator + value, 0),
    0,
  )
  const correctionFactor = (total ** 2) / (blocks * treatments)

  const rowTotals = matrix.map((row) =>
    row.reduce((accumulator, value) => accumulator + value, 0),
  )
  const columnTotals = matrix[0].map((_, columnIndex) =>
    matrix.reduce((accumulator, row) => accumulator + row[columnIndex], 0),
  )
  const squaredSum = matrix.reduce(
    (accumulator, row) =>
      accumulator +
      row.reduce((rowAccumulator, value) => rowAccumulator + value ** 2, 0),
    0,
  )

  const scTotal = squaredSum - correctionFactor
  const scTreatments =
    columnTotals.reduce((accumulator, value) => accumulator + value ** 2, 0) /
      blocks -
    correctionFactor
  const scBlocks =
    rowTotals.reduce((accumulator, value) => accumulator + value ** 2, 0) /
      treatments -
    correctionFactor
  const scError = scTotal - scTreatments - scBlocks

  const dfTreatments = treatments - 1
  const dfBlocks = blocks - 1
  const dfError = dfTreatments * dfBlocks
  const dfTotal = blocks * treatments - 1

  const msTreatments = scTreatments / dfTreatments
  const msBlocks = scBlocks / dfBlocks
  const msError = scError / dfError

  const varianceRatioTreatments = msError === 0 ? null : msTreatments / msError
  const varianceRatioBlocks = msError === 0 ? null : msBlocks / msError

  return {
    blocks,
    treatments,
    total,
    squaredSum,
    correctionFactor,
    rowTotals,
    columnTotals,
    sumSquares: {
      total: scTotal,
      treatments: scTreatments,
      blocks: scBlocks,
      error: scError,
    },
    degreesOfFreedom: {
      total: dfTotal,
      treatments: dfTreatments,
      blocks: dfBlocks,
      error: dfError,
    },
    meanSquares: {
      treatments: msTreatments,
      blocks: msBlocks,
      error: msError,
    },
    varianceRatios: {
      treatments: varianceRatioTreatments,
      blocks: varianceRatioBlocks,
    },
    table: [
      {
        source: 'Tratamientos',
        sumSquares: scTreatments,
        degreesOfFreedom: dfTreatments,
        meanSquare: msTreatments,
        varianceRatio: varianceRatioTreatments,
      },
      {
        source: 'Bloques',
        sumSquares: scBlocks,
        degreesOfFreedom: dfBlocks,
        meanSquare: msBlocks,
        varianceRatio: varianceRatioBlocks,
      },
      {
        source: 'Error',
        sumSquares: scError,
        degreesOfFreedom: dfError,
        meanSquare: msError,
        varianceRatio: null,
      },
      {
        source: 'Total',
        sumSquares: scTotal,
        degreesOfFreedom: dfTotal,
        meanSquare: null,
        varianceRatio: null,
      },
    ],
  }
}
