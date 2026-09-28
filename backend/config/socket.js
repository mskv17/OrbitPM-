import { Server } from "socket.io";

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:4321",
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    // Join a specific Kanban board room
    socket.on("join:board", (boardId) => {
      if (boardId) {
        socket.join(`board:${boardId}`);
      }
    });

    // Leave a specific Kanban board room
    socket.on("leave:board", (boardId) => {
      if (boardId) {
        socket.leave(`board:${boardId}`);
      }
    });

    // Join a project room
    socket.on("join:project", (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on("leave:project", (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Join a personal user room for direct notifications
    socket.on("join:user", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on("leave:user", (userId) => {
      if (userId) {
        socket.leave(`user:${userId}`);
      }
    });

    // Join a card room for live task comments & details sync
    socket.on("join:card", (cardId) => {
      if (cardId) {
        socket.join(`card:${cardId}`);
      }
    });

    socket.on("leave:card", (cardId) => {
      if (cardId) {
        socket.leave(`card:${cardId}`);
      }
    });

    socket.on("disconnect", () => {
      // client disconnected cleanly
    });
  });

  return io;
}

export function getIO() {
  return io;
}
