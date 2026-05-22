'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleVendorStatus(vendorId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', vendorId)

  if (error) return { error: error.message }
  revalidatePath('/admin/vendors')
  return { success: true }
}

export async function toggleVendorStatusWithReason(
  vendorId: string,
  isActive: boolean,
  reason: string
) {
  const supabase = await createClient()
  const updateData: Record<string, unknown> = { is_active: isActive }
  if (!isActive && reason) updateData.suspension_reason = reason

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', vendorId)

  if (error) return { error: error.message }
  revalidatePath('/admin/vendors')
  return { success: true }
}

export async function approveVendor(vendorId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_verified: true })
    .eq('id', vendorId)

  if (error) return { error: error.message }
  revalidatePath('/admin/vendors')
  return { success: true }
}
