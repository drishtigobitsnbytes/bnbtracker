import { NextResponse } from 'next/server'
import { recordEmailOpen } from '@/lib/record-open'

const TRANSPARENT_PIXEL = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
  (char) => char.charCodeAt(0)
)

const PIXEL_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
}

export const dynamic = 'force-dynamic'

function pixelResponse() {
  return new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: PIXEL_HEADERS,
  })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params

  // Fire-and-forget: record the open but don't block the pixel response.
  // We still await to ensure it completes within the Worker's lifetime.
  try {
    await recordEmailOpen(request, token)
  } catch (error) {
    console.error('[Tracking] Unexpected error:', error)
  }

  return pixelResponse()
}

export function HEAD() {
  return pixelResponse()
}
