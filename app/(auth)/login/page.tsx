'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/context/language-context'
import type { Lang } from '@/lib/i18n/translations'

export default function LoginPage() {
  const router = useRouter()
  const { t, lang, setLang } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError(t('login.error'))
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    setError('')

    try {
      await fetch('/api/seed', { method: 'POST' })
    } catch {}

    const result = await signIn('credentials', {
      email: 'demo@rentalmanager.es',
      password: 'demo1234',
      redirect: false,
    })

    if (result?.error) {
      setError(t('login.demo_error'))
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const langs: { value: Lang; label: string; flag: string }[] = [
    { value: 'es', label: 'ES', flag: '🇪🇸' },
    { value: 'en', label: 'EN', flag: '🇬🇧' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language selector */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-1.5 py-1 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-gray-400 mx-1" />
            {langs.map((l) => (
              <button
                key={l.value}
                onClick={() => setLang(l.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  lang === l.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('app.name')}</h1>
          <p className="text-gray-500 mt-1">{t('app.tagline')}</p>
          <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-400">
            v0.2.1
          </span>
        </div>

        <Card className="shadow-xl border-gray-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t('login.title')}</CardTitle>
            <CardDescription>{t('login.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('login.submit')}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">{t('login.or')}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={handleDemo}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('login.demo')}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              {t('login.no_account')}{' '}
              <Link href="/registro" className="text-blue-600 hover:underline font-medium">
                {t('login.register_link')}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Demo: demo@rentalmanager.es / demo1234
        </p>
      </div>
    </div>
  )
}
