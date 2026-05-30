import {
  correctiveActions as initialCorrectiveActions,
  preventiveActions as initialPreventiveActions,
} from "@/mock-data";
import type { ActionStatus, CorrectiveAction, PreventiveAction } from "@/types";

let correctiveActionRecords: CorrectiveAction[] = structuredClone(initialCorrectiveActions);
let preventiveActionRecords: PreventiveAction[] = structuredClone(initialPreventiveActions);

export function getAllCorrectiveActions(): CorrectiveAction[] {
  return structuredClone(correctiveActionRecords);
}

export function getAllPreventiveActions(): PreventiveAction[] {
  return structuredClone(preventiveActionRecords);
}

export function getActionsByCAPA(capaId: string): {
  correctiveActions: CorrectiveAction[];
  preventiveActions: PreventiveAction[];
} {
  return {
    correctiveActions: structuredClone(
      correctiveActionRecords.filter((action) => action.capaId === capaId),
    ),
    preventiveActions: structuredClone(
      preventiveActionRecords.filter((action) => action.capaId === capaId),
    ),
  };
}

export function addCorrectiveAction(
  capaId: string,
  action: Omit<CorrectiveAction, "id" | "capaId"> & { id?: string },
): CorrectiveAction {
  const newAction: CorrectiveAction = {
    ...action,
    id: action.id ?? `CA-${capaId.replace("CAPA-", "")}-${Date.now()}`,
    capaId,
  };

  correctiveActionRecords = [...correctiveActionRecords, newAction];
  return structuredClone(newAction);
}

export function addPreventiveAction(
  capaId: string,
  action: Omit<PreventiveAction, "id" | "capaId"> & { id?: string },
): PreventiveAction {
  const newAction: PreventiveAction = {
    ...action,
    id: action.id ?? `PA-${capaId.replace("CAPA-", "")}-${Date.now()}`,
    capaId,
  };

  preventiveActionRecords = [...preventiveActionRecords, newAction];
  return structuredClone(newAction);
}

export function updateActionStatus(
  actionId: string,
  status: ActionStatus,
): CorrectiveAction | PreventiveAction | undefined {
  const correctiveAction = correctiveActionRecords.find((action) => action.id === actionId);
  if (correctiveAction) {
    correctiveAction.status = status;
    if (status === "completed" || status === "verified") {
      correctiveAction.completedAt = new Date().toISOString();
    }
    return structuredClone(correctiveAction);
  }

  const preventiveAction = preventiveActionRecords.find((action) => action.id === actionId);
  if (preventiveAction) {
    preventiveAction.status = status;
    if (status === "completed" || status === "verified") {
      preventiveAction.completedAt = new Date().toISOString();
    }
    return structuredClone(preventiveAction);
  }

  return undefined;
}

export function resetActionData() {
  correctiveActionRecords = structuredClone(initialCorrectiveActions);
  preventiveActionRecords = structuredClone(initialPreventiveActions);
  return {
    correctiveActions: getAllCorrectiveActions(),
    preventiveActions: getAllPreventiveActions(),
  };
}

