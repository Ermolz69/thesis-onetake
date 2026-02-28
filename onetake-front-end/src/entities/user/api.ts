import { http } from '@/shared/api';
import { api } from '@/shared/config';
import type { Profile, UpdateProfileRequest } from './types';

export const userApi = {
  getProfile: async (id: string): Promise<Profile> => {
    return http.get<Profile>(api.endpoints.users.profile(id));
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<void> => {
    return http.put(api.endpoints.users.updateProfile, data);
  },

  follow: async (id: string): Promise<void> => {
    return http.post(api.endpoints.users.follow(id));
  },

  unfollow: async (id: string): Promise<void> => {
    return http.delete(api.endpoints.users.unfollow(id));
  },
};
