import { http } from '@/shared/api'
import { api } from '@/shared/config'
import type { Post, PagedPostResponse } from './types'

export const postApi = {
  getPosts: async (params?: {
    tag?: string
    authorId?: string
    cursor?: string
    pageSize?: number
  }): Promise<PagedPostResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.tag) searchParams.append('tag', params.tag)
    if (params?.authorId) searchParams.append('authorId', params.authorId)
    if (params?.cursor) searchParams.append('cursor', params.cursor)
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString())

    const query = searchParams.toString()
    const url = query ? `${api.endpoints.products.list}?${query}` : api.endpoints.products.list

    return http.get<PagedPostResponse>(url)
  },

  getPostById: async (id: string): Promise<Post> => {
    return http.get<Post>(api.endpoints.products.details(id))
  },

  createPost: async (data: FormData): Promise<Post> => {
    return http.post<Post>(api.endpoints.products.create, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  deletePost: async (id: string): Promise<void> => {
    return http.delete(api.endpoints.products.delete(id))
  },

  likePost: async (id: string): Promise<void> => {
    return http.post(api.endpoints.products.like(id))
  },

  unlikePost: async (id: string): Promise<void> => {
    return http.delete(api.endpoints.products.unlike(id))
  },
}

