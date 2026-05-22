'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !user) {
    return { error: error?.message ?? 'Login failed' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type === 'vendor') {
    redirect('/vendor/dashboard')
  }

  redirect('/admin/dashboard')
}
