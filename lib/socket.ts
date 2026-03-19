import { io } from "socket.io-client";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ;

const socket = io(BASE_URL, {
  autoConnect: false,
  auth: { token: null },
});

export default socket;
