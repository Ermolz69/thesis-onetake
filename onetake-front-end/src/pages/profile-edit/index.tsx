import { useEffect, useState, FormEvent, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, type Profile, type UpdateProfileRequest } from '@/entities/user';
import { Button, Card, Input, Loader } from '@/shared/ui';
import { routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';

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
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Back
      </Button>
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-fg-primary mb-6">Edit profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg-secondary mb-1">Full name</label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-secondary mb-1">Bio</label>
            <Input
              value={form.bio ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value || null }))}
              placeholder="Bio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-secondary mb-1">Avatar URL</label>
            <Input
              value={form.avatarUrl ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value || null }))}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(profile ? routes.profile(profile.userId) : routes.posts)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
