import { APIRequestContext } from '@playwright/test';
import { ApiClient } from '../../../../shared/utils/api-client';

/** Shapes returned by JSONPlaceholder /posts endpoints */
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface NewPost {
  userId: number;
  title: string;
  body: string;
}

/**
 * PostsClient – encapsulates all calls to the /posts resource.
 *
 * Using an API client in BDD Before hooks means we can seed test data
 * without clicking through the UI, keeping UI scenarios fast (ISTQB TM
 * recommends minimising unnecessary test steps to reduce execution time).
 */
export class PostsClient extends ApiClient {
  constructor(api: APIRequestContext) {
    super(api);
  }

  async getAll(): Promise<{ status: number; body: Post[] }> {
    return this.get<Post[]>('/posts');
  }

  async getById(id: number): Promise<{ status: number; body: Post }> {
    return this.get<Post>(`/posts/${id}`);
  }

  async create(post: NewPost): Promise<{ status: number; body: Post }> {
    return this.post<Post>('/posts', post);
  }

  async update(id: number, post: Partial<Post>): Promise<{ status: number; body: Post }> {
    return this.put<Post>(`/posts/${id}`, post);
  }

  async remove(id: number): Promise<{ status: number; body: unknown }> {
    return this.delete<unknown>(`/posts/${id}`);
  }
}
