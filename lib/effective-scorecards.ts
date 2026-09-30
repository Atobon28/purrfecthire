import { roles as baseRoles } from "./scorecards";
import type { RoleDefinition } from "./types";

const optery: RoleDefinition = {
  slug: "optery-senior-backend",
  client: "Optery",
  role: "Senior Backend Engineer",
  summary:
    "Senior backend engineer who can reason deeply about production systems, data integrity, reliability and debugging while operating with ownership in a remote async environment.",
  technical: [
    {
      id: "optery-backend-system-design",
      label: "Backend Engineering & System Design",
      area: "technical",
      weight: 22,
      priority: "critical",
      hardGate: true,
      minimumScore: 4,
      question:
        "In the live exercise, explain how you would change this unfamiliar backend when the workflow spans permissions, database changes, external services and competing performance or maintainability constraints.",
      followUps: [
        "What viable designs did you consider?",
        "What constraints made you choose one over the others?",
        "What edge cases would you test before calling it production-ready?",
      ],
      strongSignals: [
        "Compares viable designs against explicit constraints",
        "Explains consequences and trade-offs using production examples",
        "Connects design choices to working code, tests and meaningful edge cases",
      ],
      redFlags: [
        "Chooses a design without naming constraints or trade-offs",
        "Stays conceptual and cannot connect the decision to implementation or production behavior",
      ],
    },
    {
      id: "optery-data-integrity",
      label: "Databases & Data Integrity",
      area: "technical",
      weight: 22,
      priority: "critical",
      hardGate: true,
      minimumScore: 4,
      question:
        "In the live exercise, diagnose the data-integrity or concurrency problem and explain how you would prevent conflicting writes while the system remains in production.",
      followUps: [
        "What is the underlying failure mechanism?",
        "Would you use indexing, isolation, locking, a schema change or another approach? Why?",
        "How would you verify correctness and performance?",
      ],
      strongSignals: [
        "Identifies the actual failure mechanism",
        "Justifies indexing, isolation, locking or migration strategy",
        "Validates with query plans, tests or production observations",
      ],
      redFlags: [
        "Proposes a database fix without explaining why the issue occurs",
        "Cannot reason about concurrent updates, migrations or query behavior",
      ],
    },
    {
      id: "optery-distributed-reliability",
      label: "Distributed Systems & Reliability",
      area: "technical",
      weight: 22,
      priority: "critical",
      hardGate: true,
      minimumScore: 4,
      question:
        "In the live exercise, make the workflow preserve its business outcome when requests are duplicated, messages arrive late, dependencies fail or a worker dies mid-flow.",
      followUps: [
        "Where is state persisted?",
        "How do you prevent duplicate work?",
        "How do retries, acknowledgements, rate limits and reconciliation behave?",
      ],
      strongSignals: [
        "Explains state persistence and idempotency clearly",
        "Designs recovery for interrupted workflows",
        "Justifies retry, acknowledgement and reconciliation choices across concrete failures",
      ],
      redFlags: [
        "Assumes requests happen exactly once",
        "Cannot explain recovery after partial failure or duplicate processing",
      ],
    },
    {
      id: "optery-debugging-performance",
      label: "Production Debugging & Performance",
      area: "technical",
      weight: 22,
      priority: "critical",
      hardGate: true,
      minimumScore: 4,
      question:
        "In the live exercise, investigate the slow endpoint from symptoms to root cause and show how you know the fix worked.",
      followUps: [
        "What evidence creates your first hypothesis?",
        "How do you distinguish application, database and infrastructure bottlenecks?",
        "Which metric proves the change improved the system?",
      ],
      strongSignals: [
        "Turns symptoms into testable hypotheses",
        "Isolates the responsible layer using evidence",
        "Measures the impact through latency, errors, throughput or resource use and explains recurrence prevention",
      ],
      redFlags: [
        "Jumps directly to a fix without establishing root cause",
        "Cannot state how the improvement would be measured",
      ],
    },
    {
      id: "optery-cloud-infra",
      label: "Cloud & Infrastructure",
      area: "technical",
      weight: 6,
      priority: "medium",
      question:
        "Tell me about a production service you deployed or operated on AWS or comparable infrastructure and the operational decisions you personally made.",
      strongSignals: [
        "Can reason about scaling, resource allocation, monitoring, safe rollouts and recovery",
      ],
    },
    {
      id: "optery-backend-ecosystem",
      label: "Backend Ecosystem & Integrations",
      area: "technical",
      weight: 6,
      priority: "medium",
      question:
        "Which backend frameworks, queues, caches or integrations have you used deeply in production, and what implementation decisions did you personally own?",
      followUps: [
        "Have you used Django, DRF, django-ninja, Celery, RabbitMQ, Redis, Stripe or identity providers?",
        "What configuration or failure behavior did you have to understand beyond the happy path?",
      ],
      strongSignals: [
        "Shows implementation depth in relevant backend technologies",
        "Django is a positive preference, not a mandatory requirement",
      ],
      redFlags: ["Lists technologies without explaining implementation boundaries or failure behavior"],
    },
  ],
  operating: [
    {
      id: "optery-full-ownership",
      label: "Full Ownership",
      area: "operating",
      weight: 25,
      priority: "critical",
      hardGate: true,
      minimumScore: 4,
      question:
        "Tell me about a problem where you personally took responsibility for the outcome, not just for completing an assigned task.",
      followUps: ["What did you personally identify?", "What did you change?", "What was the final result?"],
      strongSignals: ["Clearly separates personal ownership from team activity and remains accountable for the result"],
      redFlags: ["Mostly describes following instructions, assigned tickets or waiting for others to define the next step"],
    },
    {
      id: "optery-builder-mindset",
      label: "0 → 1 / Builder Mindset",
      area: "operating",
      weight: 20,
      priority: "high",
      question:
        "Tell me about something you built or improved when the problem was ambiguous and there was no clear playbook.",
      followUps: ["What was undefined?", "How did you decide what to do first?", "What concrete outcome did you create?"],
      strongSignals: ["Turns ambiguous problems into concrete outcomes without requiring every decision to be predefined"],
      redFlags: ["Experience is mostly execution inside highly defined processes"],
    },
    {
      id: "optery-communication",
      label: "Communication & Ability to Explain",
      area: "operating",
      weight: 20,
      priority: "critical",
      hardGate: true,
      minimumScore: 4,
      question:
        "Walk me through a technically complex situation so I can understand both your reasoning and your personal contribution.",
      followUps: ["What did the team do versus what did you do?", "What changed because of your decision?"],
      strongSignals: ["Answers are clear and structured, distinguish personal contribution, and can go deeper without losing the main point"],
      redFlags: ["Fragmented or vague answers, buzzwords without reasoning, or inability to explain personal contribution"],
    },
    {
      id: "optery-motivation",
      label: "Motivation & Career Intent",
      area: "operating",
      weight: 15,
      priority: "high",
      question:
        "Why are you exploring a move now, and what would need to be true for Optery's stage, ownership and working model to be the right next step?",
      strongSignals: ["Specific motivation that can be meaningfully compared with the role and company environment"],
      redFlags: ["Generic motivation or expectations clearly disconnected from the role, stage, compensation or working model"],
    },
    {
      id: "optery-remote-autonomy",
      label: "Autonomy & Remote Readiness",
      area: "operating",
      weight: 20,
      priority: "critical",
      hardGate: true,
      minimumScore: 4,
      question:
        "Give me a concrete example of how you made progress independently in a remote environment when context or requirements were incomplete.",
      followUps: ["How did you organize the work?", "How did you communicate blockers?", "What did you decide without waiting for synchronous guidance?"],
      strongSignals: ["Operates independently, communicates proactively and maintains accountability asynchronously"],
      redFlags: ["Depends on frequent supervision or a highly structured synchronous environment"],
    },
  ],
  logistics: [
    {
      id: "technicalEntryUnder3Minutes",
      label: "Technical entry check: unfamiliar project running in <3 min, live and without AI",
      type: "boolean",
      requiredForPresent: true,
      rejectIfFalse: true,
    },
    {
      id: "interestConfirmed",
      label: "Genuine interest confirmed",
      type: "boolean",
      requiredForPresent: true,
      rejectIfFalse: true,
    },
    {
      id: "latamEligible",
      label: "LATAM logistics fit",
      type: "boolean",
      requiredForPresent: true,
      rejectIfFalse: true,
    },
    {
      id: "englishB2C1",
      label: "Conversational English sufficient for the U.S.-based team",
      type: "boolean",
      requiredForPresent: true,
      rejectIfFalse: true,
    },
    {
      id: "compensation",
      label: "Compensation expectations",
      type: "text",
      requiredForPresent: true,
      placeholder: "Expected compensation",
    },
    {
      id: "availability",
      label: "Availability / notice period",
      type: "text",
      requiredForPresent: true,
      placeholder: "e.g. 30 days",
    },
  ],
};

export const roles: RoleDefinition[] = baseRoles.map((role) =>
  role.slug === optery.slug ? optery : role,
);

export function getRole(slug: string) {
  return roles.find((role) => role.slug === slug);
}
