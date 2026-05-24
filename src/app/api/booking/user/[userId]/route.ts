import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsResponse, corsOptions, corsError } from '../../../../../lib/cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await ctx.params;

    if (!userId) {
      return corsError('Missing userId', 400);
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        motorcycles (
          id,
          model,
          brand,
          image_url,
          daily_price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return corsError(error.message, 500);
    }

    return corsResponse({ status: 'success', data: data ?? [] });
  } catch (err: any) {
    return corsError(err.message ?? 'Internal server error', 500);
  }
}
