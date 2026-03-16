"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserRooms, updateRoomProfile, type Room, type RoomMember } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";

function GroupMembersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("roomId");
  const { user, token, isAuthenticated } = useAuth();
  const { onlineUsers } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !user || !roomId) {
      if (!isAuthenticated) {
        router.push("/signin");
      }
      return;
    }

    const fetchRoom = async () => {
      try {
        setLoading(true);
        const rooms = await getUserRooms(user.username, token);
        const foundRoom = rooms.find((r) => r._id === roomId);

        if (!foundRoom) {
          setError("Room not found");
          setLoading(false);
          return;
        }

        if (!foundRoom.isGroup) {
          setError("This is not a group room");
          setLoading(false);
          return;
        }

        setRoom(foundRoom);
      } catch (err: any) {
        setError(err.message || "Failed to load room members");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [isAuthenticated, token, user, roomId, router]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  const getMemberId = (member: RoomMember | string): string => {
    return typeof member === "object" ? member._id : member;
  };

  const getMemberUsername = (member: RoomMember | string): string => {
    return typeof member === "object" ? member.username : member;
  };

  const getMemberProfileImage = (member: RoomMember | string): string | undefined => {
    return typeof member === "object" ? member.profileImage : undefined;
  };

  const isAdmin = (member: RoomMember | string): boolean => {
    if (!room?.admin) return false;
    const adminId = typeof room.admin === "object" ? room.admin._id : room.admin;
    const memberId = getMemberId(member);
    return adminId === memberId;
  };

  const isCurrentUserAdmin = (): boolean => {
    if (!room?.admin || !user) return false;
    const adminId = typeof room.admin === "object" ? room.admin._id : room.admin;
    return adminId === user.id;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId || !token) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      setError("");
      const result = await updateRoomProfile(roomId, file, token);
      setRoom(result.room);
      
      // Refresh rooms list
      if (user) {
        const rooms = await getUserRooms(user.username, token);
        const updatedRoom = rooms.find((r) => r._id === roomId);
        if (updatedRoom) {
          setRoom(updatedRoom);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to update group profile image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-zinc-800 border-t-gray-900 dark:border-t-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-8 max-w-md w-full text-center">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Room not found"}
          </p>
          <Link
            href="/chat"
            className="inline-block bg-white dark:bg-white hover:bg-gray-100 text-black font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  const members = Array.isArray(room.members) ? room.members : [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Group Profile Image */}
              <div className="relative flex-shrink-0">
                {room.profileImage ? (
                  <img
                    src={room.profileImage}
                    alt={room.name || "Group"}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-zinc-600"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-gray-900 dark:text-white font-semibold text-2xl border-2 border-gray-400 dark:border-zinc-600">
                    {room.name ? room.name.charAt(0).toUpperCase() : "G"}
                  </div>
                )}
                {isCurrentUserAdmin() && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-900 dark:text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Change group photo"
                  >
                    {uploading ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
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
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {room.name || "Group Members"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>
            <Link
              href={`/chat?roomId=${roomId}`}
              className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors ml-4"
            >
              Back to Chat
            </Link>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No members found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-zinc-700">
              {members.map((member, index) => {
                const memberId = getMemberId(member);
                const username = getMemberUsername(member);
                const profileImage = getMemberProfileImage(member);
                const online = isUserOnline(memberId);
                const admin = isAdmin(member);

                return (
                  <div
                    key={memberId}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Profile Image */}
                      <div className="relative flex-shrink-0">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={username}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-gray-900 dark:text-white font-semibold text-lg">
                            {username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Online Status Indicator */}
                        {online && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                        )}
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {username}
                          </h3>
                          {admin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {online ? (
                            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                              Online
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Offline
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GroupMembersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-zinc-800 border-t-gray-900 dark:border-t-white mx-auto"></div>
          <p className="text-gray-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <GroupMembersPageContent />
    </Suspense>
  );
}
