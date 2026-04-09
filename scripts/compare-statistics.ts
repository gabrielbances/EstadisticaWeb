import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { computeAnova } from '../src/lib/anova.ts'
import { computeChiSquare } from '../src/lib/chi-square.ts'

type Matrix = number[][]

type AnovaFixture = {
  id: string
  description: string
  matrix: Matrix
}

type ChiSquareFixture = {
  id: string
  description: string
  matrix: Matrix
}

type Fixtures = {
  anova: AnovaFixture[]
  chiSquare: ChiSquareFixture[]
}

type ComparableAnovaRow = {
  source: string
  sumSquares: number
  degreesOfFreedom: number
  meanSquare: number | null
  varianceRatio: number | null
}

type ComparableChiSquare = {
  statistic: number
  degreesOfFreedom: number
  expected: number[][]
}

type PythonResults = {
  anova: Record<string, ComparableAnovaRow[]>
  chiSquare: Record<string, ComparableChiSquare>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixturesPath = path.join(__dirname, 'statistics-fixtures.json')
const pythonHelperPath = path.join(__dirname, 'python_statistics_reference.py')
const numericTolerance = 1e-9

function normalizeAnova(matrix: Matrix): ComparableAnovaRow[] {
  return computeAnova(matrix).table.map((row) => ({
    source: row.source,
    sumSquares: row.sumSquares,
    degreesOfFreedom: row.degreesOfFreedom,
    meanSquare: row.meanSquare,
    varianceRatio: row.varianceRatio,
  }))
}

function normalizeChiSquare(matrix: Matrix): ComparableChiSquare {
  const result = computeChiSquare(matrix)

  return {
    statistic: result.statistic,
    degreesOfFreedom: result.degreesOfFreedom,
    expected: result.expected,
  }
}

function assertCloseNumber(
  label: string,
  actual: number | null,
  expected: number | null,
) {
  if (actual === null || expected === null) {
    if (actual !== expected) {
      throw new Error(`${label}: expected ${expected}, received ${actual}`)
    }
    return
  }

  if (Math.abs(actual - expected) > numericTolerance) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`)
  }
}

function compareAnovaCase(
  caseId: string,
  actual: ComparableAnovaRow[],
  expected: ComparableAnovaRow[],
) {
  if (actual.length !== expected.length) {
    throw new Error(
      `${caseId}: expected ${expected.length} filas ANOVA, received ${actual.length}`,
    )
  }

  actual.forEach((row, index) => {
    const expectedRow = expected[index]
    if (row.source !== expectedRow.source) {
      throw new Error(
        `${caseId}: expected source ${expectedRow.source}, received ${row.source}`,
      )
    }

    assertCloseNumber(`${caseId} ${row.source} SC`, row.sumSquares, expectedRow.sumSquares)
    assertCloseNumber(
      `${caseId} ${row.source} gl`,
      row.degreesOfFreedom,
      expectedRow.degreesOfFreedom,
    )
    assertCloseNumber(`${caseId} ${row.source} CM`, row.meanSquare, expectedRow.meanSquare)
    assertCloseNumber(
      `${caseId} ${row.source} RV`,
      row.varianceRatio,
      expectedRow.varianceRatio,
    )
  })
}

function compareChiSquareCase(
  caseId: string,
  actual: ComparableChiSquare,
  expected: ComparableChiSquare,
) {
  assertCloseNumber(`${caseId} statistic`, actual.statistic, expected.statistic)
  assertCloseNumber(
    `${caseId} degreesOfFreedom`,
    actual.degreesOfFreedom,
    expected.degreesOfFreedom,
  )

  if (actual.expected.length !== expected.expected.length) {
    throw new Error(
      `${caseId}: expected ${expected.expected.length} filas esperadas, received ${actual.expected.length}`,
    )
  }

  actual.expected.forEach((row, rowIndex) => {
    if (row.length !== expected.expected[rowIndex].length) {
      throw new Error(
        `${caseId}: expected ${expected.expected[rowIndex].length} columnas en fila ${rowIndex}, received ${row.length}`,
      )
    }

    row.forEach((value, columnIndex) => {
      assertCloseNumber(
        `${caseId} expected[${rowIndex}][${columnIndex}]`,
        value,
        expected.expected[rowIndex][columnIndex],
      )
    })
  })
}

async function main() {
  const fixtures = JSON.parse(
    await readFile(fixturesPath, 'utf-8'),
  ) as Fixtures

  const pythonRun = spawnSync('python3', [pythonHelperPath, fixturesPath], {
    encoding: 'utf-8',
  })

  if (pythonRun.status !== 0) {
    throw new Error(
      `Python reference failed with code ${pythonRun.status}:\n${pythonRun.stderr}`,
    )
  }

  const pythonResults = JSON.parse(pythonRun.stdout) as PythonResults

  fixtures.anova.forEach((fixture) => {
    compareAnovaCase(
      fixture.id,
      normalizeAnova(fixture.matrix),
      pythonResults.anova[fixture.id],
    )
  })

  fixtures.chiSquare.forEach((fixture) => {
    compareChiSquareCase(
      fixture.id,
      normalizeChiSquare(fixture.matrix),
      pythonResults.chiSquare[fixture.id],
    )
  })

  const totalCases = fixtures.anova.length + fixtures.chiSquare.length
  console.log(
    `Validated ${totalCases} statistical fixtures against the Python prototype.`,
  )
}

await main()
