// Keep PostgREST filter syntax out of user input without removing Unicode text.
export function normalizeSearch(value) {
  return String(value).normalize("NFKC").replace(/[^\p{L}\p{N}\s._/+:#-]/gu, " ").replace(/\s+/gu, " ").trim().slice(0, 80);
}
export function mergeMessages(existing, incoming) {
  const rows = new Map(existing.map(row => [row.id, row]));
  for (const row of incoming) rows.set(row.id, row);
  return [...rows.values()].sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}
export function isCurrentChat(state, epoch, userId, peerId) {
  return state.chatEpoch === epoch && state.user?.id === userId && state.peer?.id === peerId;
}
