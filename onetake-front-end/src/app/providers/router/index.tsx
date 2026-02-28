import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
  Outlet,
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { routes } from '@/shared/config';
import { Loader } from '@/shared/ui';
import { Layout } from '@/widgets/layout';

const HomePage = lazy(() =>
  import('@/pages/home/index.tsx').then((m) => ({ default: m.HomePage }))
);
const PostsPage = lazy(() =>
  import('@/pages/posts/index.tsx').then((m) => ({ default: m.PostsPage }))
);
const RecordPage = lazy(() =>
  import('@/pages/record/index.tsx').then((m) => ({ default: m.RecordPage }))
);
const RecordControlsPage = lazy(() =>
  import('@/pages/record-controls/index.tsx').then((m) => ({ default: m.RecordControlsPage }))
);
const PostDetailsPage = lazy(() =>
  import('@/pages/post-details/index.tsx').then((m) => ({ default: m.PostDetailsPage }))
);
const ProfilePage = lazy(() =>
  import('@/pages/profile/index.tsx').then((m) => ({ default: m.ProfilePage }))
);
const ProfileEditPage = lazy(() =>
  import('@/pages/profile-edit/index.tsx').then((m) => ({ default: m.ProfileEditPage }))
);
const NotificationsPage = lazy(() =>
  import('@/pages/notifications/index.tsx').then((m) => ({ default: m.NotificationsPage }))
);
const AuthPage = lazy(() =>
  import('@/pages/auth/index.tsx').then((m) => ({ default: m.AuthPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/not-found/index.tsx').then((m) => ({ default: m.NotFoundPage }))
);

const router = createBrowserRouter([
  {
    path: routes.auth.login,
    element: (
      <Suspense fallback={<Loader size="lg" centered />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: routes.auth.register,
    element: (
      <Suspense fallback={<Loader size="lg" centered />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: routes.recordControls,
    element: (
      <Suspense fallback={<Loader size="lg" centered />}>
        <RecordControlsPage />
      </Suspense>
    ),
  },
  {
    element: (
      <Layout>
        <Outlet />
      </Layout>
    ),
    children: [
      {
        path: routes.home,
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: routes.posts,
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <PostsPage />
          </Suspense>
        ),
      },
      {
        path: routes.record,
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <RecordPage />
          </Suspense>
        ),
      },
      {
        path: routes.postDetails(':id'),
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <PostDetailsPage />
          </Suspense>
        ),
      },
      {
        path: '/users/:id',
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: routes.profileEdit,
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <ProfileEditPage />
          </Suspense>
        ),
      },
      {
        path: routes.notifications,
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export const RouterProvider = () => {
  return <ReactRouterProvider router={router} />;
};
