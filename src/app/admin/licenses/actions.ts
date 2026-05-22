'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveLicense(licenseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('licenses')
    .update({ verification_status: 'verified' })
    .eq('id', licenseId)

  if (error) return { error: error.message }
  revalidatePath('/admin/licenses')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function rejectLicense(licenseId: string, reason: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('licenses')
    .update({
      verification_status: 'failed',
      manual_review_notes: reason,
      manual_review_required: false,
    })
    .eq('id', licenseId)

  if (error) return { error: error.message }
  revalidatePath('/admin/licenses')
  return { success: true }
}
