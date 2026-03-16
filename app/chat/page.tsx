"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { getUserRooms, getRoomMessages, type Room, type Message, uploadMessageImage, deleteMessage } from "@/lib/api";
import { formatDateSeparator, formatMessageTime, shouldShowDateSeparator } from "@/lib/utils";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("roomId");
  const { socket, onlineUsers, isConnected } = useSocket();
  const { user, token, isAuthenticated, logout } = useAuth();
  const currentUserId = user?.id;
  const currentUsername = user?.username;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    messageId: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    // Also scroll the end ref into view as a fallback
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // Function to update URL without reload
  const updateRoomId = (newRoomId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newRoomId) {
      params.set("roomId", newRoomId);
    } else {
      params.delete("roomId");
    }
    router.push(`/chat?${params.toString()}`, { scroll: false });
  };

  // Track if this is the initial load
  const isInitialLoad = useRef(true);

  // Fetch user rooms
  useEffect(() => {
    if (!isAuthenticated || !token || !user) return;

    const fetchRooms = async () => {
      try {
        const userRooms = await getUserRooms(user.username, token);
        setRooms(userRooms);

        // On initial load, if no roomId is specified, auto-select first room
        if (isInitialLoad.current && !roomId && userRooms.length > 0) {
          const params = new URLSearchParams();
          params.set("roomId", userRooms[0]._id);
          router.push(`/chat?${params.toString()}`, { scroll: false });
        }
        isInitialLoad.current = false;
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [isAuthenticated, token, user, router]);

  // Update selectedRoom when roomId changes
  useEffect(() => {
    if (!roomId) {
      setSelectedRoom(null);
    } else if (rooms.length > 0) {
      const room = rooms.find((r) => r._id === roomId);
      if (room) {
        setSelectedRoom(room);
      } else {
        setSelectedRoom(null);
      }
    }
  }, [roomId, rooms]);

  // Fetch messages from database when room changes
  useEffect(() => {
    if (!roomId || !token) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const fetchedMessages = await getRoomMessages(roomId, token);
        setMessages(fetchedMessages);
        // Scroll to bottom after messages are loaded
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [roomId, token, scrollToBottom]);

  // Socket connection and message handling
  useEffect(() => {
    if (!socket || !roomId) {
      return;
    }

    socket.emit("join_room", roomId);

    const handleReceiveMessage = (msg: Message) => {
      const msgRoomId = typeof msg.room === "object" ? msg.room._id : msg.room;
      if (msgRoomId === roomId || msgRoomId?.toString() === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
      // Refresh rooms list to update last message
      if (token && user) {
        getUserRooms(user.username, token).then(setRooms).catch(console.error);
      }
    };

    const handleSendMessageError = (data: { message: string }) => {
      console.error("Error sending message:", data.message);
      alert(`Failed to send message: ${data.message}`);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("send_message_error", handleSendMessageError);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("send_message_error", handleSendMessageError);
    };
  }, [roomId, socket, token, user]);

  useEffect(() => {
    if (!socket || !roomId) {
      return;
    }
    const handleMessageDeleted = (data: { messageId: string; roomId: string }) => {
      if (data.roomId === roomId) {
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      }
    };
    socket.on("message_deleted", handleMessageDeleted);
    return () => {
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [roomId, socket]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!token || !confirm("Are you sure you want to delete this message?")) {
      return;
    }
    try {
      await deleteMessage(messageId, token);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      setContextMenu(null); // Close context menu after deletion
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position, ensuring menu stays within viewport
    const menuWidth = 150;
    const menuHeight = 50;
    const x = e.clientX + menuWidth > window.innerWidth 
      ? window.innerWidth - menuWidth - 10 
      : e.clientX;
    const y = e.clientY + menuHeight > window.innerHeight 
      ? window.innerHeight - menuHeight - 10 
      : e.clientY;

    setContextMenu({
      visible: true,
      x,
      y,
      messageId,
    });
  };

  // Close context menu when clicking outside or right-clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    const handleContextMenuOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu?.visible) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleContextMenuOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("contextmenu", handleContextMenuOutside);
      };
    }
  }, [contextMenu]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        alert("Please select an image file");
      }
    }
  }
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Get room display name
  const getRoomName = (room: Room): string => {
    if (room.isGroup && room.name) {
      return room.name;
    }
    // For private rooms, show the other user's name
    if (!room.isGroup && Array.isArray(room.members)) {
      const otherMember = room.members.find(
        (m) => (typeof m === "object" ? m.username : m) !== currentUsername
      );
      if (otherMember) {
        return typeof otherMember === "object" ? otherMember.username : otherMember;
      }
    }
    return "Chat";
  };

  // Get other user's ID in a private room
  const getOtherUserId = (room: Room): string | null => {
    if (room.isGroup || !Array.isArray(room.members)) return null;
    const otherMember = room.members.find(
      (m) => {
        const memberId = typeof m === "object" ? m._id : m;
        return memberId !== currentUserId;
      }
    );
    if (!otherMember) return null;
    return typeof otherMember === "object" ? otherMember._id : otherMember;
  };

  // Check if user is online
  const isUserOnline = (userId: string | null): boolean => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  const sendMessage = async () => {
    if ((!text.trim() && !selectedImage) || !socket || !roomId || !currentUserId || !token) return;

    // Check if socket is connected
    if (!isConnected) {
      console.error("Socket is not connected");
      alert("Connecting to server. Please wait a moment and try again.");
      return;
    }

    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        setUploadingImage(true);
        const result = await uploadMessageImage(selectedImage, token);
        imageUrl = result.imageUrl;
        setUploadingImage(false);
      }
      
      console.log("Sending message:", { roomId, userId: currentUserId, text: text || "", image: imageUrl });
      
      socket.emit("send_message", {
        roomId,
        userId: currentUserId,
        text: text || "",
        image: imageUrl,
      });

      setText("");
      setSelectedImage(null);
      setImagePreview(null);
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Filter rooms based on search query
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const roomName = getRoomName(room).toLowerCase();
      
      // Check if room name matches
      if (roomName.includes(query)) return true;
      
      // Check if any member username matches (for private chats)
      if (!room.isGroup && Array.isArray(room.members)) {
        return room.members.some((member) => {
          const username = typeof member === "object" ? member.username : member;
          return username.toLowerCase().includes(query);
        });
      }
      
      return false;
    });
  }, [rooms, searchQuery, currentUsername]);

  const handleLogout = () => {
    socket.disconnect();
    logout();
    router.push("/signin");
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-zinc-800 border-t-gray-900 dark:border-t-white mx-auto"></div>
          <p className="text-gray-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black">
      {/* Sidebar - Rooms List */}
      <div className={`${selectedRoom ? 'hidden' : 'flex'} md:flex w-full md:w-1/4 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-col`}>
        {/* Sidebar Header */}
        <div className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 px-4 py-4 flex items-center justify-between">
          <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Chats</h2>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-lg p-2 transition-colors focus:outline-none"
              title="Menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden z-50 shadow-xl">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/create-room"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border-t border-gray-200 dark:border-zinc-700"
                >
                  New Room
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border-t border-gray-200 dark:border-zinc-700 text-left"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-zinc-700 rounded-full focus:outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors text-sm"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-zinc-500">
              <p className="mb-4">
                {searchQuery.trim() ? "No chats found" : "No chats yet"}
              </p>
              {!searchQuery.trim() && (
                <Link
                  href="/create-room"
                  className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-zinc-300 font-medium hover:underline transition-colors"
                >
                  Start a new chat
                </Link>
              )}
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isSelected = room._id === roomId;
              const roomName = getRoomName(room);

              return (
                <button
                  key={room._id}
                  onClick={() => updateRoomId(room._id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${isSelected
                    ? "bg-gray-100 dark:bg-zinc-800 rounded-lg"
                    : ""
                    }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 relative">
                      {room.isGroup ? (
                        room.profileImage ? (
                          <img
                            src={room.profileImage}
                            alt={roomName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-gray-900 dark:text-white font-semibold text-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                        )
                      ) : (
                        (() => {
                          const otherMember = Array.isArray(room.members)
                            ? room.members.find(
                              (m) =>
                                (typeof m === "object" ? m.username : m) !==
                                currentUsername
                            )
                            : null;
                          const otherProfileImage =
                            otherMember && typeof otherMember === "object"
                              ? otherMember.profileImage
                              : undefined;
                          if (otherProfileImage) {
                            return (
                              <img
                                src={otherProfileImage}
                                alt={roomName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            );
                          }
                          return (
                            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-gray-900 dark:text-white font-semibold text-lg">
                              {roomName.charAt(0).toUpperCase()}
                            </div>
                          );
                        })()
                      )}
                      {/* Online status indicator for private chats */}
                      {!room.isGroup && isUserOnline(getOtherUserId(room)) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate ${isSelected
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-900 dark:text-zinc-300"
                            }`}
                        >
                          {roomName}
                        </p>
                      </div>
                      {room.isGroup && Array.isArray(room.members) ? (
                        <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                          {room.members.length} members
                        </p>
                      ) : !room.isGroup && isUserOnline(getOtherUserId(room)) ? (
                        <p className="text-xs text-green-600 dark:text-green-400 truncate">
                          Online
                        </p>
                      ) : !room.isGroup ? (
                        <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                          Offline
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedRoom ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-gray-50 dark:bg-black`}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => updateRoomId(null)}
                    className="md:hidden text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white mr-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                  </button>
                  {/* Group/User Profile Image */}
                  <div className="flex-shrink-0 relative">
                    {selectedRoom.isGroup ? (
                      selectedRoom.profileImage ? (
                        <img
                          src={selectedRoom.profileImage}
                          alt={getRoomName(selectedRoom)}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-gray-900 dark:text-white font-semibold">
                          {getRoomName(selectedRoom).charAt(0).toUpperCase()}
                        </div>
                      )
                    ) : (
                      (() => {
                        const otherMember = Array.isArray(selectedRoom.members)
                          ? selectedRoom.members.find(
                            (m) =>
                              (typeof m === "object" ? m.username : m) !==
                              currentUsername
                          )
                          : null;
                        const otherProfileImage =
                          otherMember && typeof otherMember === "object"
                            ? otherMember.profileImage
                            : undefined;
                        if (otherProfileImage) {
                          return (
                            <img
                              src={otherProfileImage}
                              alt={getRoomName(selectedRoom)}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          );
                        }
                        return (
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-gray-900 dark:text-white font-semibold">
                            {getRoomName(selectedRoom).charAt(0).toUpperCase()}
                          </div>
                        );
                      })()
                    )}
                    {!selectedRoom.isGroup && isUserOnline(getOtherUserId(selectedRoom)) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-800 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {selectedRoom.isGroup ? (
                        <Link
                          href={`/group-members?roomId=${selectedRoom._id}`}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          {getRoomName(selectedRoom)}
                        </Link>
                      ) : (
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getRoomName(selectedRoom)}
                        </h1>
                      )}
                      {!selectedRoom.isGroup && isUserOnline(getOtherUserId(selectedRoom)) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    {selectedRoom.isGroup && Array.isArray(selectedRoom.members) ? (
                      <div className="flex items-center gap-2 ">
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                          {selectedRoom.members.length} members
                        </p>
                        
                      </div>
                    ) : !selectedRoom.isGroup && isUserOnline(getOtherUserId(selectedRoom)) ? (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Online
                      </p>
                    ) : !selectedRoom.isGroup ? (
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Offline
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef} 
              className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 "
              style={{
                //backgroundColor: "#0D0D0D",
                backgroundImage: "url('/chatBackground.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            >
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-zinc-400 mb-2">
                      No messages yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-zinc-500">
                      Start the conversation by sending a message
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => {
                    const senderId = typeof m.sender === "object" ? m.sender._id : m.sender;
                    const isOwnMessage = senderId === currentUserId;
                    const senderUsername =
                      typeof m.sender === "object" ? m.sender.username : "User";
                    const isGroupChat = selectedRoom?.isGroup || false;
                    const previousMessage = i > 0 ? messages[i - 1] : undefined;
                    const showDateSeparator =
                      previousMessage &&
                      shouldShowDateSeparator(m as Message, previousMessage as Message);

                    return (
                      <div key={m._id || i}>
                        {showDateSeparator && m.createdAt && (
                          <div className="my-4 flex items-center justify-center">
                            <div className="rounded-full bg-zinc-200 px-3 py-1 dark:bg-zinc-700">
                              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                {formatDateSeparator(m.createdAt)}
                              </p>
                            </div>
                          </div>
                        )}

                        <div
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"
                            } group`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 relative ${isOwnMessage
                              ? "bg-blue-500 dark:bg-zinc-800 text-white"
                              : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100"
                              }`}
                            onContextMenu={(e) => {
                              if (isOwnMessage) {
                                handleContextMenu(e, m._id);
                              }
                            }}
                          >
                            {!isOwnMessage && isGroupChat && (
                              <p className="mb-1 text-xs font-semibold opacity-80">
                                {senderUsername}
                              </p>
                            )}
                            {m.image && (
                              <div className="mb-2">
                                <img
                                  src={m.image}
                                  alt="Message Image"
                                  className="w-full h-auto max-h-40 object-cover rounded-lg mb-1"
                                />
                              </div>
                            )}

                            {m.text && <p className="text-sm">{m.text}</p>}
                            {m.createdAt && (
                              <p
                                className={`mt-1 text-xs ${isOwnMessage
                                  ? "text-blue-100 dark:text-zinc-400"
                                  : "text-gray-500 dark:text-zinc-500"
                                  }`}
                              >
                                {formatMessageTime(m.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Context Menu */}
            {contextMenu?.visible && (
              <div
                className="fixed bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 min-w-[150px]"
                style={{
                  left: `${contextMenu.x}px`,
                  top: `${contextMenu.y}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(contextMenu.messageId);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4">
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg max-h-48 object-contain"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </label>
                <div className="flex-1 relative">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 dark:border-zinc-700 rounded-full focus:outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    <button
                      onClick={sendMessage}
                      disabled={!text.trim() && !selectedImage}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      <img 
                        src="/send.png" 
                        alt="Send" 
                        className="h-5 w-5 brightness-0 invert"
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-zinc-400 mb-4">
                Select a chat to start messaging
              </p>
              <Link
                href="/create-room"
                className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-zinc-300 font-medium hover:underline transition-colors"
              >
                Create a new chat
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-zinc-800 border-t-gray-900 dark:border-t-white mx-auto"></div>
          <p className="text-gray-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

