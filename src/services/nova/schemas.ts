import { z } from "zod";

export const gateDraftSchema = z.object({
  sourceLabel: z.string(),
  confidence: z.number().min(0).max(100),
  answers: z.object({
    observation: z.string(),
    scope: z.string(),
    impact: z.string(),
    containment: z.string(),
    cause_confirmation: z.string(),
    effectiveness_criteria: z.string(),
  }),
});

export const impactClassificationSchema = z.object({
  severity: z.enum(["Ungraded", "Minor", "Major", "Critical"]),
  totalWeight: z.number(),
  factors: z.array(
    z.object({
      factor: z.string(),
      value: z.string(),
      weight: z.number(),
      rationale: z.string(),
    }),
  ),
  rationale: z.string(),
  computedAt: z.string(),
});

export const containmentSuggestionsSchema = z.object({
  suggestions: z.array(z.object({ id: z.string(), content: z.string() })),
});

export const stringSuggestionsSchema = z.object({
  suggestions: z.array(z.string()),
});

export const verificationCoachingSchema = z.object({
  Observation: z.string(),
  Recommendation: z.string(),
  "Audit Rationale": z.string(),
});

const citationSchema = z.object({
  deviationId: z.string().optional(),
  capaId: z.string().optional(),
  similarityScore: z.number().optional(),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
  year: z.number().optional(),
  outcome: z.enum(["Effective", "Recurred", "Ongoing"]).optional(),
  sourceType: z.enum(["deviation", "audit", "complaint"]).optional(),
});

export const rcaResponseSchema = z
  .object({
    fiveWhys: z
      .array(
        z.object({
          id: z.string(),
          level: z.number(),
          question: z.string(),
          novaSuggestion: z.string(),
          novaCitations: z.array(citationSchema).default([]),
          userAnswer: z.string().default(""),
          status: z.enum(["pending", "accepted", "edited", "replaced"]).default("pending"),
        }),
      )
      .optional(),
    fishbone: z
      .array(
        z.object({
          category: z.enum(["Man", "Machine", "Material", "Method", "Measurement", "Environment"]),
          novaEntries: z.array(z.string()),
          userEntries: z.array(z.string()).default([]),
          status: z.enum(["pending", "accepted", "edited", "replaced"]).default("pending"),
        }),
      )
      .optional(),
    decisionTree: z
      .object({
        nodes: z.array(
          z.object({
            id: z.string(),
            question: z.string(),
            yesNodeId: z.string().optional(),
            noNodeId: z.string().optional(),
            isLeaf: z.boolean(),
            conclusion: z.string().optional(),
          }),
        ),
        rootNodeId: z.string(),
      })
      .optional(),
    confirmedRootCauses: z.array(z.string()).default([]),
  })
  .passthrough();

function stripCodeFence(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseJsonContent(content: string): unknown {
  return JSON.parse(stripCodeFence(content));
}
