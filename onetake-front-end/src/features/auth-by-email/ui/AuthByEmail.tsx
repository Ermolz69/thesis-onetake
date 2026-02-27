import { useState, FormEvent } from 'react'
import { Input, Button } from '@/shared/ui'
import { http } from '@/shared/api'
import { api, storage, storageKeys } from '@/shared/config'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/shared/config'

interface LoginFormData {
  login: string
  password: string
}

interface AuthResponse {
  id: string
  username: string
  email: string
  token: string
}

export const AuthByEmail = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginFormData>({ login: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}

    if (!formData.login.trim()) {
      newErrors.login = 'Login is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await http.post<AuthResponse>(api.endpoints.auth.login, {
        login: formData.login,
        password: formData.password,
      })

      storage.set(storageKeys.auth.token, response.token)
      storage.set(storageKeys.auth.user, {
        id: response.id,
        username: response.username,
        email: response.email,
      })

      navigate(routes.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />
      <div className="relative backdrop-blur-xl bg-[rgba(30,16,60,0.55)] border border-white/12 rounded-3xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Input
              label="Email or Username"
              type="text"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              error={errors.login}
              disabled={isLoading}
              autoComplete="username"
              variant="auth"
            />
          </div>

          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              disabled={isLoading}
              autoComplete="current-password"
              variant="auth"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full relative overflow-hidden group disabled:opacity-50 mt-8"
            disabled={isLoading}
          >
            <span className="relative z-10 font-semibold text-lg transition-all duration-300 group-hover:scale-105" style={{ fontWeight: 600, letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-pink-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </form>
      </div>
    </div>
  )
}

