# Clean CAPA Seed v1

This folder is a proposed replacement seed, not wired into the app.

It is designed for a no-DB "live mock" setup where the app keeps a single in-memory/persisted state, but every CAPA is still traceable back to a real fictional source record.

## Why This Exists

Current data has several disconnected surfaces:

- `src/mock-data/prefills/*` are type templates that point to the old golden cases (`DEV-2026-0341`, `AUD-2026-0089`, `CMP-2026-0112`).
- `src/services/capaService.ts` still creates a new CAPA with `prefills[type]`, so a selected finding can inherit the wrong source payload.
- `src/utils/intakeHelpers.ts`, Nova providers, demo routes, and several page-level constants still contain hardcoded golden case labels.
- Actions, findings, CAPAs, audit events, notifications, and Nova scripts are split into different files without one canonical lineage map.

The seed here fixes the data shape first. It does not change implementation.

## Dataset Scope

Exactly six source findings:

| Type | Source finding | Source system | Seed status | CAPA |
| --- | --- | --- | --- | --- |
| Deviation | `DEV-2026-0144` | Bizzmine | `pending_capa` | Expected on-demand: `CAPA-2026-0144` |
| Deviation | `DEV-2026-0150` | Bizzmine | `capa_in_progress` | `CAPA-2026-0150` |
| Audit | `AUD-2026-0127` | Q100+ | `pending_review` | `CAPA-2026-0127` |
| Audit | `AUD-2026-0162` | Q100+ | `capa_closed` | `CAPA-2026-0162` |
| Complaint | `CMP-2026-0098` | Bizzmine-Complaint | `pending_capa` | Expected on-demand: `CAPA-2026-0098` |
| Complaint | `CMP-2026-0106` | Bizzmine-Complaint | `capa_in_progress` | `CAPA-2026-0106` |

`DEV-2026-0144` and `CMP-2026-0098` intentionally have no seeded CAPA. They are the test cases for "create a CAPA from this exact finding". A correct implementation should create `CAPA-2026-0144` from `DEV-2026-0144` and should never import `DEV-2026-0341` data.

## Files

- `source-records.json` - canonical source payloads from Bizzmine, Q100+, and Bizzmine-Complaint.
- `findings.json` - app-compatible finding projection.
- `capa-cases.json` - app-compatible CAPA cases for seeded lifecycle states.
- `corrective-actions.json` - app-compatible corrective actions linked by `capaId`.
- `preventive-actions.json` - app-compatible preventive actions linked by `capaId`.
- `audit-trail.json` - events linked by `findingId` and `capaId`.
- `notifications.json` - notifications linked to the same CAPA IDs.
- `lineage-map.json` - human and agent handoff map for all relationships.

## Integration Rules For Later

1. Treat `source-records.json` as the source of truth for prefill data.
2. Never select prefill by CAPA type alone. Select it by `findingId` or `sourceRecordId`.
3. Use deterministic CAPA IDs: `CAPA-${findingId suffix}`.
4. Keep `finding.linkedCapaId` and `capa.findingId` as a strict one-to-one relationship.
5. Join actions by `capaId`; do not duplicate action state inside CAPA cases unless the store needs a denormalized view.
6. For pending findings, create a CAPA shell from the matching source record, not from a global template.

