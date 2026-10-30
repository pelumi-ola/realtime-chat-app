import { useState } from "react";
import { LogOut, Plus, Search } from "lucide-react";
import { Avatar } from "./ui.jsx";
import { displayName, idOf } from "../lib/helpers.js";

export const isMemberOf = (room, userId) =>
  (room.members || []).some((m) => idOf(m) === userId);

export default function Sidebar({ user, rooms, loading, activeId, connected, onSelect, onCreate, onProfile, onLogout, className = "" }) {
  const [q, setQ] = useState("");
  const myId = idOf(user);
  const filtered = rooms.filter((r) => r.name?.toLowerCase().includes(q.toLowerCase()));
  const mine = filtered.filter((r) => isMemberOf(r, myId));
  const others = filtered.filter((r) => !isMemberOf(r, myId));

  const Row = ({ room }) => {
    const active = idOf(room) === activeId;
    const count = room.members?.length ?? room.memberCount ?? 0;
    return (
      <button
        onClick={() => onSelect(idOf(room))}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-lagoon text-white" : "hover:bg-white/10"}`}
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display font-bold ${active ? "bg-white/20" : "bg-ink-soft text-lagoon"}`}>
          {room.name?.[0]?.toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{room.name}</span>
          <span className={`block text-xs ${active ? "text-white/80" : "text-slate-400"}`}>
            {count} {count === 1 ? "member" : "members"}
          </span>
        </span>
      </button>
    );
  };

  return (
    <aside className={`flex h-full w-full flex-col bg-ink text-white md:w-80 ${className}`}>
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <button onClick={onProfile} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Edit profile">
          <Avatar user={user} size={40} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{displayName(user)}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
              {connected ? "Connected" : "Reconnecting…"}
            </span>
          </span>
        </button>
        <button onClick={onLogout} aria-label="Log out" title="Log out" className="rounded-lg p-2 text-slate-300 hover:bg-white/10">
          <LogOut size={18} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rooms"
            className="w-full rounded-lg bg-ink-soft py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-lagoon"
          />
        </div>
        <button onClick={onCreate} className="flex w-full items-center justify-center gap-2 rounded-lg bg-lagoon py-2.5 text-sm font-semibold hover:bg-lagoon-dark">
          <Plus size={16} /> New room
        </button>
      </div>

      <nav className="scroll-thin flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {loading && <p className="px-3 text-sm text-slate-400">Loading rooms…</p>}
        {!loading && rooms.length === 0 && (
          <p className="px-3 text-sm text-slate-400">No rooms yet. Create the first one.</p>
        )}
        {mine.length > 0 && (
          <div>
            <h3 className="mb-1 px-3 text-xs font-semibold text-slate-400">Your rooms</h3>
            {mine.map((r) => <Row key={idOf(r)} room={r} />)}
          </div>
        )}
        {others.length > 0 && (
          <div>
            <h3 className="mb-1 px-3 text-xs font-semibold text-slate-400">Browse rooms</h3>
            {others.map((r) => <Row key={idOf(r)} room={r} />)}
          </div>
        )}
      </nav>
    </aside>
  );
}
