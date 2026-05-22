'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileUpdateData = {
  name: string
  phone: string
  date_of_birth: string
  address: string
  city: string
  state: string
  postcode: string
  emergency_contact: string
  bank_account: string
  bank_name: string
  company_name: string
  company_reg_number: string
  tax_id: string
  ic_number: string
  avatar_url?: string
}

export async function updateProfile(data: ProfileUpdateData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updatePayload: Record<string, string | null> = {}
  const fields: (keyof ProfileUpdateData)[] = [
    'name', 'phone', 'date_of_birth', 'address', 'city', 'state',
    'postcode', 'emergency_contact', 'bank_account', 'bank_name',
    'company_name', 'company_reg_number', 'tax_id', 'ic_number',
  ]
  for (const field of fields) {
    updatePayload[field] = (data[field] as string) || null
  }
  if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url || null

  const { error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/vendor/profile')
  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  return { success: true, url: urlData.publicUrl }
}
