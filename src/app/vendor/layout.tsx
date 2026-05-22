import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VendorSidebar } from '@/components/vendor/sidebar'
import { VendorTopbar } from '@/components/vendor/topbar'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('user_type, name, email')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'vendor') redirect('/login')

  return (
    <div className="flex min-h-screen bg-muted/20">
      <VendorSidebar />
      <div className="flex flex-col flex-1 md:ml-60 min-w-0">
        <VendorTopbar user={{ name: profile.name, email: profile.email ?? user.email ?? null }} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
