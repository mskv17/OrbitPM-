import { io } from "socket.io-client";

let socket = null;

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:1800";

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function joinBoard(boardId) {
  const s = getSocket();
  if (s && boardId) {
    s.emit("join:board", boardId);
  }
}

export function leaveBoard(boardId) {
  const s = getSocket();
  if (s && boardId) {
    s.emit("leave:board", boardId);
  }
}

export function joinUser(userId) {
  const s = getSocket();
  if (s && userId) {
    s.emit("join:user", userId);
  }
}

export function leaveUser(userId) {
  const s = getSocket();
  if (s && userId) {
    s.emit("leave:user", userId);
  }
}

export function joinCard(cardId) {
  const s = getSocket();
  if (s && cardId) {
    s.emit("join:card", cardId);
  }
}

export function leaveCard(cardId) {
  const s = getSocket();
  if (s && cardId) {
    s.emit("leave:card", cardId);
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
