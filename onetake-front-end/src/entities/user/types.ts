export interface Profile {
  userId: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
}
