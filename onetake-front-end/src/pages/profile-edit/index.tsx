import { useEffect, useState, FormEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/app/providers/i18n';
import { userApi, type Profile, type UpdateProfileRequest } from '@/entities/user';
import { Button, Card, Input, Loader } from '@/shared/ui';
import { routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';
import { contentContainer, contentShell } from '@/shared/ui/recipes';

export const ProfileEditPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();
  const [form, setForm] = useState<UpdateProfileRequest>({
    fullName: '',
    bio: null,
    avatarUrl: null,
  });

  useEffect(() => {
    if (!currentUser?.id) {
      navigate(routes.auth.login);
      return;
    }
    userApi
      .getProfile(currentUser.id)
      .then((p) => {
        setProfile(p);
        setForm({
          fullName: p.fullName || '',
          bio: p.bio ?? null,
          avatarUrl: p.avatarUrl ?? null,
        });
      })
      .catch(() => navigate(routes.posts))
      .finally(() => setLoading(false));
  }, [currentUser?.id, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateProfile(form);
      navigate(profile ? routes.profile(profile.userId) : routes.posts);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={contentShell}>
        <div className={`${contentContainer} flex justify-center py-12`}>
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={contentShell}>
      <div className={`${contentContainer} max-w-2xl space-y-6 py-8`}>
        <Button variant="ghost" tone="neutral" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
        <Card radius="xl" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-text-primary">{t('profileEdit.title')}</h1>
            <p className="text-text-secondary">{t('profileEdit.subtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('profileEdit.fullName')}
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder={t('profileEdit.fullNamePlaceholder')}
              variant="filled"
            />
            <Input
              label={t('profileEdit.bio')}
              value={form.bio ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value || null }))}
              placeholder={t('profileEdit.bioPlaceholder')}
              variant="filled"
            />
            <Input
              label={t('profileEdit.avatarUrl')}
              value={form.avatarUrl ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value || null }))}
              placeholder={t('profileEdit.avatarPlaceholder')}
              variant="filled"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? t('profileEdit.saving') : t('common.save')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                tone="neutral"
                onClick={() => navigate(profile ? routes.profile(profile.userId) : routes.posts)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
