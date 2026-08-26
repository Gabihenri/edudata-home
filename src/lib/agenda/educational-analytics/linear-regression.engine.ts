export interface RegressionRow {
  target: number
  features: number[]
}

export interface LinearRegressionMetrics {
  mae: number
  rmse: number
  r2: number | null
}

export interface LinearRegressionResult {
  coefficients: number[]
  intercept: number
  metrics: LinearRegressionMetrics
  trainSize: number
  testSize: number
  predictions: Array<{ actual: number; predicted: number; residual: number }>
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function transpose(matrix: number[][]) {
  return matrix[0].map((_, column) => matrix.map(row => row[column]))
}

function multiply(left: number[][], right: number[][]) {
  return left.map(row => right[0].map((_, column) => row.reduce((sum, value, index) => sum + value * right[index][column], 0)))
}

function invert(matrix: number[][]): number[][] | null {
  const size = matrix.length
  const augmented = matrix.map((row, index) => [...row, ...Array.from({ length: size }, (_, column) => index === column ? 1 : 0)])

  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    }
    if (Math.abs(augmented[pivot][column]) < 1e-10) return null
    ;[augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]]
    const divisor = augmented[column][column]
    augmented[column] = augmented[column].map(value => value / divisor)
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = augmented[row][column]
      augmented[row] = augmented[row].map((value, index) => value - factor * augmented[column][index])
    }
  }

  return augmented.map(row => row.slice(size))
}

export function runLinearRegression(rows: RegressionRow[]): LinearRegressionResult | null {
  if (rows.length < 5 || rows[0]?.features.length === 0) return null

  const splitIndex = Math.max(2, Math.min(rows.length - 1, Math.floor(rows.length * 0.8)))
  const train = rows.slice(0, splitIndex)
  const test = rows.slice(splitIndex)
  const design = train.map(row => [1, ...row.features])
  const target = train.map(row => [row.target])
  const designTranspose = transpose(design)
  const inverse = invert(multiply(designTranspose, design))
  if (!inverse) return null

  const beta = multiply(multiply(inverse, designTranspose), target).map(row => row[0])
  const predictions = test.map(row => {
    const predicted = beta[0] + row.features.reduce((sum, value, index) => sum + value * beta[index + 1], 0)
    return { actual: row.target, predicted, residual: row.target - predicted }
  })
  const actual = predictions.map(item => item.actual)
  const mae = predictions.reduce((sum, item) => sum + Math.abs(item.residual), 0) / predictions.length
  const rmse = Math.sqrt(predictions.reduce((sum, item) => sum + item.residual ** 2, 0) / predictions.length)
  const average = mean(actual)
  const total = actual.reduce((sum, value) => sum + (value - average) ** 2, 0)
  const residual = predictions.reduce((sum, item) => sum + item.residual ** 2, 0)
  const r2 = total > 0 ? 1 - residual / total : null

  return { coefficients: beta.slice(1), intercept: beta[0], metrics: { mae, rmse, r2 }, trainSize: train.length, testSize: test.length, predictions }
}
