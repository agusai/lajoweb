import { createClient } from '@/lib/supabase/server'
import { LicensesTable } from './licenses-table'

export type LicenseRow = {
  id: string
  image_url: string | null
  license_number: string | null
  expiry_date: string | null
  verification_status: string
  ocr_confidence: number | null
}

export default async function LicensesPage() {
  const supabase = await createClient()
  const { data: licenses } = await supabase
    .from('licenses')
    .select('id, image_url, license_number, expiry_date, verification_status, ocr_confidence')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#F5F7FA]">Licenses</h1>
      <LicensesTable licenses={(licenses ?? []) as LicenseRow[]} />
    </div>
  )
}
