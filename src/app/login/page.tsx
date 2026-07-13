'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, Factory, ClipboardList, BarChart3, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/lib/api/auth'
import { setSession } from '@/lib/auth'
import { BrandLogo } from '@/components/layout/brand-logo'

const FEATURES = [
  { icon: Factory,       label: 'Production Management',  desc: 'Job cards, scheduling & shop floor control' },
  { icon: Package,       label: 'Inventory & Stores',      desc: 'Material tracking, cutting & issue workflow' },
  { icon: ClipboardList, label: 'Sales & Procurement',     desc: 'Orders, estimations & purchase flow' },
  { icon: BarChart3,     label: 'Reports & Analytics',     desc: 'Real-time dashboards and MIS reports' },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Enter username and password')
      return
    }
    setLoading(true)
    try {
      const session = await authService.login(username.trim(), password)
      setSession(session)
      toast.success(`Welcome, ${session.fullName}!`)
      router.replace('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: Branding ── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-slate-900 text-white px-12 py-10 relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top: Logo + wordmark */}
        <div className="relative z-10">
          <BrandLogo
            className="h-14 w-auto max-w-[280px] object-contain bg-white rounded-xl px-5 py-3 shadow-lg"
            fallback={
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Factory className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-none">MultiHitech</p>
                  <p className="text-xs text-slate-400 tracking-widest uppercase">ERP System</p>
                </div>
              </div>
            }
          />
        </div>

        {/* Middle: Headline + features */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight">
              Manufacturing<br />
              <span className="text-blue-400">Excellence</span> Platform
            </h1>
            <p className="text-slate-400 text-base max-w-sm leading-relaxed">
              End-to-end ERP built for precision manufacturing — from sales order to delivery challan.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer note */}
        <div className="relative z-10 text-xs text-slate-600">
          &copy; {new Date().getFullYear()} MultiHitech Industries. All rights reserved.
        </div>
      </div>

      {/* ── Right panel: Login form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center justify-center">
            <BrandLogo
              className="h-10 w-auto max-w-[220px] object-contain"
              fallback={
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center">
                    <Factory className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">MultiHitech ERP</span>
                </div>
              }
            />
          </div>

          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access the system</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-slate-700 font-medium">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2 text-sm font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Footer hint */}
          <p className="text-center text-xs text-slate-400">
            Contact your system administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
