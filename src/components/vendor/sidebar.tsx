'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Motorbike, TrendingUp, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/motorcycles', label: 'My Motorcycles', icon: Motorbike },
  { href: '/vendor/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/vendor/profile', label: 'Profile', icon: User },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="fixed top-3.5 left-3.5 z-50 md:hidden flex items-center justify-center size-8 rounded-lg bg-[#132A4D] text-[#F5F7FA] hover:bg-[#1A3565]"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-[#132A4D] border-r border-white/8 p-4 flex flex-col gap-6 transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <span className="text-2xl font-bold text-white tracking-tight">LAJO</span>
          <span className="text-xs font-semibold text-[#FF9B4D] uppercase tracking-widest mt-1">Vendor</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#FF6A00]/15 text-[#FF9B4D] border-l-2 border-[#FF6A00] pl-[10px]'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F5F7FA] border-l-2 border-transparent'
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
