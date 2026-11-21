export type ProblemType = "fraction" | "integer" | "equation"

export type BuggyRule = {
  id: string
  type: ProblemType
  name: string
  formula: string
  tip: string
  calculate: (values: number[]) => number
}

export type Problem = {
  type: ProblemType
  values: number[]
  correct: number
}

export const rules: BuggyRule[] = [
  {
    id: "FR-ADD-01",
    type: "fraction",
    name: "Add tops and bottoms",
    formula: "(a + c) / (b + d)",
    tip: "Use fraction strips to compare the size of each piece. Pieces with different sizes cannot be joined until they share a common unit.",
    calculate: ([a, b, c, d]) => (a + c) / (b + d),
  },
  {
    id: "FR-ADD-02",
    type: "fraction",
    name: "Add tops, multiply bottoms",
    formula: "(a + c) / (b × d)",
    tip: "Draw both fractions as parts of a whole. Count the equal parts in each model and discuss why the denominator describes piece size.",
    calculate: ([a, b, c, d]) => (a + c) / (b * d),
  },
  {
    id: "FR-ADD-03",
    type: "fraction",
    name: "Keep the first denominator",
    formula: "(a + c) / b",
    tip: "Ask what the denominator counts. If the pieces change size, the number of pieces in one whole must be reconsidered.",
    calculate: ([a, b, c]) => (a + c) / b,
  },
  {
    id: "FR-ADD-04",
    type: "fraction",
    name: "Use the LCM as denominator",
    formula: "(a + c) / lcm(b, d)",
    tip: "First make equivalent fractions with a common denominator. Change each numerator too, so the value of each fraction stays the same.",
    calculate: ([a, b, c, d]) => (a + c) / lcm(b, d),
  },
  {
    id: "INT-01",
    type: "integer",
    name: "Turn subtraction into addition",
    formula: "a + b",
    tip: "Walk a number line: subtracting a positive means moving left. Show the direction and distance with a hop.",
    calculate: ([a, b]) => a + b,
  },
  {
    id: "INT-02",
    type: "integer",
    name: "Add the absolute values",
    formula: "|a| + |b|",
    tip: "Put both numbers on a number line. Opposite directions cancel; the result keeps the direction of the larger distance.",
    calculate: ([a, b]) => Math.abs(a) + Math.abs(b),
  },
  {
    id: "INT-03",
    type: "integer",
    name: "Subtract magnitudes, keep first sign",
    formula: "sign(a) × abs(|a| − |b|)",
    tip: "Compare the distances from zero, then use a number-line walk to decide which direction the result points.",
    calculate: ([a, b]) => Math.sign(a) * Math.abs(Math.abs(a) - Math.abs(b)),
  },
  {
    id: "EQ-01",
    type: "equation",
    name: "Add b instead of subtracting",
    formula: "(c + b) / a",
    tip: "Use a balance model: undo +b on both sides first, then divide both sides by a.",
    calculate: ([a, b, c]) => (c + b) / a,
  },
  {
    id: "EQ-02",
    type: "equation",
    name: "Divide before undoing +b",
    formula: "c / a − b",
    tip: "Reverse the order of operations: isolate ax by subtracting b first, then divide by a.",
    calculate: ([a, b, c]) => c / a - b,
  },
  {
    id: "EQ-03",
    type: "equation",
    name: "Multiply by a instead of divide",
    formula: "(c − b) × a",
    tip: "Substitute the proposed x back into ax + b = c. Ask which inverse operation undoes multiplication by a.",
    calculate: ([a, b, c]) => (c - b) * a,
  },
  {
    id: "EQ-04",
    type: "equation",
    name: "Stop after subtracting b",
    formula: "c − b",
    tip: "After undoing +b, x is still multiplied by a. Use a final inverse operation to get x alone.",
    calculate: ([, b, c]) => c - b,
  },
]

export function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a)
}

export function lcm(a: number, b: number): number {
  return Math.abs((a * b) / gcd(a, b))
}

export function parseAnswer(input: string): number {
  const value = input.trim()
  if (!value) throw new Error("Enter the student's answer.")
  const fraction = value.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/)
  if (fraction) {
    const numerator = Number(fraction[1])
    const denominator = Number(fraction[2])
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) throw new Error("Enter a valid number.")
    if (denominator === 0) throw new Error("A fraction denominator cannot be zero.")
    return numerator / denominator
  }
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error("Enter a number or a fraction such as 2/5.")
  return number
}

export function nearlyEqual(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-6
}

export function evaluate(problem: Problem, answer: number) {
  const applicable = rules
    .filter((rule) => rule.type === problem.type)
    .map((rule) => ({ rule, result: rule.calculate(problem.values) }))
  return { applicable, matches: applicable.filter(({ result }) => nearlyEqual(result, answer)) }
}

export function formatNumber(value: number): string {
  const rounded = Math.round(value * 1e6) / 1e6
  return Object.is(rounded, -0) ? "0" : String(rounded)
}

function fractionProblem(): Problem {
  return { type: "fraction", values: [1, 2, 1, 3], correct: 5 / 6 }
}

function integerProblem(): Problem {
  return { type: "integer", values: [-3, 5], correct: -8 }
}

function equationProblem(): Problem {
  return { type: "equation", values: [2, 3, 11], correct: 4 }
}

export const sampleProblems = [fractionProblem(), integerProblem(), equationProblem()] as const

export const sampleStudents = [
  { name: "Asha", answers: ["5/6", "-8", "4"] },
  { name: "Ravi", answers: ["2/5", "2", "7"] },
  { name: "Meera", answers: ["2/5", "-8", "7"] },
  { name: "Imran", answers: ["1/3", "-2", "4"] },
  { name: "Sunita", answers: ["2/5", "2", "8"] },
  { name: "Karan", answers: ["5/6", "8", "7"] },
  { name: "Pooja", answers: ["2/5", "-8", "4"] },
  { name: "Dev", answers: ["2/5", "2", "7"] },
  { name: "Nisha", answers: ["5/6", "-8", "16"] },
  { name: "Arjun", answers: ["2/5", "-2", "7"] },
  { name: "Tara", answers: ["1/3", "2", "2.5"] },
  { name: "Zoya", answers: ["5/6", "-8", "4"] },
] as const

export type SampleCell = {
  studentIndex: number
  problemIndex: number
  answer: string
  correct: boolean
  matchIds: string[]
}

export const sampleCells: SampleCell[][] = sampleStudents.map((student, studentIndex) =>
  student.answers.map((answer, problemIndex) => {
    const problem = sampleProblems[problemIndex]
    const parsed = parseAnswer(answer)
    const { matches } = evaluate(problem, parsed)
    return {
      studentIndex,
      problemIndex,
      answer,
      correct: nearlyEqual(parsed, problem.correct),
      matchIds: matches.map(({ rule }) => rule.id),
    }
  }),
)

export function sampleCounts(resolutions: Record<string, string>) {
  return rules.map((rule) => {
    const students = new Set<number>()
    sampleCells.forEach((row) => row.forEach((cell) => {
      const key = `${cell.studentIndex}:${cell.problemIndex}`
      const matchedRule = resolutions[key] ?? (cell.matchIds.length === 1 ? cell.matchIds[0] : undefined)
      if (matchedRule === rule.id) students.add(cell.studentIndex)
    }))
    return { rule, count: students.size }
  })
}
