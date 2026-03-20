import { useEffect, useState, FormEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
          Back
        </Button>
        <Card radius="xl" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-text-primary">Edit profile</h1>
            <p className="text-text-secondary">Update your public identity and profile details.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Full name"
              variant="filled"
            />
            <Input
              label="Bio"
              value={form.bio ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value || null }))}
              placeholder="Bio"
              variant="filled"
            />
            <Input
              label="Avatar URL"
              value={form.avatarUrl ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value || null }))}
              placeholder="https://..."
              variant="filled"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                tone="neutral"
                onClick={() => navigate(profile ? routes.profile(profile.userId) : routes.posts)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
