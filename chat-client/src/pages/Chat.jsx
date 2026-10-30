import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import api, { TOKEN_KEY, pick } from "../lib/api.js";
import { connectSocket, disconnectSocket } from "../lib/socket.js";
import { idOf, userFrom } from "../lib/helpers.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import RoomModal from "../components/RoomModal.jsx";
import ProfileModal from "../components/ProfileModal.jsx";

export default function Chat() {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineMap, setOnlineMap] = useState({});
  const [modal, setModal] = useState(null); // "create" | "edit" | "profile"

  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get("/room");
      const list = pick(res, "rooms");
      setRooms(
        (Array.isArray(list) ? list : []).map((r) => ({
          ...r,
          name: r.groupName ?? r.name,
        })),
      );
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // One authenticated socket for the whole session
  useEffect(() => {
    const s = connectSocket(localStorage.getItem(TOKEN_KEY));
    setSocket(s);
    const setOnline = (value) => (p) => {
      const id = idOf(userFrom(p)) ?? p?.userId;
      if (id) setOnlineMap((m) => ({ ...m, [id]: value }));
    };
    const on = setOnline(true);
    const off = setOnline(false);
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("user_online", on);
    s.on("user_offline", off);
    s.on("rooms_changed", ({ roomId, action }) => {
      if (action === "deleted") {
        setActiveId((cur) => (String(cur) === String(roomId) ? null : cur));
      }
      loadRooms();
    });

    return () => {
      s.off();
      disconnectSocket();
    };
  }, [loadRooms]);

  const activeRoom = rooms.find((r) => idOf(r) === activeId);

  return (
    <div className="relative flex h-dvh overflow-hidden">
      <Sidebar
        className={activeRoom ? "hidden md:flex" : "flex"}
        user={user}
        rooms={rooms}
        loading={loadingRooms}
        activeId={activeId}
        connected={connected}
        onSelect={setActiveId}
        onCreate={() => setModal("create")}
        onProfile={() => setModal("profile")}
        onLogout={logout}
      />

      <main
        className={`min-w-0 flex-1 ${activeRoom ? "block" : "hidden md:block"}`}
      >
        {activeRoom ? (
          <ChatWindow
            room={activeRoom}
            me={user}
            socket={socket}
            onlineMap={onlineMap}
            onChanged={loadRooms}
            onClosed={() => setActiveId(null)}
            onEdit={() => setModal("edit")}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <MessageCircle size={44} className="mx-auto mb-4 text-lagoon" />
              <h2 className="font-display text-2xl font-bold">
                Pick a room to start talking
              </h2>
              <p className="mt-1 text-slate-600">
                Or create a new one from the sidebar.
              </p>
            </div>
          </div>
        )}
      </main>

      {modal === "create" && (
        <RoomModal onClose={() => setModal(null)} onSaved={loadRooms} />
      )}
      {modal === "edit" && activeRoom && (
        <RoomModal
          room={activeRoom}
          onClose={() => setModal(null)}
          onSaved={loadRooms}
        />
      )}
      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}
    </div>
  );
}
