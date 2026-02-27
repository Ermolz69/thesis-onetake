import { createBrowserRouter, RouterProvider as ReactRouterProvider, Outlet } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { routes } from '@/shared/config'
import { Loader } from '@/shared/ui'
import { Layout } from '@/widgets/layout'

const HomePage = lazy(() => import('@/pages/home/index.tsx').then(m => ({ default: m.HomePage })))
const PostsPage = lazy(() => import('@/pages/posts/index.tsx').then(m => ({ default: m.PostsPage })))
const PostDetailsPage = lazy(() => import('@/pages/post-details/index.tsx').then(m => ({ default: m.PostDetailsPage })))
const AuthPage = lazy(() => import('@/pages/auth/index.tsx').then(m => ({ default: m.AuthPage })))

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
        path: routes.postDetails(':id'),
        element: (
          <Suspense fallback={<Loader size="lg" centered />}>
            <PostDetailsPage />
          </Suspense>
        ),
      },
    ],
  },
])

export const RouterProvider = () => {
  return <ReactRouterProvider router={router} />
}

