import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { error } = await supabase.from('users').select('count')

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Lajo Web Dashboard</h1>
      {error ? (
        <p style={{ color: 'red' }}>Connection failed: {error.message}</p>
      ) : (
        <p style={{ color: 'green' }}>✅ Supabase connected!</p>
      )}
    </main>
  )
}