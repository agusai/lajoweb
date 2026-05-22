'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 pl-14 md:pl-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-muted-foreground">{displayName}</span>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
          <LogOut className="size-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  )
}
