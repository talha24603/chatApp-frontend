"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(
    user?.profileImage || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // if (!isAuthenticated) {
    //   router.push("/signin");
    //   return;
    // }
    if (user) {
      setUsername(user.username);
      setPreviewImage(user.profileImage || null);
    }
  }, [isAuthenticated, user, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setProfileImage(file);
      setError("");
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!token || !user) {
      setError("You must be logged in to update your profile");
      setLoading(false);
      return;
    }

    try {
      const updateData: { username?: string; profileImage?: File } = {};
      
      if (username.trim() !== user.username) {
        updateData.username = username.trim();
      }
      
      if (profileImage) {
        updateData.profileImage = profileImage;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length === 0) {
        setError("No changes to save");
        setLoading(false);
        return;
      }

      const response = await updateProfile(updateData, token);
      
      // Update user in context
      updateUser({
        id: response.user.id,
        username: response.user.username,
        profileImage: response.user.profileImage,
      });

      setSuccess("Profile updated successfully!");
      setProfileImage(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewImage(user?.profileImage || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/chat"
            className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Back to Chat
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={logout}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-zinc-400">
              Update your profile information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div
                onClick={handleImageClick}
                className="w-32 h-32 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-gray-900 dark:text-white font-semibold text-4xl cursor-pointer hover:bg-gray-400 dark:hover:bg-zinc-600 transition-colors overflow-hidden border-4 border-gray-400 dark:border-zinc-600 mb-4"
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-900 dark:text-white rounded-lg text-sm transition-colors"
                >
                  Edit Image
                </button>
                {previewImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                Click image or button to upload (max 5MB)
              </p>
            </div>

            {/* Username */}
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
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-colors"
                placeholder="Enter your username"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href="/chat"
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
