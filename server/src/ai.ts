import * as repo from "./repo.js";
import { genId } from "./repo.js";
import { callOpenRouter, hasOpenRouter, parseJsonLoose, type ChatMessage } from "./openrouter.js";
// Statically imported so they inline into the serverless bundle (no runtime fs).
import fiveWhysHepaScript from "../../src/mock-data/nova-scripts/5whys-hepa.json";
import chatResponsesScript from "../../src/mock-data/nova-scripts/chat-responses.json";

const FIVE_WHYS_DEPTH = 5;

const SYSTEM_PROMPT = [
  "You are Nova, a GMP/CAPA assistant for a pharmaceutical quality prototype.",
  "Produce reviewer-editable CAPA drafts, not final GMP truth.",
  "Use only the provided case context and user input.",
  "Do not invent batch IDs, SOPs, dates, people, evidence files, or citations.",
  "Prefer concise, audit-ready wording with specific scope, action, rationale, and measurable verification.",
].join("\n");

// ── Case context helpers ─────────────────────────────────────────────────────

function problemStatementForCapa(capa: any): string {
  const observation = capa?.gateAnswers?.find((a: any) => a.questionId === "observation")?.answer;
  return observation || capa?.title || "Quality finding under investigation.";
}

function capaContextBlock(capa: any): string {
  if (!capa) return "No CAPA context available.";
  const gate = (capa.gateAnswers ?? [])
    .map((a: any) => `- ${a.questionId}: ${a.answer}`)
    .join("\n");
  return [
    `CAPA ${capa.id} (${capa.type}) — ${capa.title}`,
    `Status: ${capa.status} · Current step: ${capa.currentStep} · Department: ${capa.department}`,
    capa.preFill ? `Source data:\n${JSON.stringify(capa.preFill, null, 2)}` : "",
    gate ? `Gate answers:\n${gate}` : "",
    capa.rca?.confirmedRootCauses?.length ? `Confirmed root causes: ${capa.rca.confirmedRootCauses.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ── Premade 5 Whys fallback ──────────────────────────────────────────────────

function premadeFiveWhys(capa: any): { levels: any[]; confirmedRootCause: string } {
  const premade = repo.getAiSuggestion("rca_5whys", { capaType: capa?.type, capaId: capa?.id });
  if (premade?.levels) return premade;
  // Last-resort premade (deviation HEPA script), bundled at build time.
  return fiveWhysHepaScript as any;
}

// ── 5 Whys: AI generation ────────────────────────────────────────────────────

/** Ask the model for the next "why" question + a suggested answer. */
async function generateNextWhy(
  problemStatement: string,
  chain: Array<{ question: string; answer: string }>,
  nextLevel: number,
): Promise<{ question: string; suggestedAnswer: string }> {
  const chainText = chain.length
    ? chain.map((c, i) => `Why ${i + 1}: ${c.question}\nAnswer ${i + 1}: ${c.answer}`).join("\n\n")
    : "(no answers yet — this is the first Why)";

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        "Run an interactive 5 Whys root-cause analysis.",
        `Problem statement: ${problemStatement}`,
        `Chain so far:\n${chainText}`,
        `Generate Why #${nextLevel}: the single next "why" question that drills one level deeper than the most recent answer (or the problem statement if this is the first Why).`,
        'Also propose a concise, plausible answer the investigator could accept or edit. Keep it grounded in the provided context — do not invent specifics.',
        'Return only valid JSON: {"question": string, "suggestedAnswer": string}',
      ].join("\n\n"),
    },
  ];

  const raw = await callOpenRouter(messages, { json: true, maxTokens: 500, temperature: 0.4 });
  const parsed = parseJsonLoose<{ question?: string; suggestedAnswer?: string }>(raw);
  if (!parsed?.question) throw new Error("Model returned no 5 Whys question.");
  return { question: parsed.question, suggestedAnswer: parsed.suggestedAnswer ?? "" };
}

/** Ask the model to summarise the confirmed systemic root cause from the chain. */
async function confirmRootCause(
  problemStatement: string,
  chain: Array<{ question: string; answer: string }>,
): Promise<string> {
  const chainText = chain.map((c, i) => `Why ${i + 1}: ${c.question}\nAnswer ${i + 1}: ${c.answer}`).join("\n\n");
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        "Given this completed 5 Whys chain, state the single confirmed systemic root cause in one sentence.",
        `Problem statement: ${problemStatement}`,
        `Chain:\n${chainText}`,
        'Return only valid JSON: {"confirmedRootCause": string}',
      ].join("\n\n"),
    },
  ];
  const raw = await callOpenRouter(messages, { json: true, maxTokens: 300, temperature: 0.3 });
  const parsed = parseJsonLoose<{ confirmedRootCause?: string }>(raw);
  return parsed?.confirmedRootCause || chain[chain.length - 1]?.answer || "";
}

function makeNode(level: number, question: string, suggestion: string): any {
  return {
    id: `fw-${level}-${Date.now()}`,
    level,
    question,
    novaSuggestion: suggestion,
    novaCitations: [],
    userAnswer: "",
    status: "pending",
  };
}

export async function startFiveWhys(capaId: string): Promise<any> {
  const capa = repo.getCapa(capaId);
  if (!capa) throw new Error(`CAPA ${capaId} not found.`);

  const problemStatement = problemStatementForCapa(capa);
  let firstNode: any;
  let live = false;

  if (hasOpenRouter()) {
    try {
      const { question, suggestedAnswer } = await generateNextWhy(problemStatement, [], 1);
      firstNode = makeNode(1, question, suggestedAnswer);
      live = true;
    } catch {
      // fall through to premade
    }
  }
  if (!firstNode) {
    const premade = premadeFiveWhys(capa);
    const lvl = premade.levels[0];
    firstNode = makeNode(1, lvl.question, lvl.suggestion);
  }

  const ts = new Date().toISOString();
  const session = {
    id: genId("FW"),
    capaId,
    method: "5whys",
    status: "active",
    source: live ? "openrouter" : "premade",
    problemStatement,
    nodes: [firstNode],
    confirmedRootCauses: [],
    createdAt: ts,
    updatedAt: ts,
  };
  repo.upsertFiveWhysSession(session);
  return session;
}

