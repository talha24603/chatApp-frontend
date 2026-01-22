import { io } from "socket.io-client";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const socket = io(BASE_URL, {
  autoConnect: false,
  auth: { token: null },
});

export default socket;
