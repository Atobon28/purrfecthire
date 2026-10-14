import type { RoleDefinition } from "./types";

export const roles: RoleDefinition[] = [
  {
    slug: "prosights-cto",
    client: "ProSights",
    role: "CTO",
    summary:
      "Technical cofounder-level operator combining deep engineering, 0→1 ownership, customer judgment and leadership.",
    technical: [
      {
        id: "prosights-technical-depth",
        label: "Technical depth & architecture",
        area: "technical",
        weight: 30,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "Tell me about the most technically difficult system you've personally architected and brought into production.",
        followUps: [
          "What made it difficult?",
          "What were the biggest architectural trade-offs?",
          "What did you personally own versus what did the team own?",
          "What broke in production and how did you respond?",
          "If you rebuilt it today, what would you do differently?",
        ],
        strongSignals: [
          "Deep architecture reasoning",
          "Clear trade-offs",
          "Production experience and failure modes",
          "Strong personal contribution",
        ],
        redFlags: [
          "Only speaks conceptually",
          "Cannot explain trade-offs",
          "Has not personally shipped complex systems",
        ],
      },
      {
        id: "prosights-hands-on",
        label: "Hands-on engineering",
        area: "technical",
        weight: 25,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "What technical work have you personally owned recently, and what would you expect to own in your first 90 days here?",
        followUps: [
          "How recently have you coded?",
          "How do you debug production issues?",
          "How do you review architecture and code?",
        ],
        strongSignals: ["Can move comfortably between strategy, architecture and code"],
        redFlags: ["Has effectively become a non-technical executive"],
      },
      {
        id: "prosights-product-judgment",
        label: "Product & technical judgment",
        area: "technical",
        weight: 25,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "Tell me about a time when the technically interesting solution wasn't actually the right product decision. What did you do?",
        strongSignals: [
          "Balances speed, quality, customer impact and business context",
          "Can simplify rather than over-engineer",
        ],
      },
      {
        id: "prosights-ai-enterprise",
        label: "AI / enterprise systems understanding",
        area: "technical",
        weight: 20,
        priority: "high",
        question:
          "Given where AI is today, where do you think AI actually creates durable value inside enterprise software?",
        followUps: ["What do companies get wrong when they try to build AI products?"],
        strongSignals: [
          "Reliability and evaluation awareness",
          "Data quality and workflow integration",
          "Understands AI limitations beyond buzzwords",
        ],
      },
    ],
    operating: [
      {
        id: "prosights-founder-ownership",
        label: "Founder / builder mindset & ownership",
        area: "operating",
        weight: 30,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "What is the thing you've built that you're most proud of, and what was your actual ownership in it?",
        followUps: [
          "What did you personally decide?",
          "How did you operate with incomplete information?",
          "What was outside your formal job description that you still owned?",
        ],
        redFlags: [
          "Talks mainly about what the team did",
          "Needs clearly defined responsibilities",
          "Avoids ambiguity",
        ],
      },
      {
        id: "prosights-customer-judgment",
        label: "Customer-facing technical judgment",
        area: "operating",
        weight: 25,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "Tell me about a time you personally worked with a demanding customer or stakeholder on a technical problem.",
        followUps: [
          "Did they initially ask for the right thing?",
          "How did you identify the real problem?",
          "How involved were you personally in solving it?",
        ],
        strongSignals: [
          "Translates customer language into technical problems",
          "Challenges assumptions respectfully",
          "Can own the technical relationship",
        ],
      },
      {
        id: "prosights-leadership-hiring",
        label: "Leadership & hiring",
        area: "operating",
        weight: 20,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "If you joined an eight-person company with four engineers and needed to grow engineering from 4 to 15, how would you approach the first six months?",
        followUps: [
          "What would you hire for first?",
          "What would you personally continue to own?",
          "What would you deliberately delegate?",
        ],
      },
      {
        id: "prosights-startup-zero-one",
        label: "Startup / 0→1 experience",
        area: "operating",
        weight: 15,
        priority: "high",
        hardGate: true,
        minimumScore: 4,
        question: "Tell me about something you built from scratch when the path was not defined.",
        followUps: [
          "What was undefined when you started?",
          "How did you decide what to build?",
          "What did you personally own?",
        ],
      },
      {
        id: "prosights-founder-motivation",
        label: "Motivation / founder-level fit",
        area: "operating",
        weight: 10,
        priority: "high",
        hardGate: true,
        minimumScore: 4,
        question: "What would make you seriously consider leaving your current role?",
        followUps: [
          "What do you want to be building three to five years from now?",
          "What would need to be true in three years for this to feel like an incredible decision?",
        ],
      },
    ],
    logistics: [
      {
        id: "interestConfirmed",
        label: "Genuine interest confirmed",
        type: "boolean",
        requiredForPresent: true,
        rejectIfFalse: true,
      },
      {
        id: "nycCommitment",
        label: "NYC / in-person commitment",
        type: "boolean",
        requiredForPresent: true,
        rejectIfFalse: true,
      },
      {
        id: "compensation",
        label: "Compensation expectations",
        type: "text",
        requiredForPresent: true,
        placeholder: "e.g. $___ base / equity expectations",
      },
      {
        id: "availability",
        label: "Availability / notice period",
        type: "text",
        requiredForPresent: true,
        placeholder: "e.g. 30 days",
      },
    ],
  },
  {
    slug: "casa-founding-engineer",
    client: "Casa Health",
    role: "Founding Engineer",
    summary:
      "Hands-on founding engineer at the intersection of production AI, healthcare workflows, full-stack engineering and startup ownership.",
    technical: [
      {
        id: "casa-production-ai",
        label: "Production AI / LLM / agent experience",
        area: "technical",
        weight: 30,
        priority: "critical",
        gateLabel: "Combined gate · AI or RCM",
        question:
          "Tell me about the most interesting production system you've built using LLMs or AI. What did it actually do?",
        followUps: [
          "How long have you worked hands-on with production AI or agentic systems?",
          "What part did you personally build?",
          "Which models did you use and why?",
          "Did you build an actual agent or agentic workflow?",
          "How did you evaluate and monitor it?",
        ],
        strongSignals: [
          "1+ year of hands-on production AI / agents",
          "Production LLM systems",
          "Agents, tool calling or RAG",
          "Evaluation and observability",
          "Failure handling and cost/latency trade-offs",
        ],
        redFlags: ["AI experience is limited to simple API integrations or prototypes"],
      },
      {
        id: "casa-hands-on",
        label: "Hands-on engineering / shipping",
        area: "technical",
        weight: 22,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question: "How much of the system did you personally build and ship?",
        followUps: [
          "What was your personal ownership?",
          "Have you inherited a codebase that wasn't in great shape? What did you do?",
        ],
      },
      {
        id: "casa-architecture",
        label: "Architecture & technical judgment",
        area: "technical",
        weight: 20,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "You inherit a working MVP built by contractors with architectural issues and technical debt. How would you approach the first 30–60 days while continuing to ship?",
        followUps: [
          "What would you inspect first?",
          "How would you decide what must be fixed immediately?",
          "Would you rewrite anything? Why or why not?",
        ],
        redFlags: ["Defaults to rewriting the whole system before understanding it"],
      },
      {
        id: "casa-healthcare-domain",
        label: "Healthcare / RCM workflow depth",
        area: "technical",
        weight: 18,
        priority: "critical",
        gateLabel: "Combined gate · AI or RCM",
        question: "Tell me about your hands-on experience building software close to real healthcare operations or RCM workflows.",
        followUps: [
          "What workflow were you actually solving?",
          "Did you work with billing, claims, prior authorization, EMRs/EHRs, benefits verification or medical coding?",
          "How close were you to the actual operational workflow?",
          "What did you personally build?",
        ],
        strongSignals: [
          "Meaningful hands-on billing / RCM application experience",
          "Claims, prior authorization, medical coding or EMR/EHR workflows",
          "Can explain the healthcare operation, not just the software layer",
        ],
      },
      {
        id: "casa-integrations",
        label: "Integrations / complex systems",
        area: "technical",
        weight: 10,
        priority: "high",
        hardGate: true,
        minimumScore: 3,
        question: "Tell me about the most complex third-party integration or API ecosystem you've worked with.",
        followUps: [
          "How did you handle inconsistent APIs, authentication, rate limits and failures?",
          "What made the integration difficult?",
        ],
      },
    ],
    operating: [
      {
        id: "casa-founding-mindset",
        label: "Ownership / founding engineer mindset",
        area: "operating",
        weight: 35,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "Tell me about a time when you had very little structure, incomplete requirements, and had to figure out what to build yourself.",
        followUps: [
          "How did you decide what to prioritize?",
          "How did you validate that you were solving the right problem?",
        ],
        redFlags: [
          "Needs detailed tickets/specifications for everything",
          "Avoids ownership outside a narrow technical scope",
        ],
      },
      {
        id: "casa-ambiguity",
        label: "Startup / ambiguity",
        area: "operating",
        weight: 25,
        priority: "high",
        hardGate: true,
        minimumScore: 4,
        question:
          "How comfortable are you moving from architecture on Monday, to an AI workflow Tuesday, to debugging a customer integration Wednesday?",
        strongSignals: ["High agency", "Speed and pragmatism", "Works without a large support structure"],
      },
      {
        id: "casa-product-thinking",
        label: "Product thinking",
        area: "operating",
        weight: 20,
        priority: "high",
        minimumScore: 3,
        question:
          "Tell me about a time you changed what you were building after learning more about the user or business problem.",
      },
      {
        id: "casa-ceo-collaboration",
        label: "Direct CEO collaboration / cross-functional range",
        area: "operating",
        weight: 10,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "What has worked well for you when working directly with a founder or CEO while priorities are still changing?",
      },
      {
        id: "casa-motivation",
        label: "Motivation for AI + healthcare",
        area: "operating",
        weight: 10,
        priority: "medium",
        question:
          "What makes you interested in joining a very early-stage company at the intersection of AI and healthcare?",
      },
    ],
    alternativeGates: [
      {
        id: "casa-ai-or-rcm",
        label: "Production AI / agents or meaningful healthcare RCM evidence",
        criterionIds: ["casa-production-ai", "casa-healthcare-domain"],
        minimumScore: 4,
      },
    ],
    logistics: [
      {
        id: "interestConfirmed",
        label: "Genuine interest confirmed",
        type: "boolean",
        requiredForPresent: true,
        rejectIfFalse: true,
      },
      {
        id: "usLocationFit",
        label: "U.S. location / work setup fit (confirm)",
        type: "boolean",
        requiredForPresent: false,
      },
      {
        id: "futureNycHybrid",
        label: "Open to future NYC hybrid setup (confirm)",
        type: "boolean",
        requiredForPresent: false,
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
        placeholder: "e.g. 2 weeks",
      },
    ],
  },
  {
    slug: "optery-senior-backend",
    client: "Optery",
    role: "Senior Backend Engineer",
    summary:
      "Senior backend engineer with deep recent Python/Django experience who can independently own production systems in a highly asynchronous remote environment.",
    technical: [
      {
        id: "optery-django",
        label: "Python / Django depth",
        area: "technical",
        weight: 35,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question: "Tell me about a project where Django was a core part of the backend.",
        followUps: [
          "How many years have you worked specifically with Django?",
          "When did you last use Django in production?",
          "How much of your current or recent work is Django/Python?",
          "Have you worked with Django REST Framework or Django Ninja?",
          "How do you typically structure APIs in Django?",
        ],
        strongSignals: ["Deep and recent Django production ownership"],
        redFlags: ["Senior engineer with only limited or outdated Django experience"],
      },
      {
        id: "optery-backend-ownership",
        label: "Backend architecture & production ownership",
        area: "technical",
        weight: 22,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question: "Tell me about a backend feature or system you owned end-to-end.",
        followUps: [
          "How involved were you from design to deployment?",
          "Did anything go wrong after release?",
          "How did you investigate and resolve it?",
        ],
        strongSignals: ["Owns design → development → deployment → monitoring → incident resolution"],
      },
      {
        id: "optery-database-performance",
        label: "Database / PostgreSQL / performance",
        area: "technical",
        weight: 16,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question: "Tell me about a real performance bottleneck you diagnosed and fixed in production.",
        followUps: [
          "How much PostgreSQL experience do you have?",
          "Have you optimized slow queries?",
          "How do you use indexes, query plans or profiling?",
        ],
      },
      {
        id: "optery-async-systems",
        label: "Distributed systems / async processing",
        area: "technical",
        weight: 12,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question: "Give me an example of a production issue involving asynchronous processing.",
        followUps: [
          "Have you used Celery, RabbitMQ or Redis in production?",
          "How did you handle retries, idempotency, concurrency or failed jobs?",
        ],
      },
      {
        id: "optery-problem-solving",
        label: "Technical problem solving",
        area: "technical",
        weight: 12,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question:
          "What is the most technically challenging thing you've built in your career, and what made it difficult?",
        followUps: ["What alternatives did you consider?", "What was the outcome?"],
      },
      {
        id: "optery-ai-tools",
        label: "AI tool fluency",
        area: "technical",
        weight: 3,
        priority: "medium",
        question: "How do you currently use AI coding assistants in your engineering workflow?",
      },
    ],
    operating: [
      {
        id: "optery-autonomy",
        label: "Autonomy / ownership",
        area: "operating",
        weight: 45,
        priority: "critical",
        hardGate: true,
        minimumScore: 4,
        question: "Tell me about a time when requirements were unclear and you still had to move the work forward.",
        followUps: ["What did you decide independently?", "How did you communicate those decisions?"],
      },
      {
        id: "optery-async-communication",
        label: "Remote / async communication",
        area: "operating",
        weight: 35,
        priority: "high",
        hardGate: true,
        minimumScore: 4,
        question: "What does good communication look like in a highly asynchronous engineering team?",
        followUps: [
          "How do you document technical decisions?",
          "How do you write PR descriptions, tickets or technical documentation?",
          "Have you worked across time zones?",
        ],
      },
      {
        id: "optery-collaboration",
        label: "Constructive disagreement / collaboration",
        area: "operating",
        weight: 20,
        priority: "critical",
        minimumScore: 3,
        question: "Tell me about a time you disagreed with a teammate during a code review.",
        followUps: ["How did you handle it?", "What was the outcome?"],
      },
    ],
    logistics: [
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
        id: "djangoYearsConfirmed",
        label: "More than 4 years of active Django experience confirmed",
        type: "boolean",
        requiredForPresent: true,
        rejectIfFalse: true,
      },
      {
        id: "djangoRecent",
        label: "Recent Django / Python production use confirmed",
        type: "boolean",
        requiredForPresent: true,
        rejectIfFalse: true,
      },
      {
        id: "englishB2C1",
        label: "Conversational English sufficient for B2/C1 target",
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
  },

  {
    slug: "examen-bdr",
    client: "Examen",
    role: "Business Development Representative",
    summary:
      "Early commercial BDR focused on outbound execution, building pipeline from zero, qualifying commercial real estate accounts, and improving quickly through feedback.",
    technical: [
      {
        id: "examen-lead-qualification",
        label: "Lead Qualification",
        area: "technical",
        weight: 33.33,
        priority: "high",
        question:
          "Walk me through how you would decide which accounts deserve a touch today and which ones you would leave aside.",
        followUps: [
          "What makes a signal recent enough to act on?",
          "How would you verify that the contact can actually make or influence the decision?",
          "What would make you disqualify an account?",
        ],
        whatWeMeasure:
          "Which accounts deserve a touch today: the firm has the problem, the signal is recent, and the contact decides.",
        strongFit:
          "Ranks by current pain rather than size or brand, and spots stale signals, departed contacts and out-of-profile firms.",
        disqualifyingSignal:
          "Treats any news as a buying signal, or keeps an out-of-profile account after the context rules it out.",
        liveWhatWeEvaluate:
          "Rank five lead cards, choose two, and explain what you would check before touching the rest.",
      },
      {
        id: "examen-prospecting-zero",
        label: "Prospecting From Zero",
        area: "technical",
        weight: 33.33,
        priority: "high",
        question:
          "If you joined as the first commercial hire with no dialer, data or CRM, what would you do during your first week?",
        followUps: [
          "How would you build your first 20 names without paid tools?",
          "How would you learn from the founders' past deals?",
          "How would you track every touch?",
        ],
        whatWeMeasure:
          "Building outbound as the first commercial hire, with no dialer, data or CRM.",
        strongFit:
          "Learns from the founders' past deals, builds the first list from free sources, tracks every touch, and starts reaching out in week one.",
        disqualifyingSignal:
          "Waits for tools, buys a list as the plan, or researches all week without reaching out.",
        liveWhatWeEvaluate:
          "Explain what you would do this week with no dialer, data or CRM, then build the first 20 names using free sources and describe how you would track the work.",
      },
      {
        id: "examen-outbound-writing",
        label: "Outbound Writing",
        area: "technical",
        weight: 33.34,
        priority: "critical",
        question:
          "Write a first outbound message to your top lead using one real detail about the firm and one concrete ask.",
        followUps: [
          "What detail made you choose this opening?",
          "What problem are you framing for the prospect?",
          "How would you improve the message after feedback?",
        ],
        whatWeMeasure:
          "Short, specific outreach a principal would answer, and how it improves after feedback.",
        strongFit:
          "Opens with a real detail about the firm, frames the prospect's problem, ends with one concrete ask, and produces a clearly better rewrite.",
        disqualifyingSignal:
          "Generic opening, product pitch, no clear ask, or a rewrite identical to the first draft.",
        liveWhatWeEvaluate:
          "Write a first message under 60 words to the top lead, then rewrite it after one piece of feedback.",
      },
    ],
    operating: [
      {
        id: "examen-persistence",
        label: "Persistence",
        area: "operating",
        weight: 14.29,
        priority: "critical",
        question:
          "Tell me about a time you kept going after repeated rejection. What did you personally change to improve the result?",
        followUps: [
          "How many attempts did you make?",
          "What did you change in your approach?",
          "What happened afterward?",
        ],
        strongSignals: [
          "Pushes through rejection",
          "Takes ownership",
          "Adapts tactics to improve results",
        ],
        redFlags: [
          "Gives up or blames the market after rejection",
          "Cannot describe a change in tactics",
        ],
        whatWeMeasure:
          "How the candidate responds to rejection, takes ownership, and adapts tactics to improve results.",
        strongFit:
          "Pushes through rejection, takes ownership, and adapts tactics to improve results.",
        disqualifyingSignal:
          "Gives up or blames the market after rejection, with no example of changing tactics.",
      },
      {
        id: "examen-volume-capacity",
        label: "Volume & Capacity",
        area: "operating",
        weight: 14.29,
        priority: "high",
        question:
          "What outbound volume have you personally sustained in a normal day or week, and how did you connect activity to results?",
        followUps: [
          "How many calls and emails did you typically make?",
          "How did that activity translate into meetings or pipeline?",
          "What did you do when volume increased?",
        ],
        whatWeMeasure:
          "Whether the candidate can sustain high outbound volume and connect activity to meetings, pipeline, and measurable results.",
        strongFit:
          "Demonstrates high outbound volume and connects activity to meetings, pipeline, and measurable results.",
        disqualifyingSignal:
          "Cannot give daily activity numbers, or activity is never tied to meetings or results.",
      },
      {
        id: "examen-coachable",
        label: "Coachable",
        area: "operating",
        weight: 14.29,
        priority: "critical",
        question:
          "Tell me about feedback that changed how you sold. What did you change and what happened next?",
        followUps: [
          "What was the feedback?",
          "How quickly did you apply it?",
          "What changed in your results or behavior?",
        ],
        strongSignals: [
          "Welcomes feedback",
          "Applies it quickly",
          "Shows measurable or observable improvement",
        ],
        redFlags: [
          "Defends or explains away feedback",
          "Cannot give an example of changing after feedback",
        ],
        whatWeMeasure:
          "Whether the candidate welcomes feedback, applies it immediately, and demonstrates clear improvement.",
        strongFit:
          "Welcomes feedback, applies it immediately, and demonstrates clear improvement.",
        disqualifyingSignal:
          "Defends or explains away feedback, with no example of changing after it.",
      },
      {
        id: "examen-presence",
        label: "Presence",
        area: "operating",
        weight: 14.29,
        priority: "high",
        question:
          "Tell me about a conversation with a senior prospect where you had to earn attention without rushing into a pitch.",
        followUps: [
          "What did you ask first?",
          "How did you adapt to the prospect?",
          "What was the outcome?",
        ],
        whatWeMeasure:
          "Whether the candidate communicates clearly, confidently and concisely with senior prospects.",
        strongFit:
          "Communicates clearly, confidently, and concisely with senior prospects.",
        disqualifyingSignal:
          "Rambles, rushes, or pitches before understanding the prospect.",
      },
      {
        id: "examen-learning-speed",
        label: "Learning Speed",
        area: "operating",
        weight: 14.29,
        priority: "high",
        question:
          "Tell me about a time you had to learn a new product or market quickly and turn that learning into better sales execution.",
        followUps: [
          "What was new to you?",
          "How did you ramp up?",
          "What changed in your execution?",
        ],
        whatWeMeasure:
          "Whether the candidate learns new products and markets quickly, applies feedback, and improves through iteration.",
        strongFit:
          "Learns new products and markets quickly, applies feedback, and improves through iteration.",
        disqualifyingSignal:
          "No example of ramping up on a new product or market; improvement is only claimed.",
      },
      {
        id: "examen-cre-interest",
        label: "CRE Interest",
        area: "operating",
        weight: 14.29,
        priority: "high",
        question:
          "What interests you about commercial real estate, and what do you understand about the people Examen sells to?",
        followUps: [
          "Why this market rather than another sales vertical?",
          "Who do you think the buyer is?",
          "What would you want to learn first?",
        ],
        whatWeMeasure:
          "Whether the candidate shows genuine interest in commercial real estate and understands the target customer.",
        strongFit:
          "Shows genuine interest in commercial real estate and understands the target customer.",
        disqualifyingSignal:
          "No curiosity about the industry or buyer; CRE is just another vertical to them.",
      },
      {
        id: "examen-logistics-fit",
        label: "Logistics Fit",
        area: "operating",
        weight: 14.26,
        priority: "high",
        question:
          "What setup and schedule would allow you to perform well in a full-time, in-person BDR role in San Francisco?",
        followUps: [
          "What is your expected start date?",
          "Are there any schedule constraints we should know about?",
          "What would you need to make the in-person setup work?",
        ],
        whatWeMeasure:
          "Whether the candidate can meet the San Francisco in-person setup, schedule, compensation, and start-date requirements.",
        strongFit:
          "Confirms SF in-person availability, schedule, compensation, and start date.",
        disqualifyingSignal:
          "Outside the Bay Area with no move date, cannot commit to full-time in person, or compensation and start date do not fit.",
      },
    ],
    logistics: [
      {
        id: "sfInPerson",
        label: "San Francisco in-person, full time, US business hours",
        type: "boolean",
        requiredForPresent: true,
        rejectIfFalse: true,
      },
      {
        id: "compensation",
        label: "Compensation expectations / salary range",
        type: "text",
        requiredForPresent: true,
        placeholder: "Expected base / total compensation",
      },
      {
        id: "availability",
        label: "Availability / start date",
        type: "text",
        requiredForPresent: true,
        placeholder: "e.g. Available immediately / 2 weeks",
      },
    ],
  },

];

export const availableRoles = roles.filter((role) =>
  role.slug === "optery-senior-backend" || role.slug === "examen-bdr",
);

export function getRole(slug: string) {
  return roles.find((role) => role.slug === slug);
}