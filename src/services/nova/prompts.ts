import type { CAPAType, PreFillContext, RCAMethod } from "@/types";
import type { NovaFindingAnalysisPacket, NovaTaskType } from "./types";

type Message = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = [
  "You are Nova, a GMP/CAPA assistant for a pharmaceutical quality prototype.",
  "Produce reviewer-editable CAPA drafts, not final GMP truth.",
  "Use only the provided source packet and current user message.",
  "Do not invent batch IDs, SOPs, dates, people, evidence files, or citations.",
  "If evidence is missing, say what is missing instead of guessing.",
  "Prefer concise, audit-ready wording with specific scope, action, rationale, and measurable verification.",
].join("\n");

const jsonInstruction =
  "Return only valid JSON. Do not wrap it in markdown. Do not include commentary outside the JSON object.";

function packetJson(packet: NovaFindingAnalysisPacket | undefined) {
  return JSON.stringify(packet ?? null, null, 2);
}

function sourceJson(prefill: PreFillContext) {
  return JSON.stringify(prefill, null, 2);
}

export function buildNovaMessages(
  task: NovaTaskType,
  input: {
    packet?: NovaFindingAnalysisPacket;
    prefill?: PreFillContext;
    type?: CAPAType;
    method?: RCAMethod;
    step?: string;
    message?: string;
  },
): Message[] {
  const commonContext = input.packet
    ? `Finding analysis packet:\n${packetJson(input.packet)}`
    : input.prefill
      ? `Imported source data:\n${sourceJson(input.prefill)}`
      : "No finding analysis packet was available.";

  const taskPrompt: Record<NovaTaskType, string> = {
    draft_gate_answers: [
      jsonInstruction,
      "Draft answers for every CAPA intake gate question using the imported source data.",
      "Schema: {\"sourceLabel\": string, \"confidence\": number 0-100, \"answers\": {\"observation\": string, \"scope\": string, \"impact\": string, \"containment\": string, \"cause_confirmation\": string, \"effectiveness_criteria\": string}}",
      commonContext,
    ].join("\n\n"),
    classify_impact: [
      jsonInstruction,
      "Classify the source impact for CAPA intake.",
      "Schema: {\"severity\":\"Ungraded\"|\"Minor\"|\"Major\"|\"Critical\", \"totalWeight\": number, \"factors\": [{\"factor\": string, \"value\": string, \"weight\": number, \"rationale\": string}], \"rationale\": string, \"computedAt\": ISO8601 string}",
      commonContext,
    ].join("\n\n"),
    suggest_containment: [
      jsonInstruction,
      "Suggest immediate containment actions. Keep them bounded to the affected scope.",
      "Schema: {\"suggestions\": [{\"id\": string, \"content\": string}]}",
      commonContext,
    ].join("\n\n"),
    suggest_rca: [
      jsonInstruction,
      `Generate RCA suggestions for method: ${input.method ?? "5whys"}.`,
      "For 5whys return {\"fiveWhys\":[{\"id\":string,\"level\":number,\"question\":string,\"novaSuggestion\":string,\"novaCitations\":[],\"userAnswer\":\"\",\"status\":\"pending\"}],\"confirmedRootCauses\":[string]}.",
      "For fishbone return {\"fishbone\":[{\"category\":\"Man\"|\"Machine\"|\"Material\"|\"Method\"|\"Measurement\"|\"Environment\",\"novaEntries\":[string],\"userEntries\":[],\"status\":\"pending\"}],\"confirmedRootCauses\":[string]}.",
      "For decision_tree return {\"decisionTree\":{\"rootNodeId\":string,\"nodes\":[{\"id\":string,\"question\":string,\"yesNodeId\":string?,\"noNodeId\":string?,\"isLeaf\":boolean,\"conclusion\":string?}]},\"confirmedRootCauses\":[string]}.",
      commonContext,
    ].join("\n\n"),
    suggest_corrective_actions: [
      jsonInstruction,
      "Suggest corrective actions that directly address the confirmed or candidate root cause.",
      "Schema: {\"suggestions\": [string]}",
      commonContext,
    ].join("\n\n"),
    suggest_preventive_actions: [
      jsonInstruction,
      "Suggest preventive actions that reduce recurrence risk at the system/process level.",
      "Schema: {\"suggestions\": [string]}",
      commonContext,
    ].join("\n\n"),
    coach_verification: [
      jsonInstruction,
      "Draft verification coaching for the CAPA effectiveness step.",
      "Schema: {\"Observation\": string, \"Recommendation\": string, \"Audit Rationale\": string}",
      commonContext,
    ].join("\n\n"),
    ask_nova_chat: [
      "Answer conversationally as Nova for the current CAPA step.",
      "Use short sections when useful: Observation, Recommendation, Audit Rationale.",
      `Active step: ${input.step ?? "problem"}`,
      commonContext,
      `User message: ${input.message ?? ""}`,
    ].join("\n\n"),
    similarity_context_summary: [
      jsonInstruction,
      "Summarize the historical similar CAPA context for this case.",
      "Schema: {\"summary\": string, \"mostRelevantCapaIds\": [string], \"risks\": [string]}",
      commonContext,
    ].join("\n\n"),
  };

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: taskPrompt[task] },
  ];
}
