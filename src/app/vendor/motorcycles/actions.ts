'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addMotorcycle(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('motorcycles').insert({
    vendor_id: user.id,
    model: formData.get('model') as string,
    plate_number: formData.get('plate_number') as string,
    color: (formData.get('color') as string) || null,
    year: formData.get('year') ? Number(formData.get('year')) : null,
    daily_price: Number(formData.get('daily_price')),
    status: (formData.get('status') as string) || 'available',
  })

  if (error) return { error: error.message }
  revalidatePath('/vendor/motorcycles')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}

export async function updateMotorcycle(
  motorcycleId: string,
  data: {
    model: string
    plate_number: string
    color: string | null
    year: number | null
    daily_price: number
    status: string
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('motorcycles')
    .update(data)
    .eq('id', motorcycleId)

  if (error) return { error: error.message }
  revalidatePath('/vendor/motorcycles')
  return { success: true }
}

export async function updateMotorcycleStatus(motorcycleId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('motorcycles')
    .update({ status })
    .eq('id', motorcycleId)

  if (error) return { error: error.message }
  revalidatePath('/vendor/motorcycles')
  revalidatePath('/vendor/dashboard')
  return { success: true }
}
