import { io } from "socket.io-client";
import { API_URL } from "./api.js";

let socket = null;

// JWT is sent in the handshake, as the server expects
export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(API_URL, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
