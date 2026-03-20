import { PostsList } from '@/widgets/posts-list';
import { contentContainer, contentShell } from '@/shared/ui/recipes';

export const PostsPage = () => {
  return (
    <div className={contentShell}>
      <div className={`${contentContainer} space-y-8 py-8`}>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Posts</h1>
          <p className="text-text-secondary">
            Browse the latest recordings, uploads, and recommendations.
          </p>
        </div>
        <PostsList />
      </div>
    </div>
  );
};
