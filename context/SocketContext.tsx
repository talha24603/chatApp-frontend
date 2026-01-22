"use client";

import { createContext, useContext, useEffect, ReactNode, useState } from "react";
import socket from "@/lib/socket";
import type { Socket } from "socket.io-client";

interface OnlineUsersContextType {
  socket: Socket;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<OnlineUsersContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    if (token) {
      // Update socket auth with token
      socket.auth = { token };
      
      // Connect socket
      socket.connect();

      // Listen for the initial list of online users (sent when socket connects)
      socket.on("online_users_list", (data: { onlineUserIds: string[] }) => {
        if (data.onlineUserIds) {
          setOnlineUsers(new Set(data.onlineUserIds));
        }
      });

      // Listen for user status updates
      socket.on("user_status", (data: { userId: string; status: "online" | "offline" }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (data.status === "online") {
            next.add(data.userId);
          } else {
            next.delete(data.userId);
          }
          return next;
        });
      });

      // Fallback: Fetch initial online users list via HTTP (in case socket event is missed)
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/users/online`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.onlineUserIds) {
            // Merge with existing online users instead of replacing
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              data.onlineUserIds.forEach((id: string) => next.add(id));
              return next;
            });
          }
        })
        .catch((err) => console.error("Error fetching online users:", err));
    }

    return () => {
      socket.off("user_status");
      socket.off("online_users_list");
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): OnlineUsersContextType => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
};
