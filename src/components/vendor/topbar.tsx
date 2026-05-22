'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

interface VendorTopbarProps {
  user: { name: string | null; email: string | null }
}

export function VendorTopbar({ user }: VendorTopbarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = user.name ?? user.email ?? 'Vendor'
  const initials = (user.name ?? user.email ?? 'V')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="h-14 border-b border-white/8 bg-[#132A4D] flex items-center justify-between px-6 pl-14 md:pl-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-[#94A3B8]">{displayName}</span>
        <div className="flex size-8 items-center justify-center rounded-full bg-[#FF6A00] text-white text-xs font-bold">
          {initials}
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center justify-center size-8 rounded-lg text-[#94A3B8] hover:text-[#F5F7FA] hover:bg-white/5 transition-colors"
        >
          <LogOut className="size-4" />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    </header>
  )
}
