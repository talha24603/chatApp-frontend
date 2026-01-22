const API_BASE_URL = "http://localhost:5000";

export interface RegisterData {
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    profileImage?: string;
  };
  error?: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || result.error || "Registration failed");
  }
  return result;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || result.error || "Login failed");
  }
  return result;
}

export interface RoomMember {
  _id: string;
  username: string;
  profileImage?: string;
}

export interface Room {
  _id: string;
  name?: string;
  isGroup: boolean;
  profileImage?: string;
  members: RoomMember[] | string[];
  createdBy?: RoomMember | string;
  admin?: RoomMember | string;
  updatedAt?: string;
  createdAt?: string;
}

export interface CreatePrivateRoomData {
  user1: string;
  user2: string;
}

export interface CreateGroupRoomData {
  name: string;
  memberIds: string[];
  createdBy: string;
}

export async function createPrivateRoom(
  data: CreatePrivateRoomData,
  token: string
): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/api/room/private-room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create private room");
  }
  return result;
}

export async function createGroupRoom(
  data: CreateGroupRoomData,
  token: string
): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/api/room/group-room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create group room");
  }
  return result;
}

export async function getUserRooms(
  userId: string,
  token: string
): Promise<Room[]> {
  const response = await fetch(`${API_BASE_URL}/api/room/user/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch rooms");
  }
  return result;
}

export interface Message {
  _id: string;
  room: string | { _id: string };
  sender: {
    _id: string;
    username: string;
  } | string;
  text: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getRoomMessages(
  roomId: string,
  token: string
): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/api/messages/room/${roomId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch messages");
  }
  return result;
}

export async function getOnlineUsers(token: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/users/online`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch online users");
  }
  return result.onlineUserIds || [];
}

export interface UpdateProfileData {
  username?: string;
  profileImage?: File;
}

export interface UpdateProfileResponse {
  message: string;
  user: {
    id: string;
    username: string;
    profileImage: string;
  };
}

export async function updateProfile(
  data: UpdateProfileData,
  token: string
): Promise<UpdateProfileResponse> {
  const formData = new FormData();
  
  if (data.username) {
    formData.append("username", data.username);
  }
  
  if (data.profileImage) {
    formData.append("profileImage", data.profileImage);
  }

  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to update profile");
  }
  return result;
}

export interface UpdateRoomProfileResponse {
  message: string;
  room: Room;
}

export async function updateRoomProfile(
  roomId: string,
  profileImage: File,
  token: string
): Promise<UpdateRoomProfileResponse> {
  const formData = new FormData();
  formData.append("profileImage", profileImage);

  const response = await fetch(`${API_BASE_URL}/api/room/${roomId}/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to update room profile");
  }
  return result;
}

export async function uploadMessageImage(
  image: File,
  token: string
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("image", image);

  const response = await fetch(`${API_BASE_URL}/api/messages/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to upload image");
  }
  return result;
}

export async function deleteMessage(
  messageId: string,
  token: string
): Promise<{ message: string ; messageId: string; }> {
  const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to delete message");
  }
  return result;
}