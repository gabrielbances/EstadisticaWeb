export const anovaExampleDataset = {
  rowLabels: ['Bloque 1', 'Bloque 2', 'Bloque 3'],
  columnLabels: ['Grupo A', 'Grupo B', 'Grupo C'],
  matrix: [
    [7.56, 9.68, 11.65],
    [9.98, 9.69, 10.69],
    [7.23, 10.49, 11.77],
  ],
} as const

export const anovaPreviewRows = anovaExampleDataset.rowLabels.map((bloque, index) => ({
  bloque,
  a: anovaExampleDataset.matrix[index][0],
  b: anovaExampleDataset.matrix[index][1],
  c: anovaExampleDataset.matrix[index][2],
}))

export const chiSquareExampleDataset = {
  rowLabels: ['Grupo control', 'Grupo estudio', 'Grupo mixto'],
  columnLabels: ['A', 'B'],
  matrix: [
    [45, 55],
    [62, 38],
    [51, 49],
  ],
} as const

export const chiSquareObserved = chiSquareExampleDataset.rowLabels.map(
  (group, index) => ({
    group,
    a: chiSquareExampleDataset.matrix[index][0],
    b: chiSquareExampleDataset.matrix[index][1],
  }),
)

export const recentUsers = [
  {
    email: 'maria.garcia@galileo.edu',
    role: 'student',
    status: 'active',
    registered: '2026-04-07',
  },
  {
    email: 'carlos.perez@galileo.edu',
    role: 'student',
    status: 'pending',
    registered: '2026-04-08',
  },
  {
    email: 'admin@estadisticaweb.app',
    role: 'admin',
    status: 'active',
    registered: '2026-04-08',
  },
]
