"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPrivateRoom, createGroupRoom } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CreateRoomPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const [roomType, setRoomType] = useState<"private" | "group">("private");
  const [formData, setFormData] = useState({
    username: "",
    roomName: "",
    memberUsernames: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.push("/signin");
//     }
//   }, [isAuthenticated, router]);

  // Don't render form if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!token || !user) {
        throw new Error("You must be logged in to create a room");
      }

      if (roomType === "private") {
        if (!formData.username.trim()) {
          throw new Error("Please enter a username");
        }

        const response = await createPrivateRoom(
          {
            user1: user.username,
            user2: formData.username.trim(),
          },
          token
        );

        router.push(`/chat?roomId=${response._id}`);
      } else {
        if (!formData.roomName.trim()) {
          throw new Error("Please enter a room name");
        }

        if (!formData.memberUsernames.trim()) {
          throw new Error("Please enter at least one member username");
        }

        // Parse member usernames (comma-separated)
        const memberUsernames = formData.memberUsernames
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u.length > 0);

        if (memberUsernames.length === 0) {
          throw new Error("Please enter at least one valid member username");
        }

        // Include current user in members
        const allMemberUsernames = [user.username, ...memberUsernames];

        const response = await createGroupRoom(
          {
            name: formData.roomName.trim(),
            memberIds: allMemberUsernames,
            createdBy: user.username,
          },
          token
        );

        router.push(`/chat?roomId=${response._id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              Create Room
            </h1>
            <p className="text-gray-600 dark:text-zinc-400">
              Start a new conversation
            </p>
          </div>

          {/* Room Type Selector */}
          <div className="mb-6">
            <div className="flex gap-2 bg-gray-200 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setRoomType("private");
                  setError("");
                  setFormData({ username: "", roomName: "", memberUsernames: "" });
                }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                  roomType === "private"
                    ? "bg-white dark:bg-white text-black"
                    : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Private Chat
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoomType("group");
                  setError("");
                  setFormData({ username: "", roomName: "", memberUsernames: "" });
                }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                  roomType === "group"
                    ? "bg-white dark:bg-white text-black"
                    : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Group Chat
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {roomType === "private" ? (
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"
                  placeholder="Enter username to chat with"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">
                  Enter the username of the person you want to chat with
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="roomName"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2"
                  >
                    Room Name
                  </label>
                  <input
                    id="roomName"
                    name="roomName"
                    type="text"
                    required
                    value={formData.roomName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"
                    placeholder="Enter room name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="memberUsernames"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2"
                  >
                    Members (comma-separated)
                  </label>
                  <textarea
                    id="memberUsernames"
                    name="memberUsernames"
                    required
                    value={formData.memberUsernames}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors resize-none"
                    placeholder="username1, username2, username3"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-zinc-500">
                    Enter usernames separated by commas. You will be automatically added as a member.
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : roomType === "private" ? (
                "Start Chat"
              ) : (
                "Create Group"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {/* <Link
              href="/"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ← Back to Home
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  );
}

