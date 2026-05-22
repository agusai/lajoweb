import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'
import type { ProfileUpdateData } from './actions'

export default async function VendorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(
      'name, ic_number, phone, email, date_of_birth, address, city, state, postcode, emergency_contact, bank_account, bank_name, company_name, company_reg_number, tax_id, avatar_url'
    )
    .eq('id', user.id)
    .single()

  const raw = (profile ?? {}) as Record<string, unknown>

  const formData: ProfileUpdateData & { email: string; avatar_url: string | null } = {
    name: (raw.name as string) ?? '',
    ic_number: (raw.ic_number as string) ?? '',
    phone: (raw.phone as string) ?? '',
    date_of_birth: (raw.date_of_birth as string) ?? '',
    address: (raw.address as string) ?? '',
    city: (raw.city as string) ?? '',
    state: (raw.state as string) ?? '',
    postcode: (raw.postcode as string) ?? '',
    emergency_contact: (raw.emergency_contact as string) ?? '',
    bank_account: (raw.bank_account as string) ?? '',
    bank_name: (raw.bank_name as string) ?? '',
    company_name: (raw.company_name as string) ?? '',
    company_reg_number: (raw.company_reg_number as string) ?? '',
    tax_id: (raw.tax_id as string) ?? '',
    email: (raw.email as string) ?? user.email ?? '',
    avatar_url: (raw.avatar_url as string) ?? null,
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">My Profile</h1>
      <ProfileForm profile={formData} />
    </div>
  )
}
