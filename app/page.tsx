"use client"

import { useMemo, useState, type FormEvent } from "react"
import { ArrowDownRight, ArrowRight, Check, ChevronDown, CircleHelp, Compass, Lightbulb, RotateCcw, Sparkles } from "lucide-react"
import {
  evaluate,
  formatNumber,
  nearlyEqual,
  parseAnswer,
  rules,
  sampleCells,
  sampleCounts,
  sampleProblems,
  sampleStudents,
  type Problem,
  type ProblemType,
} from "@/lib/engine"

type Analysis = ReturnType<typeof evaluate> & { answer: number; problem: Problem }
type Entry = { studentIndex: number; problemIndex: number }

const defaults: Record<ProblemType, string[]> = {
  fraction: ["1", "2", "1", "3"],
  integer: ["-3", "5", "", ""],
  equation: ["2", "3", "11", ""],
}
const labels: Record<ProblemType, string[]> = {
  fraction: ["Numerator · a", "Denominator · b", "Numerator · c", "Denominator · d"],
  integer: ["First integer · a", "Second integer · b"],
  equation: ["Coefficient · a", "Constant · b", "Right side · c"],
}
const examples: Record<ProblemType, { values: string[]; answer: string }> = {
  fraction: { values: ["1", "2", "1", "3"], answer: "2/5" },
  integer: { values: ["-3", "5", "", ""], answer: "2" },
  equation: { values: ["2", "3", "11", ""], answer: "7" },
}

function buildProblem(type: ProblemType, values: string[]): Problem {
  const nums = (type === "fraction" ? values.slice(0, 4) : type === "integer" ? values.slice(0, 2) : values.slice(0, 3)).map((value) => {
    if (!value.trim()) throw new Error("Fill in every problem value first.")
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) throw new Error("Enter a valid number for each value.")
    return parsed
  })
  if (type === "fraction") {
    if (nums.some((n) => !Number.isInteger(n))) throw new Error("Fraction numerators and denominators must be whole numbers.")
    if (nums[1] === 0 || nums[3] === 0) throw new Error("A denominator cannot be zero.")
    const [a, b, c, d] = nums
    return { type, values: nums, correct: (a * d + c * b) / (b * d) }
  }
  if (type === "integer") return { type, values: nums, correct: nums[0] - nums[1] }
  if (nums[0] === 0) throw new Error("The coefficient a cannot be zero.")
  return { type, values: nums, correct: (nums[2] - nums[1]) / nums[0] }
}