export async function answerFiveWhys(sessionId: string, nodeId: string, answer: string): Promise<any> {
  const session = repo.getFiveWhysSession(sessionId);
  if (!session) throw new Error(`5 Whys session ${sessionId} not found.`);
  if (session.status !== "active") return session;

  const node = session.nodes.find((n: any) => n.id === nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found in session.`);

  node.userAnswer = answer;
  node.status = answer.trim() === (node.novaSuggestion ?? "").trim() ? "accepted" : "edited";

  const chain = session.nodes
    .filter((n: any) => n.userAnswer)
    .map((n: any) => ({ question: n.question, answer: n.userAnswer }));

  const capa = repo.getCapa(session.capaId);
  const currentLevel = node.level;

  if (currentLevel >= FIVE_WHYS_DEPTH) {
    // Final level answered — confirm the systemic root cause and complete.
    let rootCause = "";
    if (hasOpenRouter() && session.source === "openrouter") {
      try {
        rootCause = await confirmRootCause(session.problemStatement, chain);
      } catch {
        /* fall through */
      }
    }
    if (!rootCause) rootCause = premadeFiveWhys(capa).confirmedRootCause || chain[chain.length - 1]?.answer || "";
    session.confirmedRootCauses = rootCause ? [rootCause] : [];
    session.status = "complete";
  } else {
    // Generate the next Why.
    let nextNode: any;
    if (hasOpenRouter() && session.source === "openrouter") {
      try {
        const { question, suggestedAnswer } = await generateNextWhy(session.problemStatement, chain, currentLevel + 1);
        nextNode = makeNode(currentLevel + 1, question, suggestedAnswer);
      } catch {
        /* fall through */
      }
    }
    if (!nextNode) {
      const premade = premadeFiveWhys(capa);
      const lvl = premade.levels[currentLevel] ?? premade.levels[premade.levels.length - 1];
      nextNode = makeNode(currentLevel + 1, lvl.question, lvl.suggestion);
    }
    session.nodes.push(nextNode);
  }

  session.updatedAt = new Date().toISOString();
  repo.upsertFiveWhysSession(session);
  return session;
}

// ── Live chat ────────────────────────────────────────────────────────────────

function normalizeChatStep(step: string): string {
  const raw = (step.split(":").pop() ?? step).toLowerCase();
  if (raw.includes("problem") || raw === "d1") return "problem";
  if (raw.includes("containment") || raw === "d2") return "containment";
  if (raw.includes("rca") || raw === "d3") return "rca";
  if (raw.includes("corrective") || raw === "ca" || raw === "d4") return "ca";
  if (raw.includes("preventive") || raw === "pa" || raw === "d5") return "pa";
  if (raw.includes("verification") || raw === "d6") return "verification";
  if (raw.includes("signoff") || raw === "d7") return "signoff";
  return "fallback";
}

function premadeChatReply(step: string, message: string): string {
  const scripts = chatResponsesScript as Record<string, any>;
  const key = normalizeChatStep(step);
  const stepScripts = scripts[key];
  const normalized = message.toLowerCase();
  if (Array.isArray(stepScripts)) {
    const match = stepScripts.find(
      (entry: any) =>
        entry &&
        typeof entry === "object" &&
        "prompt" in entry &&
        (String(entry.prompt).toLowerCase() === normalized ||
          normalized.includes(String(entry.prompt).toLowerCase().slice(0, 20))),
    );
    if (match) return match.response;
    if (stepScripts[0]?.response) return stepScripts[0].response;
  }
  return scripts.fallback?.response ?? "I can help you draft this CAPA section. What would you like to refine?";
}

export async function chat(opts: {
  capaId?: string;
  step: string;
  message: string;
}): Promise<{ reply: string; source: "openrouter" | "premade" }> {
  const { capaId, step, message } = opts;
  const thread = capaId ? `${capaId}:${normalizeChatStep(step)}` : normalizeChatStep(step);

  repo.addChatMessage(thread, capaId ?? null, "user", message);

  let reply: string;
  let source: "openrouter" | "premade";

  if (hasOpenRouter()) {
    try {
      const capa = capaId ? repo.getCapa(capaId) : undefined;
      const history = repo.getChatMessages(thread).slice(-8);
      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Active CAPA step: ${normalizeChatStep(step)}`,
            `Case context:\n${capaContextBlock(capa)}`,
            "Answer the user conversationally. Use short labelled sections (Observation, Recommendation, Audit Rationale) when helpful.",
          ].join("\n\n"),
        },
        ...history.map((m: any) => ({ role: m.role as ChatMessage["role"], content: m.content })),
      ];
      reply = await callOpenRouter(messages, { maxTokens: 900, temperature: 0.4 });
      source = "openrouter";
    } catch {
      reply = premadeChatReply(step, message);
      source = "premade";
    }
  } else {
    reply = premadeChatReply(step, message);
    source = "premade";
  }

  repo.addChatMessage(thread, capaId ?? null, "assistant", reply);
  return { reply, source };
}

export function chatHistory(capaId: string | undefined, step: string): any[] {
  const thread = capaId ? `${capaId}:${normalizeChatStep(step)}` : normalizeChatStep(step);
  return repo.getChatMessages(thread);
}
