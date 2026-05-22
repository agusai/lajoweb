import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopbar } from '@/components/admin/topbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('user_type, name, email')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') redirect('/login')

  return (
    <div className="flex min-h-screen bg-[#0D1B2A]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 md:ml-60 min-w-0">
        <AdminTopbar user={{ name: profile.name, email: profile.email ?? user.email ?? null }} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
