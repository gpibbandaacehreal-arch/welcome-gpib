import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { error } = await supabase
    .from('riwayat_download')
    .select('id')
    .limit(1)

  if (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    })
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}