export default function Page() {
  const [tab, setTab] = useState<"analyse" | "class">("analyse")
  const [type, setType] = useState<ProblemType>("fraction")
  const [values, setValues] = useState(defaults.fraction)
  const [answer, setAnswer] = useState("5/6")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState<Record<string, { yes: number; no: number }>>({})
  const [resolutions, setResolutions] = useState<Record<string, string>>({})
  const [group, setGroup] = useState<"reteach" | "small" | null>(null)

  const counts = useMemo(() => sampleCounts(resolutions), [resolutions])
  const rankedCounts = useMemo(() => [...counts].sort((a, b) => b.count - a.count || a.rule.id.localeCompare(b.rule.id)), [counts])
  const top = rankedCounts[0]

  function changeType(next: ProblemType) {
    setType(next)
    setValues(defaults[next])
    setAnalysis(null)
    setError("")
  }

  function loadExample() {
    const example = examples[type]
    setValues(example.values)
    setAnswer(example.answer)
    setError("")
    try {
      const problem = buildProblem(type, example.values)
      const parsed = parseAnswer(example.answer)
      setAnalysis({ ...evaluate(problem, parsed), answer: parsed, problem })
    } catch {
      setAnalysis(null)
    }
  }

  function analyse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    try {
      const problem = buildProblem(type, values)
      const parsed = parseAnswer(answer)
      setAnalysis({ ...evaluate(problem, parsed), answer: parsed, problem })
    } catch (caught) {
      setAnalysis(null)
      setError(caught instanceof Error ? caught.message : "Check the values and try again.")
    }
  }

  function updateFeedback(id: string, kind: "yes" | "no") {
    setFeedback((current) => ({
      ...current,
      [id]: { yes: current[id]?.yes ?? 0, no: current[id]?.no ?? 0, [kind]: (current[id]?.[kind] ?? 0) + 1 },
    }))
  }

  function chooseResolution(entry: Entry, ruleId: string) {
    setResolutions((current) => ({ ...current, [`${entry.studentIndex}:${entry.problemIndex}`]: ruleId }))
    setGroup(null)
  }

  function resultForCell(entry: Entry) {
    const cell = sampleCells[entry.studentIndex][entry.problemIndex]
    const key = `${entry.studentIndex}:${entry.problemIndex}`
    if (cell.correct) return <span className="chip chip-correct"><Check size={12} /> Correct</span>
    if (cell.matchIds.length === 0) return <span className="chip chip-neutral"><CircleHelp size={12} /> Unmatched</span>
    if (cell.matchIds.length === 1) return <span className="chip chip-rule">{cell.matchIds[0]}</span>
    const selected = resolutions[key]
    if (selected) return <span className="chip chip-rule">{selected}<span className="resolved-note">resolved</span></span>
    return <div className="ambiguous-cell"><span className="chip chip-ambiguous">Choose a rule</span><div className="resolve-options" aria-label={`Resolve ${sampleStudents[entry.studentIndex].name}'s answer`}>
      {cell.matchIds.map((id) => <button key={id} onClick={() => chooseResolution(entry, id)} className="resolve-option">{id}</button>)}
    </div></div>
  }

  function showGroup(kind: "reteach" | "small") {
    setGroup(kind)
    if (typeof document !== "undefined") document.getElementById("group-note")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  const matchedIds = analysis?.matches.map(({ rule }) => rule.id) ?? []
  const isCorrect = analysis ? nearlyEqual(analysis.answer, analysis.problem.correct) : false

  return (
    <main className="min-h-screen px-4 pb-8 pt-5 sm:px-7 sm:pt-7">
      <div className="page-shell mx-auto max-w-[1180px]">
        <header>
          <div className="flex items-center justify-between gap-3">
            <a className="brand-lockup" href="#top" aria-label="Bhool Map home"><span className="brand-icon"><Compass size={19} strokeWidth={2.3} /></span><span>bhool<span className="brand-light">map</span></span><span className="brand-divider" /><span className="brand-kicker">TEACHER TOOLKIT</span></a>
            <div className="private-pill"><span className="live-dot" /> Local &amp; private</div>
          </div>
          <section id="top" className="hero-grid">
            <div><div className="eyebrow"><span className="eyebrow-line" /> MATHS · CLASS 6—8</div><h1>Find the idea behind<br className="hidden sm:block" /> the <span>wrong answer.</span></h1><p className="hero-copy">Every answer leaves a trail. Follow it to the thinking, then turn a mistake into a teachable moment.</p></div>
            <div className="hero-note"><div className="note-pin" /><span className="eyebrow">A BETTER QUESTION</span><p>“What rule were you following?”</p><span className="note-caption">Start with curiosity, not correction.</span><ArrowDownRight className="note-arrow" size={20} /></div>
          </section>
        </header>

        <nav className="tabs" role="tablist" aria-label="Bhool Map tools">
          <button id="analyse-tab" type="button" role="tab" aria-selected={tab === "analyse"} aria-controls="analyse-panel" onClick={() => setTab("analyse")} className={`tab-button ${tab === "analyse" ? "tab-active" : ""}`}><span className="tab-number">01</span> Analyse</button>
          <button id="class-tab" type="button" role="tab" aria-selected={tab === "class"} aria-controls="class-panel" onClick={() => setTab("class")} className={`tab-button ${tab === "class" ? "tab-active" : ""}`}><span className="tab-number">02</span> Class map <span className="sample-mark">SAMPLE</span></button>
          <div className="tab-endnote">Notice the pattern. Nurture the learner.</div>
        </nav>

        {tab === "analyse" ? <section id="analyse-panel" role="tabpanel" aria-labelledby="analyse-tab" className="content-enter">
          <div className="two-col">
            <section className="surface problem-surface">
              <div className="section-heading"><div><div className="step-kicker"><span>01</span> SET UP THE QUESTION</div><h2>Start with the problem.</h2><p>Enter the values and what the student wrote.</p></div><span className="section-icon"><Sparkles size={17} /></span></div>
              <form onSubmit={analyse} noValidate>
                <label className="input-label" htmlFor="problem-type">Problem type</label>
                <div className="select-wrap"><select id="problem-type" value={type} onChange={(event) => changeType(event.target.value as ProblemType)}><option value="fraction">Add fractions · a/b + c/d</option><option value="integer">Subtract integers · a − b</option><option value="equation">Solve · ax + b = c</option></select><ChevronDown size={16} aria-hidden="true" /></div>
                <div className="value-grid">{labels[type].map((label, index) => <div className="field" key={label}><label className="input-label" htmlFor={`value-${index}`}>{label}</label><input id={`value-${index}`} inputMode="decimal" value={values[index]} onChange={(event) => setValues((current) => current.map((v, i) => i === index ? event.target.value : v))} placeholder="e.g. 3" /></div>)}</div>
                <div className="answer-field"><label className="input-label" htmlFor="student-answer">Student&apos;s answer</label><input id="student-answer" inputMode="decimal" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="e.g. 2/5, −8, 2.5" /><span className="field-hint">Whole numbers, decimals, or fractions like 2/5</span></div>
                {error && <p role="alert" className="form-error">{error}</p>}
                <div className="form-actions"><button type="submit" className="button-primary">Analyse answer <ArrowRight size={16} /></button><button type="button" className="button-quiet" onClick={loadExample}><RotateCcw size={14} /> Load example</button></div>
              </form>
            </section>

            <section className="surface diagnosis-surface" aria-live="polite">
              <div className="section-heading"><div><div className="step-kicker"><span>02</span> FOLLOW THE TRAIL</div><h2>Find the thinking.</h2><p>Let the answer reveal the rule.</p></div><span className="section-icon"><Lightbulb size={17} /></span></div>
              {!analysis ? <div className="empty-diagnosis"><span className="empty-glyph">?</span><p>Your answer trail starts here.</p><span>Choose a problem and analyse an answer.</span><div className="empty-rule" /></div> : isCorrect ? <div className="diagnosis-body"><span className="verdict verdict-good"><Check size={14} /> CORRECT</span><h3>That answer checks out.</h3><p className="diagnosis-copy">The correct result is <strong>{formatNumber(analysis.problem.correct)}</strong>. Make space for the student to explain how they knew.</p><div className="correct-stamp"><span>✓</span><div><strong>Sound thinking</strong><small>Reasoning matters as much as the result.</small></div></div></div> : <div className="diagnosis-body">
                {analysis.matches.length === 1 ? <span className="verdict verdict-high"><span className="verdict-dot" /> HIGH CONFIDENCE</span> : analysis.matches.length > 1 ? <span className="verdict verdict-medium"><span className="verdict-dot" /> TEACHER PICKS</span> : <span className="verdict verdict-flag"><CircleHelp size={14} /> NEEDS A CLOSER LOOK</span>}
                <h3>{analysis.matches.length === 1 ? "One rule fits the answer." : analysis.matches.length > 1 ? "A few rules could fit." : "No rule matched this one."}</h3>
                <p className="diagnosis-copy">{analysis.matches.length === 1 ? `${analysis.matches[0].rule.id} produces ${formatNumber(analysis.answer)}. A strong clue to the student's rule.` : analysis.matches.length > 1 ? "Ask the student to explain their steps, then choose the idea that fits." : "Flag this for teacher review. The student may be using a different idea."}</p>
                <div className="match-list">{analysis.matches.map(({ rule, result }, index) => <article className="rule-card" key={rule.id} style={{ animationDelay: `${index * 75}ms` }}>
                  <div className="rule-card-top"><span className="rule-badge">{rule.id}</span><span className="match-mark"><Check size={13} /> MATCH</span></div><h4>{rule.name}</h4><div className="rule-formula">{rule.formula} <span>=</span> <strong>{formatNumber(result)}</strong></div><div className="reteach-tip"><span className="tip-mark"><Lightbulb size={13} /></span><p><b>3-minute reteach</b>{rule.tip}</p></div>
                  <div className="feedback-row"><button type="button" onClick={() => updateFeedback(rule.id, "yes")} className="feedback-button">Yes, that&apos;s it <span>{feedback[rule.id]?.yes ?? 0}</span></button><button type="button" onClick={() => updateFeedback(rule.id, "no")} className="feedback-button">Not this <span>{feedback[rule.id]?.no ?? 0}</span></button><span className="feedback-label">TEACHER FEEDBACK</span></div>
                </article>)}</div>
              </div>}
            </section>
          </div>

          <section className="surface replay-surface"><div className="replay-heading"><div><div className="step-kicker"><span>03</span> THE ANSWER REPLAY</div><h2>See every rule, side by side.</h2><p>Every buggy rule runs against the problem. Matching result? Highlighted.</p></div><span className="replay-stamp">RULE ENGINE <span>·</span> LIVE</span></div>
            {analysis ? <div className="table-scroll"><table className="replay-table"><thead><tr><th>BUGGY RULE</th><th>WHAT IT DOES</th><th>ITS ANSWER</th><th>TRAIL</th></tr></thead><tbody>{analysis.applicable.map(({ rule, result }) => <tr key={rule.id} className={matchedIds.includes(rule.id) ? "replay-hit" : ""}><td><span className="table-rule-id">{rule.id}</span></td><td>{rule.name}</td><td className="table-result">{formatNumber(result)}</td><td>{matchedIds.includes(rule.id) ? <span className="table-match"><span /> Match</span> : <span className="table-no-match">—</span>}</td></tr>)}</tbody></table></div> : <div className="replay-empty"><div className="replay-empty-icon"><ArrowDownRight size={18} /></div><span>Run an analysis to compare the answer against every rule.</span></div>}
          </section>
        </section> : <section id="class-panel" role="tabpanel" aria-labelledby="class-tab" className="content-enter">
          <div className="class-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> CLASSROOM SNAPSHOT · 3 QUESTIONS</div><h2>Zoom out. See the pattern.</h2><p>Each student answer passes through the same rule engine. Nothing is pre-labelled.</p></div><div className="sample-badge"><span className="sample-badge-dot" /> SAMPLE DATA <span>12 learners</span></div></div>
          <div className="class-grid">
            <section className="surface chart-surface"><div className="section-heading"><div><div className="step-kicker"><span>01</span> MISCONCEPTION MAP</div><h3>Which rules are showing up?</h3><p>Unique students · out of 12</p></div><span className="chart-icon"><Compass size={17} /></span></div>
              <div className="chart-list">{rankedCounts.map(({ rule, count }, index) => <div className="chart-row" key={rule.id}><span className="chart-id">{rule.id}</span><div className="chart-track"><div className={`chart-fill ${index === 0 && count >= 4 ? "chart-fill-top" : ""}`} style={{ width: `${(count / sampleStudents.length) * 100}%` }} /></div><span className="chart-count"><strong>{count}</strong><small>of 12</small></span></div>)}</div>
              {top && top.count >= 4 ? <div className="intervention-actions"><button type="button" className="button-primary" onClick={() => showGroup("reteach")}><Lightbulb size={15} /> Reteach to everyone <span>{top.rule.id}</span></button><button type="button" className="button-quiet group-button" onClick={() => showGroup("small")}><span className="group-people">↗</span> Build a small group</button></div> : <p className="threshold-note">A reteach suggestion appears when one rule reaches 4 students.</p>}
              <div className="group-output" id="group-note" aria-live="polite">{group && top && top.count >= 4 && (() => {
                const affected = new Set<number>()
                sampleCells.forEach((row) => row.forEach((cell) => {
                  const key = `${cell.studentIndex}:${cell.problemIndex}`
                  const selected = resolutions[key] ?? (cell.matchIds.length === 1 ? cell.matchIds[0] : undefined)
                  if (selected === top.rule.id) affected.add(cell.studentIndex)
                }))
                const names = [...affected].map((index) => sampleStudents[index].name)
                const targetProblemIndex = top.rule.type === "fraction" ? 0 : top.rule.type === "integer" ? 1 : 2
                const peers = [...new Set(sampleCells.flatMap((row) => row.filter((cell) => cell.problemIndex === targetProblemIndex && cell.correct).map((cell) => cell.studentIndex)))].map((index) => sampleStudents[index].name)
                return <div className="group-note"><div className="group-note-heading"><span>{group === "small" ? "SMALL GROUP" : "RETEACH PLAN"}</span><button type="button" onClick={() => setGroup(null)} aria-label="Close group suggestion">×</button></div><p>{group === "small" ? <>Bring together <strong>{names.join(", ")}</strong> to unpack <strong>{top.rule.id}</strong>. Invite peers who got the fraction problem right—<strong>{peers.join(", ")}</strong>—to share their visual strategy.</> : <>A 3-minute visual reteach for <strong>{top.rule.id}</strong> could support <strong>{names.join(", ")}</strong>. Model the idea, then ask everyone to explain the rule in their own words.</>}</p></div>
              })()}</div>
            </section>

            <section className="surface roster-surface"><div className="section-heading roster-heading"><div><div className="step-kicker"><span>02</span> STUDENT ANSWERS</div><h3>Every learner has a story.</h3><p>Tap to resolve an ambiguous answer. It stays uncounted until you decide.</p></div><span className="class-count">12 <span>STUDENTS</span></span></div>
              <div className="roster-scroll"><table className="roster-table"><thead><tr><th>STUDENT</th><th>½ + ⅓</th><th>−3 − 5</th><th>2x + 3</th></tr></thead><tbody>{sampleStudents.map((student, studentIndex) => <tr key={student.name}><td className="student-name"><span className={`avatar avatar-${studentIndex % 5}`}>{student.name[0]}</span>{student.name}</td>{student.answers.map((studentAnswer, problemIndex) => <td key={problemIndex}><div className="student-cell"><span className="raw-answer">{studentAnswer}</span>{resultForCell({ studentIndex, problemIndex })}</div></td>)}</tr>)}</tbody></table></div>
              <div className="roster-legend"><span><i className="legend-dot legend-correct" /> Correct</span><span><i className="legend-dot legend-rule" /> Rule matched</span><span><i className="legend-dot legend-ambiguous" /> Needs your call</span><span><i className="legend-dot legend-neutral" /> Unmatched</span></div>
            </section>
          </div>
        </section>}

        <footer className="app-footer"><div className="footer-brand"><span className="footer-mark">b/</span> Bhool Map <span>·</span> Made for curious classrooms</div><p>Rules run in your browser. No data leaves this page. Photo reading and Hindi are planned, not in this prototype.</p><span className="footer-no-network">OFFLINE-FIRST <span>✳</span></span></footer>
      </div>
    </main>
  )
}
