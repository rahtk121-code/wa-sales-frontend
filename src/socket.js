import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function connectSocket(userId) {
  const s = getSocket();

  // تأكد من الاتصال أولاً ثم انضم للغرفة
  if (!s.connected) {
    s.connect();

    // انضم للغرفة بعد الاتصال مباشرة
    s.once("connect", () => {
      s.emit("join-user-room", userId);
    });
  } else {
    // إذا كان متصلاً، انضم مباشرة
    s.emit("join-user-room", userId);
  }

  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
