import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  LogOut,
  Pencil,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
  UserMinus,
} from "lucide-react";
import api, { errMsg, pick } from "../lib/api.js";
import {
  displayName,
  formatDay,
  formatTime,
  idOf,
  mergeMessages,
  roomIdOf,
  userFrom,
} from "../lib/helpers.js";
import { Avatar, Button, ErrorText, Spinner } from "./ui.jsx";
import { isMemberOf } from "./Sidebar.jsx";
import AddMemberModal from "./AddMemberModal.jsx";

const PAGE_SIZE = 30;

export default function ChatWindow({
  room,
  me,
  socket,
  onlineMap,
  onChanged,
  onClosed,
  onEdit,
  onBack,
}) {
  const roomId = idOf(room);
  const myId = idOf(me);
  const isMember = isMemberOf(room, myId);
  const isCreator = String(idOf(room.createdBy)) === String(myId);
  const isRoomAdmin =
    isCreator || room.admins?.some((a) => String(idOf(a)) === String(myId));
  const canAdd = isRoomAdmin || me.role === "admin";

  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState({});
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef();
  const typingTimer = useRef();
  const [showAdd, setShowAdd] = useState(false);
  const [promoting, setPromoting] = useState(null);

  const loadMembers = useCallback(async () => {
    try {
      const res = await api.get(`/room/${roomId}/members`);
      setMembers(pick(res, "members") || []);
    } catch {
      /* panel just stays empty */
    }
  }, [roomId]);

  // Message history: GET /rooms/:roomId/messages?page&limit
  const loadHistory = useCallback(
    async (p) => {
      setLoading(true);
      try {
        const res = await api.get(`/rooms/${roomId}/messages`, {
          params: { page: p, limit: PAGE_SIZE },
        });
        const list = pick(res, "messages") || [];
        setMessages((prev) => mergeMessages(prev, list));
        setHasMore(list.length >= PAGE_SIZE);
        setPage(p);
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    },
    [roomId],
  );

  // Reset when switching rooms
  useEffect(() => {
    setMessages([]);
    setTyping({});
    setError("");
    setShowMembers(false);
    setText("");
    if (isMember) {
      loadHistory(1).then(() => bottomRef.current?.scrollIntoView());
      loadMembers();
    }
  }, [roomId, isMember, loadHistory, loadMembers]);

  // Real-time events
  useEffect(() => {
    if (!socket || !isMember) return;
    socket.emit("join_room", { roomId });

    const sameRoom = (p) => String(roomIdOf(p)) === String(roomId);
    const note = (text) =>
      setMessages((prev) =>
        mergeMessages(prev, [
          {
            id: `sys-${Date.now()}-${Math.random()}`,
            system: true,
            content: text,
            createdAt: new Date().toISOString(),
          },
        ]),
      );

    const onMessage = (m) =>
      sameRoom(m) && setMessages((prev) => mergeMessages(prev, [m]));
    const onJoined = (p) => {
      if (sameRoom(p)) {
        note(`${displayName(userFrom(p))} joined the room`);
        loadMembers();
      }
    };
    const onLeft = (p) => {
      if (sameRoom(p)) {
        note(`${displayName(userFrom(p))} left the room`);
        loadMembers();
      }
    };
    const onTyping = (p) => {
      if (!sameRoom(p)) return;
      const u = userFrom(p);
      const id = idOf(u) ?? p.userId;
      if (id === myId) return;
      setTyping((t) => ({ ...t, [id]: displayName(u) }));
      setTimeout(
        () =>
          setTyping((t) => {
            const n = { ...t };
            delete n[id];
            return n;
          }),
        3000,
      );
    };
    const onStop = (p) => {
      const id = idOf(userFrom(p)) ?? p?.userId;
      setTyping((t) => {
        const n = { ...t };
        delete n[id];
        return n;
      });
    };
    const onDeleted = (p) => {
      const id = p?.messageId ?? idOf(p);
      setMessages((prev) => prev.filter((m) => idOf(m) !== id));
    };

    const onRoomsChanged = (p) => {
      if (String(p?.roomId) === String(roomId)) loadMembers();
    };

    socket.on("receive_message", onMessage);
    socket.on("user_joined", onJoined);
    socket.on("user_left", onLeft);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStop);
    socket.on("message_deleted", onDeleted);
    // Re-join the socket room after a reconnect
    const onReconnect = () => socket.emit("join_room", { roomId });
    socket.on("connect", onReconnect);
    socket.on("rooms_changed", onRoomsChanged);

    return () => {
      socket.off("receive_message", onMessage);
      socket.off("user_joined", onJoined);
      socket.off("user_left", onLeft);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStop);
      socket.off("message_deleted", onDeleted);
      socket.off("connect", onReconnect);
      socket.off("rooms_changed", onRoomsChanged);
    };
  }, [socket, roomId, isMember, myId, loadMembers]);

  // Keep the view pinned to the newest message
  const lastId = idOf(messages[messages.length - 1]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastId]);

  const handleChange = (e) => {
    setText(e.target.value);
    socket?.emit("typing", { roomId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket?.emit("stop_typing", { roomId }),
      1500,
    );
  };

  const send = (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !socket) return;
    socket.emit("send_message", { roomId, content });
    socket.emit("stop_typing", { roomId });
    setText("");
  };

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/room/${roomId}/join`);
      await onChanged();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!confirm(`Leave "${room.name}"?`)) return;
    try {
      await api.post(`/room/${roomId}/leave`);
      socket?.emit("leave_room", { roomId });
      await onChanged();
      onClosed();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const removeRoom = async () => {
    if (!confirm(`Delete "${room.name}" for everyone?`)) return;
    try {
      await api.delete(`/room/${roomId}`);
      await onChanged();
      onClosed();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const removeMessage = async (id) => {
    try {
      await api.delete(`/rooms/${id}`);
      setMessages((prev) => prev.filter((m) => idOf(m) !== id));
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const makeAdmin = async (userId) => {
    setPromoting(userId);
    setError("");
    try {
      await api.post(`/room/${roomId}/admins`, { userId });
      await onChanged(); // reloads rooms so room.admins is fresh
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPromoting(null);
    }
  };

  const removeAdmin = async (userId) => {
    setPromoting(userId);
    setError("");
    try {
      await api.delete(`/room/${roomId}/admins/${userId}`);
      await onChanged();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPromoting(null);
    }
  };

  const removeMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from "${room.name}"?`)) return;
    setPromoting(userId);
    setError("");
    try {
      await api.delete(`/room/${roomId}/members/${userId}`);
      await loadMembers();
      await onChanged();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setPromoting(null);
    }
  };

  const header = (
    <header className="flex items-center gap-3 border-b border-mist bg-white px-4 py-3">
      <button
        onClick={onBack}
        aria-label="Back to rooms"
        className="rounded-lg p-2 hover:bg-chalk md:hidden"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-lg font-bold">{room.name}</h2>
        <p className="truncate text-xs text-slate-500">
          {room.description || `${room.members?.length ?? 0} members`}
        </p>
      </div>
      {canAdd && (
        <button
          onClick={() => setShowAdd(true)}
          aria-label="Add member"
          title="Add member"
          className="rounded-lg p-2 hover:bg-chalk"
        >
          <UserPlus size={19} />
        </button>
      )}

      {isMember && (
        <>
          <button
            onClick={() => setShowMembers((s) => !s)}
            aria-label="Members"
            title="Members"
            className={`rounded-lg p-2 hover:bg-chalk ${showMembers ? "bg-chalk" : ""}`}
          >
            <Users size={19} />
          </button>
          {isCreator && (
            <>
              <button
                onClick={onEdit}
                aria-label="Edit room"
                title="Edit room"
                className="rounded-lg p-2 hover:bg-chalk"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={removeRoom}
                aria-label="Delete room"
                title="Delete room"
                className="rounded-lg p-2 text-coral hover:bg-coral/10"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          <button
            onClick={leave}
            aria-label="Leave room"
            title="Leave room"
            className="rounded-lg p-2 hover:bg-chalk"
          >
            <LogOut size={18} />
          </button>
        </>
      )}
    </header>
  );

  if (!isMember) {
    return (
      <section className="flex h-full flex-col">
        {header}
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div className="max-w-sm space-y-4">
            <h3 className="font-display text-2xl font-bold">
              Join {room.name} to read and send messages
            </h3>
            <p className="text-slate-600">
              {room.description || "You're not a member of this room yet."}
            </p>
            <ErrorText>{error}</ErrorText>
            <Button onClick={join} loading={busy}>
              <UserPlus size={16} /> Join room
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const typers = Object.values(typing);
  let lastDay = "";
  let lastSender = "";

  return (
    <section className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        {error && (
          <div className="p-3">
            <ErrorText>{error}</ErrorText>
          </div>
        )}

        <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
          {hasMore && (
            <div className="mb-4 text-center">
              <Button
                variant="ghost"
                loading={loading}
                onClick={() => loadHistory(page + 1)}
              >
                Load earlier messages
              </Button>
            </div>
          )}
          {loading && messages.length === 0 && <Spinner />}
          {!loading && messages.length === 0 && (
            <p className="mt-10 text-center text-slate-500">
              No messages yet. Say hello.
            </p>
          )}

          {messages.map((m) => {
            const day = formatDay(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const divider = showDay && (
              <div className="my-4 text-center text-xs font-medium text-slate-500">
                {day}
              </div>
            );

            if (m.system) {
              lastSender = "";
              return (
                <Fragment key={idOf(m)}>
                  {divider}
                  <p className="my-2 text-center text-xs text-slate-500">
                    {m.content}
                  </p>
                </Fragment>
              );
            }

            const sender = m.sender;
            const senderId = idOf(sender);
            const mine = senderId === myId;
            const showName = senderId !== lastSender || showDay;
            lastSender = senderId;

            return (
              <Fragment key={idOf(m)}>
                {divider}
                <div
                  className={`group mb-1 flex gap-2 ${mine ? "flex-row-reverse" : ""} ${showName ? "mt-3" : ""}`}
                >
                  <div className="w-8 shrink-0">
                    {showName && !mine && <Avatar user={sender} size={32} />}
                  </div>
                  <div
                    className={`max-w-[78%] md:max-w-[65%] ${mine ? "items-end" : "items-start"} flex flex-col`}
                  >
                    {showName && !mine && (
                      <span className="mb-0.5 text-xs font-semibold text-slate-600">
                        {displayName(sender)}
                      </span>
                    )}
                    <div
                      className={`flex items-center gap-1 ${mine ? "flex-row-reverse" : ""}`}
                    >
                      <p
                        className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-sm bg-lagoon text-white" : "rounded-bl-sm bg-white shadow-sm"}`}
                      >
                        {m.content}
                      </p>
                      {mine && (
                        <button
                          onClick={() => removeMessage(idOf(m))}
                          aria-label="Delete message"
                          className="rounded p-1 text-slate-400 opacity-0 transition hover:text-coral focus:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <span className="mt-0.5 text-[11px] text-slate-400">
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                </div>
              </Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="h-5 px-5 text-xs italic text-slate-500">
          {typers.length > 0 &&
            `${typers.join(", ")} ${typers.length > 1 ? "are" : "is"} typing…`}
        </div>
        <form
          onSubmit={send}
          className="flex items-end gap-2 border-t border-mist bg-white p-3"
        >
          <textarea
            value={text}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send(e);
            }}
            rows={1}
            maxLength={2000}
            placeholder={`Message ${room.name}`}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-mist px-3.5 py-2.5 text-sm outline-none focus:border-lagoon focus:ring-2 focus:ring-lagoon/20"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send message"
            className="grid h-11 w-11 place-items-center rounded-xl bg-lagoon text-white transition hover:bg-lagoon-dark disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {showMembers && (
        <aside className="absolute inset-y-0 right-0 z-10 w-72 border-l border-mist bg-white md:static">
          <div className="flex items-center justify-between border-b border-mist p-4">
            <h3 className="font-display font-bold">
              Members ({members.length})
            </h3>
            <button
              onClick={() => setShowMembers(false)}
              aria-label="Close members"
              className="rounded p-1 hover:bg-chalk"
            >
              <X size={18} />
            </button>
          </div>
          <ul className="scroll-thin max-h-full space-y-1 overflow-y-auto p-3">
            {members.map((u) => {
              const uid = idOf(u);
              const uIsCreator = String(idOf(room.createdBy)) === String(uid);
              const uIsAdmin =
                uIsCreator ||
                room.admins?.some((a) => String(idOf(a)) === String(uid));

              const iAmOwner = isCreator || me.role === "admin";
              const canPromote = isRoomAdmin && !uIsAdmin;
              const canDemote = iAmOwner && uIsAdmin && !uIsCreator;
              const canRemove =
                uid !== myId &&
                !uIsCreator &&
                (iAmOwner || (isRoomAdmin && !uIsAdmin));
              const pending = promoting === uid;

              return (
                <li
                  key={uid}
                  className="flex items-center gap-2 rounded-lg p-2"
                >
                  <Avatar
                    user={u}
                    size={34}
                    online={onlineMap[uid] ?? !!u.isOnline}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {displayName(u)}
                    {uid === myId && (
                      <span className="text-slate-400"> (you)</span>
                    )}
                  </span>

                  {uIsAdmin && (
                    <span className="rounded-full bg-lagoon/10 px-2 py-0.5 text-[11px] font-semibold text-lagoon">
                      {uIsCreator ? "Creator" : "Admin"}
                    </span>
                  )}

                  {canPromote && (
                    <button
                      onClick={() => makeAdmin(uid)}
                      disabled={pending}
                      className="rounded-lg border border-mist px-2 py-1 text-[11px] font-medium hover:bg-chalk disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Make admin"}
                    </button>
                  )}

                  {canDemote && (
                    <button
                      onClick={() => removeAdmin(uid)}
                      disabled={pending}
                      className="rounded-lg border border-mist px-2 py-1 text-[11px] font-medium hover:bg-chalk disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Remove admin"}
                    </button>
                  )}

                  {canRemove && (
                    <button
                      onClick={() => removeMember(uid, displayName(u))}
                      disabled={pending}
                      aria-label="Remove from room"
                      title="Remove from room"
                      className="rounded p-1 text-coral hover:bg-coral/10 disabled:opacity-50"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>
      )}

      {showAdd && (
        <AddMemberModal
          roomId={roomId}
          onClose={() => setShowAdd(false)}
          onAdded={async () => {
            await loadMembers();
            await onChanged();
          }}
        />
      )}
    </section>
  );
}
