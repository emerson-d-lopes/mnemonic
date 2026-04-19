export function randomId(): string {
  return crypto.randomUUID();
}

export function toDateStr(date: Date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatDue(dueMs: number): string {
  const days = Math.round((dueMs - Date.now()) / 86_400_000);
  if (days <= 0) return "now";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}
