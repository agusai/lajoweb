'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LoginState = { error?: string } | null

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-4xl font-bold text-white tracking-tight">LAJO</span>
          </div>
          <h1 className="text-xl font-semibold text-[#F5F7FA]">Welcome back</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Sign in to manage your rental business</p>
        </div>

        <div className="bg-[#132A4D] rounded-2xl border border-white/8 p-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[#F5F7FA] text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@example.com"
                autoComplete="email"
                className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8] focus-visible:ring-[#FF6A00] focus-visible:border-[#FF6A00]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[#F5F7FA] text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-white/5 border-white/10 text-[#F5F7FA] placeholder:text-[#94A3B8] focus-visible:ring-[#FF6A00] focus-visible:border-[#FF6A00]"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-red-400 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                {state.error}
              </p>
            )}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full mt-1 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-semibold h-10"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
