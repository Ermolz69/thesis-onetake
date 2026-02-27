import { Link } from 'react-router-dom'
import { routes } from '@/shared/config'
import { Button, Card } from '@/shared/ui'

export const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-fg-primary">OneTake</h1>
        <p className="text-xl text-fg-secondary max-w-2xl mx-auto">
          Share your audio and video content with the world
        </p>

        <div className="flex justify-center gap-4">
          <Link to={routes.posts}>
            <Button variant="primary" size="lg">
              Browse Posts
            </Button>
          </Link>
          <Link to={routes.auth.login}>
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card>
            <h3 className="text-xl font-semibold text-fg-primary mb-2">Audio & Video</h3>
            <p className="text-fg-secondary">
              Share your creative content in audio or video format
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold text-fg-primary mb-2">Discover</h3>
            <p className="text-fg-secondary">
              Explore content from creators around the world
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold text-fg-primary mb-2">Connect</h3>
            <p className="text-fg-secondary">
              Like, comment, and engage with the community
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

