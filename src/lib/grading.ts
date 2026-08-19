/**
 * CBSE-style grade bands, expressed as percentage floors.
 * The school can retune these without touching any page — this table is the
 * single place grades are decided.
 */
export const GRADE_BANDS: { min: number; grade: string; point: number }[] = [
  { min: 91, grade: 'A1', point: 10 },
  { min: 81, grade: 'A2', point: 9 },
  { min: 71, grade: 'B1', point: 8 },
  { min: 61, grade: 'B2', point: 7 },
  { min: 51, grade: 'C1', point: 6 },
  { min: 41, grade: 'C2', point: 5 },
  { min: 33, grade: 'D',  point: 4 },
  { min: 0,  grade: 'E',  point: 0 },
]

export function percentage(marks: number, max: number): number {
  if (!Number.isFinite(marks) || !Number.isFinite(max) || max <= 0) return 0
  return Math.max(0, Math.min(100, (marks / max) * 100))
}

/** The 0-floor band always matches, so this never returns undefined. */
function bandFor(marks: number, max: number) {
  const pct = percentage(marks, max)
  return GRADE_BANDS.find(b => pct >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1]
}

export function gradeFor(marks: number, max: number): string {
  return bandFor(marks, max).grade
}

export function gradePoint(marks: number, max: number): number {
  return bandFor(marks, max).point
}

/** Mean grade point across subjects, to one decimal. 0 when there are none. */
export function cgpa(results: { marks: number; max: number }[]): number {
  if (!results.length) return 0
  const total = results.reduce((sum, r) => sum + gradePoint(r.marks, r.max), 0)
  return Math.round((total / results.length) * 10) / 10
}

export function isPass(marks: number, passingMarks: number): boolean {
  return Number.isFinite(marks) && marks >= passingMarks
}
