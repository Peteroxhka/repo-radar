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

// A *single* PostgREST or= expression keeps each peer check paired with
// its time cursor; multiple .or() calls replace one another in supabase-js.
export function dmConversationFilter(userId, peerId, after = null, before = null) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(userId) || !uuid.test(peerId)) throw new Error("Invalid conversation users");
  const cursorClause = (c, op) => {
    if (!c) return "";
    if (!uuid.test(c.id)) throw new Error("Invalid message cursor");
    const timestamp = new Date(c.created_at);
    if (Number.isNaN(timestamp.getTime())) throw new Error("Invalid message timestamp");
    const value = timestamp.toISOString();
    return `,or(created_at.${op}.${value},and(created_at.eq.${value},id.${op}.${c.id}))`;
  };
  const suffix = cursorClause(after, "gt") + cursorClause(before, "lt");
  return `and(sender_id.eq.${userId},recipient_id.eq.${peerId}${suffix}),and(sender_id.eq.${peerId},recipient_id.eq.${userId}${suffix})`;
}

// Use declared extensions and explicit MIME types rather than sending arbitrary
// uploads with application/octet-stream (blocked in Supabase Storage).
export function attachmentMime(fileName, declaredType = "") {
  const extension = String(fileName).split(".").pop()?.toLowerCase();
  const fallback = {pdf:"application/pdf",txt:"text/plain",md:"text/markdown",csv:"text/csv",json:"application/json",zip:"application/zip",rar:"application/vnd.rar","7z":"application/x-7z-compressed",doc:"application/msword",xls:"application/vnd.ms-excel",ppt:"application/vnd.ms-powerpoint",odt:"application/vnd.oasis.opendocument.text",ods:"application/vnd.oasis.opendocument.spreadsheet",odp:"application/vnd.oasis.opendocument.presentation",mov:"video/quicktime",m4v:"video/x-m4v",mp3:"audio/mpeg",m4a:"audio/mp4",wav:"audio/wav",ogg:"audio/ogg",aac:"audio/aac",flac:"audio/flac",heic:"image/heic",bmp:"image/bmp",webm:"video/webm",mp4:"video/mp4",jpeg:"image/jpeg",jpg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp"};
  const allowed = new Set(["image/jpeg","image/png","image/webp","image/gif","image/bmp","image/heic","video/mp4","video/webm","video/quicktime","video/x-m4v","audio/mpeg","audio/ogg","audio/wav","audio/x-wav","audio/mp4","audio/aac","audio/flac","application/pdf","text/plain","text/markdown","text/csv","application/json","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.oasis.opendocument.text","application/vnd.oasis.opendocument.spreadsheet","application/vnd.oasis.opendocument.presentation","application/zip","application/x-zip-compressed","application/x-7z-compressed","application/vnd.rar","application/x-rar-compressed"]);
  const type = declaredType && declaredType !== "application/octet-stream" ? declaredType.toLowerCase() : fallback[extension];
  return allowed.has(type) ? type : null;
}
