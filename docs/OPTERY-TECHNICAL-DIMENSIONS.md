# 🧭 Optery — What We Evaluate in Each Technical Dimension

> **Purpose:** define exactly what Optery evaluates in each technical dimension across the experience-based Technical Screening and the 45–60 minute Live Technical Assessment.

## Evaluation structure

- **Technical Screening:** experience-based. The interviewer asks for real production examples, personal ownership, reasoning, trade-offs, and evidence.
- **Technical Assessment:** 45–60 minutes, live and without AI. The candidate works in an unfamiliar backend and must demonstrate the same dimensions through execution.
- **Practical gate:** the live assessment is a separate Pass / Fail gate. A practical Fail means Do not present; it is not averaged with the screening score.
- **Automatic Fail:** confidently making an incorrect claim about transactions, locks, isolation, or SQL behavior during the assessment.

---

## 1. Backend Engineering & System Design

### What we evaluate in the Technical Screening

Whether the candidate can explain a real production backend they personally changed or designed when multiple constraints were in conflict — for example database changes, external services, permissions, performance, maintainability, or delivery speed.

**We look for**
- Comparison of viable designs against explicit constraints.
- Clear trade-offs and consequences.
- Connection between architecture decisions and implementation, tests, and edge cases.
- Clear separation of the candidate's personal ownership from team activity.

### What we evaluate in the Live Technical Assessment

Whether the candidate can understand an unfamiliar workflow, identify an important production risk, implement a meaningful change, and explain why the chosen approach is appropriate.

**Live evidence**
- Understands the system before changing it.
- Identifies the most important risk rather than fixing random details.
- Produces working code or a coherent implementation path.
- Explains at least one viable alternative and why it was not chosen.
- Connects the solution to tests and meaningful edge cases.

### Strong fit
- Reasons from constraints instead of generic best practices.
- Makes technically sound trade-offs.
- Can move from architecture to implementation details.

### Disqualifying signals
- Chooses a design without naming constraints or trade-offs.
- Remains conceptual and cannot connect decisions to production behavior.
- Cannot explain personal contribution.

---

## 2. Databases & Data Integrity

### What we evaluate in the Technical Screening

Whether the candidate can reason correctly about a real production data-integrity or concurrency problem, including the actual failure mechanism and why the chosen database strategy made it safe.

**We probe for**
- Concurrent writes and race conditions.
- Transactions and transaction boundaries.
- Locking and isolation.
- Constraints, migrations, indexes, and query behavior.
- How correctness and performance were verified.

### What we evaluate in the Live Technical Assessment

The exercise includes a scenario where two workers may act on the same non-completed row. The candidate must identify what can become inconsistent and make concurrent processing safe using a justified database-backed mechanism.

**Live evidence**
- Identifies the actual race/data-integrity problem.
- Uses an appropriate mechanism such as an atomic state transition, row-level locking in a production database, a constraint, transaction boundary, or another justified ownership mechanism.
- Explains why the solution prevents the failure.
- Explains how correctness and performance would be verified.

### Strong fit
- Identifies the failure mechanism before choosing a tool.
- Correctly reasons about concurrency and transaction boundaries.
- Validates database decisions with tests, query plans, or production observations.

### Disqualifying signals
- Says “use a transaction” or “use a lock” without explaining why it solves the failure.
- Cannot reason about concurrent updates, migrations, or query behavior.
- **Automatic practical Fail:** confidently makes an incorrect claim about transactions, locks, isolation, or SQL behavior.

---

## 3. Distributed Systems & Reliability

### What we evaluate in the Technical Screening

Whether the candidate has personally owned workflows where retries, duplicate requests, late messages, dependency failures, worker crashes, or partial success could create the wrong business outcome.

**We probe for**
- Where state was persisted.
- Idempotency and duplicate prevention.
- Retry and acknowledgement behavior.
- Recovery after interruption.
- Reconciliation and ambiguous outcomes.

### What we evaluate in the Live Technical Assessment

The exercise includes a scenario where an external side effect can succeed before the application records success. A worker can then crash and a retry may repeat the action.

**Live evidence**
- Recognizes the duplicate-side-effect risk.
- Uses persisted idempotency, provider-side idempotency, explicit operation state, reconciliation, or another concrete mechanism.
- Explains what state must survive retries.
- Handles ambiguous timeouts instead of assuming the system always knows whether the provider succeeded.

### Strong fit
- Designs around concrete failure modes.
- Explains recovery and state transitions clearly.
- Does not assume exactly-once execution.

### Disqualifying signals
- Treats retries alone as a reliability strategy.
- Assumes requests happen exactly once.
- Cannot explain recovery after partial failure or duplicate processing.

---

## 4. Production Debugging & Performance

### What we evaluate in the Technical Screening

Whether the candidate has personally driven a real production incident from symptom to hypothesis, evidence, root cause, fix, and measurable verification.

**Required probes**
- How they distinguish application, database, and infrastructure bottlenecks.
- How they inspect and explain SQL generated by an ORM.
- What changes when a path operates over roughly **10M rows**, including memory, query shape, fetching strategy, pagination/materialization, and resource use.
- Which metric proves the system improved.

### What we evaluate in the Live Technical Assessment

The candidate investigates a slow endpoint without being told the root cause and must demonstrate a disciplined debugging process.

**Live evidence**
- Builds and tests hypotheses rather than guessing.
- Inspects queries or query plans instead of treating the ORM as a black box.
- Explains the SQL generated behind the ORM.
- Reasons correctly about memory and query behavior at roughly 10M rows.
- Implements or explains the fix and verifies improvement with before/after evidence.

### Strong fit
- Moves from symptoms to evidence-based root cause analysis.
- Understands ORM behavior at the SQL layer.
- Reasons concretely about scale and memory.
- Uses latency, query count/plans, throughput, errors, or resource use to prove improvement.

### Disqualifying signals
- Jumps directly to optimization without establishing root cause.
- Cannot explain the SQL generated by the ORM.
- Treats loading or iterating over roughly 10M rows as harmless without reasoning about memory/query cost.
- Cannot define how to prove the change improved the system.

---

## How evidence is recorded

For every dimension, record:
- What the candidate solved or demonstrated independently.
- Where hints or support were needed.
- Observable evidence from the answer or live implementation.
- What was not tested or could not be validated.
- A 1–5 dimension score as supporting evidence.

> ⚠️ **Important:** the 1–5 scores do not average away a practical failure. The final live Pass / Fail gate remains explicit.
