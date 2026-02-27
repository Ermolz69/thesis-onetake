import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/shared/config'
import { Button, MoonIcon, SunIcon } from '@/shared/ui'
import { useTheme } from '@/app/providers/theme'

export interface LayoutProps {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-bg-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={routes.home} className="text-2xl font-bold text-fg-primary">
              OneTake
            </Link>
            <nav className="flex items-center gap-3">
              <Link to={routes.posts}>
                <Button variant="ghost" className="relative overflow-hidden group">
                  <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                    Posts
                  </span>
                  <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Button>
              </Link>
              <Link to={routes.auth.login}>
                <Button variant="outline" className="relative overflow-hidden group border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                  <span className="relative z-10 font-semibold transition-all duration-300 group-hover:scale-105">
                    Sign In
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </Link>
              <Button variant="ghost" onClick={toggleTheme} className="p-2 relative overflow-hidden group rounded-full hover:bg-bg-secondary transition-all duration-300">
                <span className="relative z-10 transform transition-transform duration-500 group-hover:rotate-180">
                  {theme === 'light' ? (
                    <MoonIcon className="w-5 h-5" color="currentColor" />
                  ) : (
                    <SunIcon className="w-5 h-5" color="currentColor" />
                  )}
                </span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}

