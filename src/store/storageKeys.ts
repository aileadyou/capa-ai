export const demoStorageKeys = [
  "ai-coach-nova-persona",
  "ai-coach-nova-capa",
  "ai-coach-nova-ui",
  "ai-coach-nova-audit-trail",
  "ai-coach-nova-notifications",
] as const;

export function clearDemoStorage() {
  demoStorageKeys.forEach((key) => localStorage.removeItem(key));
}

