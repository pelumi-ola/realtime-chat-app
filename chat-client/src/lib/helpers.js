export const idOf = (o) => (typeof o === "string" ? o : (o?.id ?? o?._id));

export const displayName = (u) => {
  if (!u || typeof u === "string") return "Member";
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.userName || u.name || u.email || "Member";
};

// Socket payloads may wrap the user in { user } or { sender }
export const userFrom = (p) => p?.user ?? p?.sender ?? p;
export const roomIdOf = (p) => p?.roomId ?? idOf(p?.room);

export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export const formatDay = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yest.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
};

// Merge message lists: no duplicates, oldest first
export function mergeMessages(prev, incoming) {
  const map = new Map();
  [...prev, ...incoming].forEach((m) => map.set(idOf(m) ?? `${m.createdAt}-${m.content}`, m));
  return [...map.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}
