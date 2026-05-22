'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMotorcycleStatus(motorcycleId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('motorcycles')
    .update({ status })
    .eq('id', motorcycleId)

  if (error) return { error: error.message }
  revalidatePath('/admin/motorcycles')
  return { success: true }
}
