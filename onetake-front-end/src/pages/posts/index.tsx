import { PostsList } from '@/widgets/posts-list';

export const PostsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-fg-primary mb-8">Posts</h1>
      <PostsList />
    </div>
  );
};
