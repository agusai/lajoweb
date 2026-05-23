import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'
import { corsResponse, corsError, corsOptions } from '@/lib/cors'

export function OPTIONS() { return corsOptions() }

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient()

    const { data, error } = await supabase
      .from('motorcycles')
      .select('id, name, brand, model, year, color, transmission, engine_cc, fuel_capacity, max_speed, daily_price, plate_number, condition, total_stock, available_stock, image_url, gallery_urls, features, description')
      .eq('status', 'available')
      .gt('available_stock', 0)
      .order('daily_price', { ascending: true })

    if (error) return corsError(error.message, 500)

    return corsResponse({ status: 'success', message: 'Senarai motosikal berjaya diambil.', data }, { status: 200 })
  } catch (err: any) {
    return corsError(err.message ?? 'Ralat pelayan dalaman.', 500)
  }
}