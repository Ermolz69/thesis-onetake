import { PostsList } from '@/widgets/posts-list';
import { useI18n } from '@/app/providers/i18n';
import { contentContainer, contentShell } from '@/shared/ui/recipes';

export const PostsPage = () => {
  const { t } = useI18n();

  return (
    <div className={contentShell}>
      <div className={`${contentContainer} space-y-8 py-8`}>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            {t('posts.title')}
          </h1>
          <p className="text-text-secondary">{t('posts.subtitle')}</p>
        </div>
        <PostsList />
      </div>
    </div>
  );
};
